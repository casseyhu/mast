const database = require('../config/database.js');
const Papa = require('papaparse');
const fs = require('fs');
const moment = require('moment');
const IncomingForm = require('formidable').IncomingForm;

const CourseOffering = database.CourseOffering;
const CoursePlan = database.CoursePlan;
const CoursePlanItem = database.CoursePlanItem;
const Student = database.Student;



// Upload course offerings
exports.upload = (req, res) => {
  var form = new IncomingForm()
  form.parse(req).on('file', (field, file) => {
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel')
      res.status(500).send('File must be *.csv')
    else {
      const f_in = fs.readFileSync(file.path, 'utf-8')
      // let isValid = true;
      Papa.parse(f_in, {
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
            // isValid = false
            console.log('invalid csv')
            res.status(500).send("Cannot parse CSV file - headers do not match specifications")
            return
          }
          uploadCourses(results, res)
        }
      })
    }
  })
};


async function uploadCourses(results, res){
  let semestersCovered = await deleteSemestersFromDB(results)
  let coursesAdded = await uploadNewOfferings(results)
  // Get all course plans. 
  let coursePlans = await CoursePlan.findAll()
  let affectedStudents = []
  // For every semester covered by the csv, 
  // ["Fall 2019", "Fall 2020"]
  for(let i = 0; i < semestersCovered.length; i++) {
    sem_year = semestersCovered[i].split(' ')
    // For every coursePlan, query the CoursePlanItem table where:
    // coursePlanId == this.coursePlanId, semester+year = current semester and
    // year that we're looking at (outer loop). 
    for(let j = 0; j < coursePlans.length; j++){
      // CoursePlanItems == All course plan items for specific student 
      // for sem+year
      let coursePlanItems = await CoursePlanItem.findAll({
        where: {
          coursePlanId: coursePlans[j].coursePlanId,
          semester: sem_year[0],
          year: sem_year[1]
        }
      })
      let toCheck = []
      for(let k = 0; k < coursePlanItems.length; k++) {
        for(let l = 0; l < coursesAdded.length; l++){
          if(coursePlanItems[k].courseId == coursesAdded[l].identifier) 
          toCheck.push(coursesAdded[l])
        }
      }
      // [CSE500, CSE502, CSE503, CSE504, CSE505]
      for(let k = 0; k < toCheck.length; k++) {
        for(let l = k+1; l < toCheck.length; l++) {
          let first = toCheck[k].days
          let second = toCheck[l].days
          if (!first || !second || !toCheck[k].startTime || 
            !toCheck[l].startTime || !toCheck[k].endTime || !toCheck[l].endTime)
            continue
          if(first.includes('M') && second.includes('M')
            || first.includes('TU') && second.includes('TU')
            || first.includes('W') && second.includes('W')
            || first.includes('TH') && second.includes('TH')
            || first.includes('F') && second.includes('F')) {
              // Check time conflict
              let f_start = toCheck[k].startTime
              let s_start = toCheck[l].startTime
              let f_end = toCheck[k].endTime
              let s_end = toCheck[l].endTime
              if ((f_start >= s_start && f_start < s_end) 
                || (f_end <= s_end && f_end > s_start) 
                || (s_start >= f_start && s_start < f_end)
                || (s_end <= f_end && s_end > f_start)) {
                  affectedStudents.push(coursePlans[j].studentId)
                }
            }
         }
      }
    }
  }
  console.log(affectedStudents)
  res.status(200).send(affectedStudents)
  return
}




// Notes: Changing the data type of the CourseOffering.section
//  to be a INTEGER instead of a String (since we have sections like):
//  S01, V02, R04, etc. from the scrapes. 
// Everyone will have to DORP TABLE courseofferings, then rerun the 
// server to recreate the table through sequelize. 

async function uploadNewOfferings(csv_file) {
  coursesAdded = []
  for (let i = 0; i < csv_file.data.length; i++) {
    course = csv_file.data[i]
    csv_timeslot = (course.timeslot ? course.timeslot.split(' ') : null)
    day = (csv_timeslot ? csv_timeslot[0] : null)
    time_range = (csv_timeslot ? csv_timeslot[1].split('-') : null)
    start = (time_range ? moment(time_range[0], ['h:mmA']).format('HH:mm') : null)
    end = (time_range ? moment(time_range[1], ['h:mmA']).format('HH:mm') : null)
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
async function deleteSemestersFromDB(csv_file) {
  // scraped_semesters = 
  //     new Set(csv_file.data.map(course => course.semester + ' ' + course.year))
  sem_array = Array.from(new Set(csv_file.data.map(
    course => course.semester + ' ' + course.year)))
  for (let i = 0; i < sem_array.length; i++) {
    semyear = sem_array[i].split(' ')
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
  return sem_array
}

// https://stackoverflow.com/questions/16336367/what-is-the-difference-between-synchronous-and-asynchronous-programming-in-node
// https://hackernoon.com/understanding-async-await-in-javascript-1d81bb079b2c
// https://hackernoon.com/understanding-promises-in-javascript-13d99df067c1
// https://stackoverflow.com/questions/26783080/convert-12-hour-am-pm-string-to-24-date-object-using-moment-js