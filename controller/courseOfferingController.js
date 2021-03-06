const Papa = require('papaparse')
const fs = require('fs')
const IncomingForm = require('formidable').IncomingForm
const moment = require('moment')
const { currSem, currYear } = require('./constants')
const { getDepartmentalCourses, checkTimeConflict, updateOrDelete } = require('./shared')
const database = require('../config/database.js')

const Op = database.Sequelize.Op
const Course = database.Course
const CourseOffering = database.CourseOffering
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem
const Student = database.Student

/**
 * Finds coruse offering for specified course, semester, and year
 * @param {*} req Contains courseId, semester, and year
 * @param {*} res 
 */
exports.findOne = async (req, res) => {
  CourseOffering
    .findAll({
      where: {
        identifier: req.query.courseId,
        semester: req.query.semester,
        year: req.query.year
      }
    })
    .then(offerings => res.status(200).send(offerings))
    .catch(err => res.status(500).send('Could not find course offerings'))
}



/**
 * Uploads course offering information (time, location, etc..) for a given department.
 * @param {*} req Contains a FormData containing the department to import course offerings
 * for and a CSV file containing a list of course offerings
 * @param {*} res
 */
exports.upload = async (req, res) => {
  // console.log(req.query.department)
  let form = new IncomingForm()
  let dept = ''
  form
    .parse(req)
    // Get the department to import offerings for
    .on('field', (name, field) => {
      if (name === 'dept') dept = field
    })
    // Imports the course offerings if it is a valid CSV
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
          if (header[0] !== 'department' ||
            header[1] !== 'course_num' ||
            header[2] !== 'section' ||
            header[3] !== 'semester' ||
            header[4] !== 'year' ||
            header[5] !== 'timeslot') {
            console.log('invalid csv')
            res.status(500).send('Cannot parse CSV file - headers do not match specifications')
            return
          }
          getDepartmentalCourses([dept], currSem, currYear)
            .then(([exceptionDepts, exceptions]) => {
              let courses = []
              courses = results.data.filter(course => course.department === dept || exceptions.includes(course.department + course.course_num))
              exceptionDepts.push(dept)
              uploadCourses(courses, res, exceptionDepts)
            })
        }
      })
    })
}


/**
 * Uploads the list of course offerings from a department into the database. 
 * @param {Array} results List of course offerings to upload
 * @param {*} res 
 * @param {String} dept Department to upload offerings for
 * @returns The list of courses created in the database
 */
async function uploadCourses(results, res, dept) {
  // Find all the covered semesters in the list of course offerings and delete
  // course offerings for all covered semesters.
  const semestersCovered = await deleteSemestersFromDB(results, dept)
  const semesters = semestersCovered[0]
  const years = semestersCovered[1]
  // Upload all the new course offerings
  const coursesAdded = await uploadNewOfferings(results)
  // Find all students for this specific department and their respective coursePlans.
  const deptStudents = await Student.findAll({ where: { department: dept[dept.length - 1] } })
  const coursePlans = await CoursePlan.findAll({
    where: {
      studentId: deptStudents.map(student => student.sbuId)
    }
  })
  // Find the non-graded course plan items for all the students in this specific department
  const coursePlanIds = coursePlans.map(plan => plan.coursePlanId)
  let coursePlanItems = await CoursePlanItem.findAll({
    where: {
      coursePlanId: coursePlanIds,
      semester: semesters,
      year: years,
      grade: null
    }
  })

  //Mark all invalid course plans valid for semesters covered by csv file
  const semCoursePlanIds = coursePlanItems.map((item) => item.coursePlanId)
  await CoursePlan.update({ coursePlanValid: true }, {
    where: {
      coursePlanId: semCoursePlanIds,
      coursePlanValid: false
    }
  })

  let affectedStudents = {}
  // Loop through every semester+year covered by the csv
  for (let i = 0; i < semesters.length; i++) {
    const semester = semesters[i]
    const year = years[i]
    console.log('Checking course plans for semester: ', semester, year)
    // Get the list of courses added for the current semester and year at i
    let semesterAdded = coursesAdded.filter(course => course.semester === semester && course.year === year)
    // Get the list of course plan items for the current semester and year at i
    let semesterPlans = coursePlanItems.filter(item => item.semester === semester && item.year === year)
    if (semesterAdded.length === 0 || semesterPlans.length === 0)
      continue
    // For each students' course plan, check if its affected
    for (let j = 0; j < coursePlans.length; j++) {
      let coursePlanValidity = coursePlans[j].coursePlanValid
      let toCheck = []
      // CoursePlanItems of the current student for this semester + year.
      let semesterItems = semesterPlans.filter(item => item.coursePlanId === coursePlanIds[j])
      if (semesterItems.length === 0)
        continue
      // Compare each course plan item to a course we added. If they're the same course
      // (already in the same sem + year), add it to `toCheck` to check for schedule conflicts.
      for (let k = 0; k < semesterItems.length; k++) {
        for (let l = 0; l < semesterAdded.length; l++) {
          if (semesterItems[k].courseId === semesterAdded[l].identifier && Number(semesterItems[k].section) === Number(semesterAdded[l].section))
            toCheck.push(semesterAdded[l])
        }
      }
      // Checks for day/time conflicts in the schedule.  
      for (let k = 0; k < toCheck.length; k++) {
        for (let l = k + 1; l < toCheck.length; l++) {
          let invalidCourses = []
          // If the 2 courses have a conflict, update the validity of the courses
          if (checkTimeConflict(toCheck[k], toCheck[l], invalidCourses)) {
            // Mark first conflicting course plan item to invalid
            let values = { validity: false }
            let condition = {
              coursePlanId: coursePlanIds[j],
              courseId: toCheck[k].identifier,
              semester: semester,
              year: year
            }
            let updated1 = await updateOrDelete(CoursePlanItem, condition, values, null)
            // Mark second conflicting course plan item to invalid
            condition = {
              coursePlanId: coursePlanIds[j],
              courseId: toCheck[l].identifier,
              semester: semester,
              year: year
            }
            let updated2 = await updateOrDelete(CoursePlanItem, condition, values, null)
            if (updated1 || updated2) {
              if (!affectedStudents[coursePlans[j].studentId])
                affectedStudents[coursePlans[j].studentId] = [toCheck[k]]
              else
                affectedStudents[coursePlans[j].studentId].push(toCheck[k])
              affectedStudents[coursePlans[j].studentId].push(toCheck[l])
              coursePlanValidity = false
            }
          }
        }
      }
      // Update the students course plan validity if it becomes invalid
      await coursePlans[j].update({
        coursePlanValid: coursePlanValidity
      })
    }
    // Finds the student's whose course plans are invalid due to a course no longer
    // being offered in the semester + year.
    const coursesNotOffered = await Course.findAll({
      where: {
        department: dept,
        courseId: { [Op.notIn]: semesterAdded.map(course => course.identifier) },
        semester: semester,
        year: year
      }
    })
    let invalidCoursePlanIds = new Set()
    let allInvalidItems = []
    for (let j = 0; j < coursesNotOffered.length; j++) {
      let items = semesterPlans.filter(item => item.courseId === coursesNotOffered[j].courseId)
      if (items.length === 0)
        continue
      // Update the validity such that the items are invalid
      for (let item of items) {
        let updated = await updateOrDelete(CoursePlanItem, null, { validity: false }, item)
        if (updated) {
          allInvalidItems.push(item)
          invalidCoursePlanIds.add(item.coursePlanId)
        }
      }
      // let updated = await updateOrDelete(CoursePlanItem, condition, { validity: false })
      // if (updated) {
      //   allInvalidItems = allInvalidItems.concat(items)
      //   items.forEach(item => invalidCoursePlanIds.add(item.coursePlanId))
      // }
    }
    invalidCoursePlanIds = Array.from(invalidCoursePlanIds)
    let invalidCoursePlans = await CoursePlan.findAll({
      where: {
        coursePlanId: invalidCoursePlanIds
      }
    })
    // Update course plan validity to false if it has invalid course plan items
    await CoursePlan.update({ coursePlanValid: false }, {
      where: {
        coursePlanId: invalidCoursePlanIds,
        coursePlanValid: true
      }
    })
    invalidCoursePlans.forEach(plan => {
      if (!affectedStudents[plan.studentId])
        affectedStudents[plan.studentId] = allInvalidItems.filter(item => item.coursePlanId === plan.coursePlanId)
      else
        affectedStudents[plan.studentId] = affectedStudents[plan.studentId].concat(allInvalidItems.filter(item => item.coursePlanId === plan.coursePlanId))
    })
  }
  // Create the set of effected course plan items for each student
  for (let student of Object.keys(affectedStudents)) {
    let distinct = new Set(affectedStudents[student].map(
      item => (item.identifier ? item.identifier : item.courseId) + item.semester + item.year
    ))
    let itemSet = []
    affectedStudents[student].forEach(item => {
      let identifier = item.identifier ? item.identifier : item.courseId
      if (distinct.has(identifier + item.semester + item.year)) {
        itemSet.push(item)
        distinct.delete(identifier + item.semester + item.year)
      }
    })
    affectedStudents[student] = itemSet
  }

  // Send effected students
  res.status(200).send(affectedStudents)
  return
}


/**
 * Scrapes the csv courses and adds all the courses for specific department into the database.
 * @param {*} csvCourses: The records of the csv file, filtered where csv.courses === this.department
 * @return {Array} newCourses: The courses from csvCourses that were successfully added to the db
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
      section: course.section ? course.section : 'N/A',
      days: csvTimeslot ? csvTimeslot[0] : null,
      startTime: timeRange ?
        moment(timeRange[0], ['h:mmA']).format('HH:mm') : null,
      endTime: timeRange ?
        moment(timeRange[1], ['h:mmA']).format('HH:mm') : null
    })
  }
  const newCourses = await CourseOffering.bulkCreate(coursesAdded)
  console.log('Done importing all courses from csv')
  return newCourses
}


/**
 * Scrapes the semesters+years from the parsed CSV file, then deletes the entries
 * in the CourseOffering table where the semester and year(s) are covered by this new CSV.
 * @param courses: The records of the csv file for a specific department.
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
    for (let dept of departments) {
      // Delete all courses for a department during semester and year
      await CourseOffering.destroy({
        where: {
          identifier: {
            [Op.startsWith]: dept
          },
          semester: semyear[0],
          year: Number(semyear[1])
        }
      })
      // Update course plan item validity back to true for deleted courses
      await CoursePlanItem.update({ validity: true }, {
        where: {
          courseId: {
            [Op.startsWith]: dept
          },
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