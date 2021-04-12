const database = require('../config/database.js')
const Op = database.Sequelize.Op
const Papa = require('papaparse')
const fs = require('fs')
const IncomingForm = require('formidable').IncomingForm
const moment = require('moment')

const Course = database.Course
const CourseOffering = database.CourseOffering
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem
const Student = database.Student

// Upload course offerings
exports.upload = (req, res) => {
  // console.log(req.query.department)
  let form = new IncomingForm()
  let dept = ''
  form.parse(req)
    .on('field', (name, field) => {
      console.log(name, field)
      if (name === 'dept') dept = field
    })
    .on('file', (field, file) => {
      if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
        res.status(500).send('File must be *.csv')
        return
      }
      const fileIn = fs.readFileSync(file.path, 'utf-8')
      Papa.parse(fileIn, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          let header = results.meta['fields']
          if (
            header[0] !== 'department' &&
            header[1] !== 'course_num' &&
            header[2] !== 'section' &&
            header[3] !== 'semester' &&
            header[4] !== 'year' &&
            header[5] !== 'timeslot'
          ) {
            console.log('invalid csv')
            res.status(500).send('Cannot parse CSV file - headers do not match specifications')
            return
          }
          let courses = []
          let exceptionDepts = ['AMS', 'CHE', 'JRN', 'MEC', 'MCB', 'PHY']
          if (dept === 'AMS') {
            courses = results.data.filter(course => exceptionDepts.includes(course.department))
            dept = exceptionDepts
          } else {
            courses = results.data.filter(course => course.department === dept)
            dept = [dept]
          }
          uploadCourses(courses, res, dept)
        }
      })
    })
}

async function uploadCourses(results, res, dept) {
  let semestersCovered = await deleteSemestersFromDB(results, dept)
  let semesters = semestersCovered[0]
  let years = semestersCovered[1]

  let coursesAdded = await uploadNewOfferings(results)
  // Grabs students for this specific department only {AMS||CSE||BMI||ESE}
  // and their respective coursePlans. 
  let deptStudents = await Student.findAll({ where: { department: dept } })
  let coursePlans = await CoursePlan.findAll({
    where: { studentId: deptStudents.map(student => student.sbuId) },
  })
  let coursePlanIds = coursePlans.map((plan) => plan.coursePlanId)
  let coursePlanItems = await CoursePlanItem.findAll({
    where: {
      coursePlanId: coursePlanIds,
      semester: semesters,
      year: years,
      grade: null
    }
  })

  let affectedStudents = []
  // For every semester covered by the csv... Ex: semestersCovered = ['Fall 2019', 'Fall 2020']
  for (let i = 0; i < semesters.length; i++) {
    console.log('Checking course plans for semester: ', semesters[i], years[i])
    // `semesterAdded` are the courses added for the semester + year from the csv. 
    let semesterAdded = coursesAdded.filter(
      course => course.semester === semesters[i] && course.year === years[i]
    )
    // if (coursePlans[2].studentId === 512776214) {
    //   console.log(semesterAdded)
    // }
    // For each student...
    for (let j = 0; j < coursePlans.length; j++) {
      let coursePlanValidity = true
      let toCheck = []
      // `semesterItems` are the CoursePlanItems of the current student for this semester + year.
      let semesterItems = coursePlanItems.filter(
        item => item.semester === semesters[i]
          && item.year === years[i]
          && item.coursePlanId === coursePlanIds[j]
      )
      // if (coursePlans[j].studentId === 512776214) {
      //   console.log(j)
      //   console.log(semesters[i] + years[i])
      //   console.log(semesterItems)
      // }
      // For each course plan item of this student in this semester + year...
      // Compare the course plan item to a course we added. If they're the same course
      // (already in the same sem + year), add it to `toCheck` to check for schedule conflicts.
      for (let k = 0; k < semesterItems.length; k++) {
        for (let l = 0; l < semesterAdded.length; l++) {
          if (semesterItems[k].courseId === semesterAdded[l].identifier)
            toCheck.push(semesterAdded[l])
        }
      }
      
      // [CSE500, CSE502, CSE503, CSE504, CSE505]
      // Checks for time/day conflicts in the schedule. 
      for (let k = 0; k < toCheck.length; k++) {
        for (let l = k + 1; l < toCheck.length; l++) {
          let first = toCheck[k].days
          let second = toCheck[l].days
          if (
            !first ||
            !second ||
            !toCheck[k].startTime ||
            !toCheck[l].startTime ||
            !toCheck[k].endTime ||
            !toCheck[l].endTime
          )
            continue
          if (
            (first.includes('M') && second.includes('M')) ||
            (first.includes('TU') && second.includes('TU')) ||
            (first.includes('W') && second.includes('W')) ||
            (first.includes('TH') && second.includes('TH')) ||
            (first.includes('F') && second.includes('F'))
          ) {
            // Check time conflict
            let fStart = toCheck[k].startTime
            let sStart = toCheck[l].startTime
            let fEnd = toCheck[k].endTime
            let sEnd = toCheck[l].endTime
            if (
              (fStart >= sStart && fStart < sEnd) ||
              (fEnd <= sEnd && fEnd > sStart) ||
              (sStart >= fStart && sStart < fEnd) ||
              (sEnd <= fEnd && sEnd > fStart)
            ) {
              // Set the first CoursePlanItem to now be invalid.
              // invalid course plan item = 0
              let firstCheck = await CoursePlanItem.update({ validity: false }, {
                where: {
                  coursePlanId: coursePlanIds[j],
                  courseId: toCheck[k].identifier,
                  semester: semesters[i],
                  year: years[i]
                }
              })
              // Set the second CoursePlanItem to now be invalid.
              let secondCheck = await CoursePlanItem.update({ validity: false }, {
                where: {
                  coursePlanId: coursePlanIds[j],
                  courseId: toCheck[l].identifier,
                  semester: semesters[i],
                  year: years[i]
                }
              })
              // only pushes to affected students if either item has a conflict/is affected
              if (firstCheck[0] === 1 || secondCheck[0] === 1) {
                affectedStudents.push(coursePlans[j].studentId)
                coursePlanValidity = false
              }
            }
          }
        }
      }
      await coursePlans[j].update({ coursePlanValidity: coursePlanValidity })

    }
    // Finds the student's whose course plans are invalid due to a course no longer
    // being offered in the semester + year.
    if (semesterAdded.length > 0) {
      let courseIdentifiers = semesterAdded.map(course => course.identifier)
      let coursesNotOffered = await Course.findAll({
        where: {
          department: dept,
          courseId: { [Op.notIn]: courseIdentifiers },
          semester: semesters[i],
          year: years[i]
        }
      })
      let invalidCoursePlanIds = []
      for (let j = 0; j < coursesNotOffered.length; j++) {
        let items = coursePlanItems.filter(item => {
          item.courseId === coursesNotOffered[j].department + coursesNotOffered[j].courseNum
        })
        // update the validity such that the items are invalid
        await CoursePlanItem.update({ validity: false }, {
          where: {
            courseId: items.map(item => item.courseId),
            semester: semesters[i],
            year: years[i]
          }
        })
        invalidCoursePlanIds = new Set(items.map(item => item.coursePlanId))
      }
      let invalidCoursePlans = await CoursePlan.findAll({
        where: { coursePlanId: invalidCoursePlanIds }
      })
      invalidCoursePlans.map(plan => affectedStudents.push(plan.studentId))
    }
  }
  res.status(200).send(semestersCovered)
  return
}

/**
 * Scrapes the csv courses and adds all the courses where
 * @param {*} csvCourses: The records of the csv file, filtered where csv.courses === this.department.
 * @return {Array} newCourses: The courses from csvCourses that were successfully added to the db.
 */
async function uploadNewOfferings(csvCourses) {
  coursesAdded = []
  for (let i = 0; i < csvCourses.length; i++) {
    let course = csvCourses[i]
    let csvTimeslot = course.timeslot ? course.timeslot.split(' ') : null
    let timeRange = csvTimeslot ? csvTimeslot[1].split('-') : null
    coursesAdded.push({
      identifier: course.department + course.course_num,
      semester: course.semester,
      year: course.year,
      section: course.section,
      days: csvTimeslot ? csvTimeslot[0] : null,
      startTime: timeRange
        ? moment(timeRange[0], ['h:mmA']).format('HH:mm')
        : null,
      endTime: timeRange
        ? moment(timeRange[1], ['h:mmA']).format('HH:mm')
        : null
    })
  }
  const newCourses = await CourseOffering.bulkCreate(coursesAdded)
  console.log('Done importing all courses from csv')
  return newCourses
}

/**
 * Scrapes the semesters+years from the parsed CSV file, then deletes the entries
 * in the CourseOffering table where the semester and year(s) are covered by this new CSV.
 * @param courses: The records of the csv file, filtered where csv.courses === this.department.
 * @param departments: The departments to scrape for. (Ex: CSE can only scrape CSE courses)
 * @return {Array}: The semesters and years that are covered by this csv file.
 */
async function deleteSemestersFromDB(courses, departments) {
  console.log(departments)
  let semArray = Array.from(
    new Set(courses.map(course => course.semester + ' ' + course.year))
  )
  let sems = []
  let years = []
  for (let i = 0; i < semArray.length; i++) {
    semyear = semArray[i].split(' ')
    sems.push(semyear[0])
    years.push(Number(semyear[1]))
    // Might have to CASCADE the deletes to the
    // CoursePlans that reference these courses (?)
    for (let dept of departments) {
      await CourseOffering.destroy({
        where: {
          identifier: { [Op.startsWith]: dept },
          semester: semyear[0],
          year: Number(semyear[1])
        }
      })
      await CoursePlanItem.update({ validity: true }, {
        where: {
          validity: false,
          semester: semyear[0],
          year: Number(semyear[1])
        }
      })
    }
  }
  console.log('Done deleting all scraped semesters from db')
  return [sems, years]
}
