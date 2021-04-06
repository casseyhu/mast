const database = require('../config/database.js');
const Papa = require('papaparse');
const fs = require('fs');
const moment = require('moment');
const IncomingForm = require('formidable').IncomingForm;
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');

const CourseOffering = database.CourseOffering;
const CoursePlan = database.CoursePlan;
const CoursePlanItem = database.CoursePlanItem;
const Student = database.Student;



// Upload course offerings
exports.upload = (req, res) => {
  var form = new IncomingForm()
  form.parse(req).on('file', (field, file) => {
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      res.status(500).send('File must be *.csv')
      return
    }
    const fileIn = fs.readFileSync(file.path, 'utf-8')
    Papa.parse(fileIn, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        var header = results.meta['fields']
        if (header[0] !== 'department'
          && header[1] !== 'course_num'
          && header[2] !== 'section'
          && header[3] !== 'semester'
          && header[4] !== 'year'
          && header[5] !== 'timeslot') {
          console.log('invalid csv')
          res.status(500).send("Cannot parse CSV file - headers do not match specifications")
          return
        }
        uploadCourses(results, res)
      }
    })
  })
};


async function uploadCourses(results, res) {
  let semestersCovered = await deleteSemestersFromDB(results)
  let coursesAdded = await uploadNewOfferings(results)
  // Get all course plans. 
  let coursePlans = await CoursePlan.findAll()
  let affectedStudents = []
  // For every semester covered by the csv, 
  // ["Fall 2019", "Fall 2020"]
  for (let i = 0; i < semestersCovered.length; i++) {
    semYear = semestersCovered[i].split(' ')
    // For every coursePlan, query the CoursePlanItem table where:
    // coursePlanId == this.coursePlanId, semester+year = current semester and
    // year that we're looking at (outer loop). 
    for (let j = 0; j < coursePlans.length; j++) {
      // CoursePlanItems == All course plan items for specific student 
      // for sem+year
      let coursePlanItems = await CoursePlanItem.findAll({
        where: {
          coursePlanId: coursePlans[j].coursePlanId,
          semester: semYear[0],
          year: semYear[1]
        }
      })
      let toCheck = []
      for (let k = 0; k < coursePlanItems.length; k++) {
        for (let l = 0; l < coursesAdded.length; l++) {
          if (coursePlanItems[k].courseId == coursesAdded[l].identifier)
            toCheck.push(coursesAdded[l])
        }
      }
      // [CSE500, CSE502, CSE503, CSE504, CSE505]
      for (let k = 0; k < toCheck.length; k++) {
        for (let l = k + 1; l < toCheck.length; l++) {
          let first = toCheck[k].days
          let second = toCheck[l].days
          if (!first || !second || !toCheck[k].startTime ||
            !toCheck[l].startTime || !toCheck[k].endTime || !toCheck[l].endTime)
            continue
          if (first.includes('M') && second.includes('M')
            || first.includes('TU') && second.includes('TU')
            || first.includes('W') && second.includes('W')
            || first.includes('TH') && second.includes('TH')
            || first.includes('F') && second.includes('F')) {
            // Check time conflict
            let fStart = toCheck[k].startTime
            let sStart = toCheck[l].startTime
            let fEnd = toCheck[k].endTime
            let sEnd = toCheck[l].endTime
            if ((fStart >= sStart && fStart < sEnd)
              || (fEnd <= sEnd && fEnd > sStart)
              || (sStart >= fStart && sStart < fEnd)
              || (sEnd <= fEnd && sEnd > fStart)) {
              affectedStudents.push(coursePlans[j].studentId)
            }
          }
        }
      }
    }
  }
  var emails = []
  var students = await Student.findAll({
    where: {
      sbuId: affectedStudents
    }
  })
  students.map((student) => { emails.push(student.email) });
  console.log(emails);

  var nodemailer = require('nodemailer');

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mastgrassjelly@gmail.com",
      pass: "cse416@stoller"
    }
  });
  // emails set to our emails
  // emails = ["sooyeon.kim.2@stonybrook.edu", "andrew.kong@stonybrook.edu", "eddie.xu@stonybrook.edu", "cassey.hu@stonybrook.edu"]
  // comment ^ if you don't want it to spam our emails and uncomment v
  emails = [];
  for (var i = 0; i < emails.length; i++) {
    var emailOptions = {
      from: "mastgrassjelly@gmail.com",
      to: emails[i],
      subject: "[ACTION REQUIRED] YOU FAILED CSE 416!!!",
      text: "jk"
    }
    transporter.sendMail(emailOptions, function (err, info) {
      if (err)
        console.log(err);
      else
        console.log("Email sent " + info.response);
    })
  }
  res.status(200).send(affectedStudents)
  return
}




// Notes: Changing the data type of the CourseOffering.section
//  to be a INTEGER instead of a String (since we have sections like):
//  S01, V02, R04, etc. from the scrapes. 
// Everyone will have to DORP TABLE courseofferings, then rerun the 
// server to recreate the table through sequelize. 

async function uploadNewOfferings(csvFile) {
  coursesAdded = []
  for (let i = 0; i < csvFile.data.length; i++) {
    course = csvFile.data[i]
    csvTimeslot = (course.timeslot ? course.timeslot.split(' ') : null)
    day = (csvTimeslot ? csvTimeslot[0] : null)
    timeRange = (csvTimeslot ? csvTimeslot[1].split('-') : null)
    start = (timeRange ? moment(timeRange[0], ['h:mmA']).format('HH:mm') : null)
    end = (timeRange ? moment(timeRange[1], ['h:mmA']).format('HH:mm') : null)
    const newCourse = await CourseOffering.create({
      identifier: course.department + course.course_num,
      semester: course.semester,
      year: course.year,
      section: course.section,
      days: day,
      startTime: start,
      endTime: end
    })
    coursesAdded.push(newCourse)
  }
  console.log("Done importing all courses from csv")
  return coursesAdded;
}



// Scrapes the semesters+years from the parsed CSV file. 
// Then deletes the entries in the CourseOffering Model
// where the semester+year(s) are covered by this new CSV.
// Will return a promise after the await is done. Try to
// catch it in the main loop and handle it in there. 
async function deleteSemestersFromDB(csvFile) {
  semArray = Array.from(new Set(csvFile.data.map(
    course => course.semester + ' ' + course.year)))
  for (let i = 0; i < semArray.length; i++) {
    semyear = semArray[i].split(' ')
    // Might have to CASCADE the deletes to the 
    // CoursePlans that reference these courses (?)
    await CourseOffering.destroy({
      where: {
        semester: semyear[0],
        year: Number(semyear[1])
      }
    })
  }
  console.log("Done deleting all scraped semesters from db")
  return semArray
}
