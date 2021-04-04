const database = require('../config/database.js');
const Papa = require('papaparse');
const fs = require('fs');
const moment = require('moment');
const IncomingForm = require('formidable').IncomingForm;

const CourseOffering = database.CourseOffering;


// Upload course offerings
exports.upload = (req, res) => {
  var form = new IncomingForm()
  form.parse(req).on('file', (field, file) => {
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel')
      res.status(500).send('File must be *.csv')
    else {
      const fileIn = fs.readFileSync(file.path, 'utf-8')
      let isValid = true;
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
            isValid = false
            console.log('invalid csv')
            res.status(500).send("Cannot parse CSV file - headers do not match specifications")
            return
          }
          deleteSemestersFromDB(results)
          uploadNewOfferings(results)

          /* TODO: a student's course plan may contain courses in semesters for which course 
          offering data has not yet been imported; until the data is imported, the system 
          assumes that all courses will be offered and free of schedule conflicts. the course 
          offerings for a semester may change when an updated file covering that semester is 
          imported. in both cases, importing of course offerings may cause some planned course
           to be unavailable (not offered). the system marks these invalid entries (so the GPD 
            or student will know to fix them), displays a list of affected students and their 
            invalid course plan entries, and notifies those students by email.  */ 
            
        }
      })
      if (isValid)
        res.status(200).send("Success")
    }
  })
};


// Notes: Changing the data type of the CourseOffering.section
//  to be a INTEGER instead of a String (since we have sections like):
//  S01, V02, R04, etc. from the scrapes. 
// Everyone will have to DORP TABLE courseofferings, then rerun the 
// server to recreate the table through sequelize. 

function uploadNewOfferings(csvFile) {
  for (let i = 0; i < csvFile.data.length; i++) {
    course = csvFile.data[i]
    csvTimeslot = (course.timeslot ? course.timeslot.split(' ') : null)
    day = (csvTimeslot ? csvTimeslot[0] : null)
    timeRange = (csvTimeslot ? csvTimeslot[1].split('-') : null)
    start = (timeRange ? moment(timeRange[0], ['h:mmA']).format('HH:mm') : null)
    end = (timeRange ? moment(timeRange[1], ['h:mmA']).format('HH:mm') : null)
    CourseOffering.create({
      identifier: course.department + course.course_num,
      semester: course.semester,
      year: course.year,
      section: course.section,
      days: day,
      startTime: start,
      endTime: end
    })
  }
  console.log("Done importing all courses from csv")
  return true
}



// Scrapes the semesters+years from the parsed CSV file. 
// Then deletes the entries in the CourseOffering Model
// where the semester+year(s) are covered by this new CSV.
// Will return a promise after the await is done. Try to
// catch it in the main loop and handle it in there. 
function deleteSemestersFromDB(csvFile) {
  semArray = Array.from(new Set(csvFile.data.map(
    course => course.semester + ' ' + course.year)))
  for (let i = 0; i < semArray.length; i++) {
    semyear = semArray[i].split(' ')
    // Might have to CASCADE the deletes to the 
    // CoursePlans that reference these courses (?)
    CourseOffering.destroy({
      where: {
        semester: semyear[0],
        year: Number(semyear[1])
      }
    })
  }
  console.log("Done deleting all scraped semesters from db")
  return true
}

// https://stackoverflow.com/questions/16336367/what-is-the-difference-between-synchronous-and-asynchronous-programming-in-node
// https://hackernoon.com/understanding-async-await-in-javascript-1d81bb079b2c
// https://hackernoon.com/understanding-promises-in-javascript-13d99df067c1
// https://stackoverflow.com/questions/26783080/convert-12-hour-am-pm-string-to-24-date-object-using-moment-js