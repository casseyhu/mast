const database = require('../config/database.js');
const Op = database.Sequelize.Op;
const Papa = require('papaparse');
const fs = require('fs');
const moment = require('moment');
const IncomingForm = require('formidable').IncomingForm;
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');
const Course = database.Course;

const CourseOffering = database.CourseOffering;
const CoursePlan = database.CoursePlan;
const CoursePlanItem = database.CoursePlanItem;
const Student = database.Student;



// Upload course offerings
exports.upload = (req, res) => {
  // console.log(req.query.department)
  var form = new IncomingForm()
  let dept = ''
  form.parse(req).on('field', (name, field) => {
    console.log(name, field)
    if (name === 'dept')
      dept = field;
  }).on('file', (field, file) => {
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
        let courses = []
        let exceptionDepts = ['CHE', 'JRN', 'MEC', 'MCB', 'PHY']
        if(dept === "AMS") {
          courses = results.data.filter(course => course.department === dept || exceptionDepts.includes(course.department))
          dept = [dept].concat(exceptionDepts)
        }
        else {
          courses = results.data.filter(course => course.department === dept)
          dept = [dept]
        }

        uploadCourses(courses, res, dept)
      }
    })
  })
};


async function uploadCourses(results, res, dept) {
  let semestersCovered = await deleteSemestersFromDB(results, dept)
  let coursesAdded = await uploadNewOfferings(results)
  // Get all course plans. 
  let coursePlans = await CoursePlan.findAll()
  let affectedStudents = []
  // For every semester covered by the csv, 
  // ["Fall 2019", "Fall 2020"]
  for (let i = 0; i < semestersCovered.length; i++) {
    semYear = semestersCovered[i].split(' ')
    console.log(semYear)
    let coursesOffered = []
    // For every coursePlan, query the CoursePlanItem table where:
    // coursePlanId == this.coursePlanId, semester+year = current semester and
    // year that we're looking at (outer loop). 
    for (let j = 0; j < coursePlans.length; j++) {
      // CoursePlanItems == All course plan items for specific student 
      // for sem+year that don't have grades
      let coursePlanItems = await CoursePlanItem.findAll({
        where: {
          coursePlanId: coursePlans[j].coursePlanId,
          semester: semYear[0],
          year: semYear[1],
          grade: null //moved this from update
        }
      })
      /* Courses with the same identifiers as those in course plan items are added toCheck
         for further inspection
      */
      let toCheck = []
      let uniqueCourses = []
      for (let k = 0; k < coursePlanItems.length; k++) {
        // checks for students that have time conflicts for that semester + year
        for (let l = 0; l < coursesAdded.length; l++) {
          // push all courses found for that semester
          if(!coursesOffered.includes(coursesAdded[l].identifier) 
            && coursesAdded[l].semester === semYear[0] 
            && coursesAdded[l].year === Number(semYear[1])){
            coursesOffered.push(coursesAdded[l].identifier)
          }
          // include the semester and year to compare
          if (coursePlanItems[k].courseId == coursesAdded[l].identifier 
            && coursesAdded[l].semester === coursePlanItems[k].semester
            && coursesAdded[l].year === coursePlanItems[k].year 
            && !uniqueCourses.includes(coursesAdded[l].identifier)) {
            uniqueCourses.push(coursesAdded[l].identifier)
            toCheck.push(coursesAdded[l])
          }
        }
      }
      // [CSE500, CSE502, CSE503, CSE504, CSE505]
      for (let k = 0; k < toCheck.length; k++) {
        for (let l = k + 1; l < toCheck.length; l++) {
          let first = toCheck[k].days
          let second = toCheck[l].days
          // if(uniqueCourses.length !== 0){
          //   console.log(toCheck[k].identifier, toCheck[l].identifier,first, second, toCheck[k].startTime, toCheck[k].endTime,toCheck[l].startTime, toCheck[l].endTime)
          // }
          if (!first || !second || !toCheck[k].startTime ||
            !toCheck[l].startTime || !toCheck[k].endTime || !toCheck[l].endTime)
            continue
          if ((first.includes('M') && second.includes('M'))
            || (first.includes('TU') && second.includes('TU'))
            || (first.includes('W') && second.includes('W'))
            || (first.includes('TH') && second.includes('TH'))
            || (first.includes('F') && second.includes('F'))) {
            // Check time conflict
            let fStart = toCheck[k].startTime
            let sStart = toCheck[l].startTime
            let fEnd = toCheck[k].endTime
            let sEnd = toCheck[l].endTime
            if ((fStart >= sStart && fStart < sEnd)
              || (fEnd <= sEnd && fEnd > sStart)
              || (sStart >= fStart && sStart < fEnd)
              || (sEnd <= fEnd && sEnd > fStart)) {
              const values = {
                validity: false
              }
              // invalid course plan item = 0
              let firstCheck = await CoursePlanItem.update(values, {
                where: {
                  coursePlanId: coursePlans[j].coursePlanId,
                  courseId: toCheck[k].identifier,
                  //grade: null
                }
              })
              let secondCheck = await CoursePlanItem.update(values, {
                where: {
                  coursePlanId: coursePlans[j].coursePlanId,
                  courseId: toCheck[l].identifier,
                }
              })
              // only pushes to affected students if either item is affected
              if (firstCheck[0] === 1 || secondCheck[0] === 1) {
                affectedStudents.push(coursePlans[j].studentId)
              }
            }
          }
        }
      }
    }
    if(coursesOffered.length > 0){

      // finds all course plans not offered that semester
      let coursesNotOffered = await Course.findAll({where : {
        department: dept, 
        courseId: {[Op.notIn]: coursesOffered},
        semester: semYear[0],
        year: Number(semYear[1])
      }})
      let invalidCoursePlanIds = []
      for(let j = 0; j < coursesNotOffered.length; j++){
        let items = await CoursePlanItem.findAll({where: {
          courseId: coursesNotOffered[j].dataValues.department + coursesNotOffered[j].dataValues.courseNum,
          semester: semYear[0],
          year: Number(semYear[1])
        }})
        // update the validity such that the items are invalid
        for(let k = 0; k < items.length; k++){
          await items[k].update({validity: false})
        }
        if(items)
          items.map(item => !invalidCoursePlanIds.includes(item.coursePlanId) ? invalidCoursePlanIds.push(item.coursePlanId) : '')
      }
      let invalidCoursePlans = await CoursePlan.findAll({where : {coursePlanId : invalidCoursePlanIds}})
      for(let j = 0; j < invalidCoursePlans.length; j++){
        if(!affectedStudents.includes(invalidCoursePlans[j].dataValues.studentId))
          affectedStudents.push(invalidCoursePlans[j].dataValues.studentId)
      }
    }
  }
  var emails = []
  var students = await Student.findAll({
    where: {
      sbuId: affectedStudents,
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


async function uploadNewOfferings(csvFile) {
  coursesAdded = []
  for (let i = 0; i < csvFile.length; i++) {
    course = csvFile[i]
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
async function deleteSemestersFromDB(csvFile, departments) {
  console.log(departments)
  semArray = Array.from(new Set(csvFile.map(
    course => course.semester + ' ' + course.year)))
  for (let i = 0; i < semArray.length; i++) {
    semyear = semArray[i].split(' ')
    // Might have to CASCADE the deletes to the 
    // CoursePlans that reference these courses (?)
    for(let dept of departments) {
      await CourseOffering.destroy({
        where: {
          identifier: {[Op.startsWith] : dept},
          semester: semyear[0],
          year: Number(semyear[1])
        }
      })
    }
  }
  console.log("Done deleting all scraped semesters from db")
  return semArray
}
