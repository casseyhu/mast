const { IncomingForm } = require('formidable')
const fs = require('fs')
const Papa = require('papaparse')

const shared = require('./shared')

const database = require('../config/database.js')
const Op = database.Sequelize.Op

const Student = database.Student
const Course = database.Course
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem
const CourseOffering = database.CourseOffering

const Degree = database.Degree
const GradeRequirement = database.GradeRequirement
const GpaRequirement = database.GpaRequirement
const CreditRequirement = database.CreditRequirement
const CourseRequirement = database.CourseRequirement
const RequirementState = database.RequirementState


const GRADES = {
  'A': 4,
  'A-': 3.67,
  'B+': 3.33,
  'B': 3,
  'B-': 2.67,
  'C+': 2.33,
  'C': 2,
  'C-': 1.67,
  'F': 0
}
const semDict = {
  'Fall': 8,
  'Spring': 2,
  'Winter': 1,
  'Summer': 5
}
const currSem = 'Spring'
const currYear = 2021


/**
 * Uploads course plan items (with or without grades) from a CSV file. 
 * @param {*} req Contains a FormData containing the department to upload course plans
 * for and a boolean value indicating if we should delete existing student data
 * @param {*} res 
 */
exports.uploadPlans = (req, res) => {
  let form = new IncomingForm()
  let dept = ''
  let deleted = false
  form
    .parse(req)
    // Get the department and boolean value to import course plan items for
    .on('field', (name, field) => {
      if (name === 'dept')
        dept = field
      else if (name === 'delete')
        deleted = field
    })
    // Imports the course plan items if it is a valid CSV
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
          var header = results.meta['fields']
          if (header[0] !== 'sbu_id' || header[1] !== 'department' ||
            header[2] !== 'course_num' || header[3] !== 'section' ||
            header[4] !== 'semester' || header[5] !== 'year' ||
            header[6] !== 'grade') {
            console.log('invalid csv')
            res.status(500).send('Cannot parse course plan CSV file - headers do not match specifications')
            return
          }
          let coursePlans = results.data
          uploadCoursePlans(coursePlans, dept, res, deleted)
        }
      })
    })
}


/**
 * Helper function to uploading course plan items for a given department
 * @param {*} coursePlans List of course plan item entries from the CSV
 * @param {*} dept Department to import course plan items for
 * @param {*} res 
 * @param {*} deleted Should we delete existing student data?
 */
async function uploadCoursePlans(coursePlans, dept, res, deleted) {
  console.log(deleted)
  // Grabs all students of this department
  let students = await Student.findAll({ where: { department: dept } })
  // Gets the list of only the sbuids for students of this department
  students = new Set(students.map(student => student.sbuId))
  // Filters the course plan items from the csv for only the students of this department 
  coursePlans = coursePlans.filter(coursePlan => students.has(coursePlan.sbu_id))
  students = coursePlans.map(item => item.sbu_id)
  // Find all existing course plan items for students of this department
  const existCoursePlans = await CoursePlan.findAll({ where: { studentId: students } })
  // Delete all course plan items and requirement states for the list of students
  if (deleted === 'true') {
    await CoursePlanItem.destroy({
      where: {
        coursePlanId: existCoursePlans.map(coursePlan => coursePlan.coursePlanId)
      }
    })
    await RequirementState.destroy({ where: { sbuID: students } })
  }
  let studentsPlanId = {}
  existCoursePlans.forEach(plan => studentsPlanId[plan.studentId] = plan.coursePlanId)
  // Create/Update all the course plan items for students of this department
  for (let i = 0; i < coursePlans.length; i++) {
    const item = coursePlans[i]
    if (!item.sbu_id)
      continue
    if (!(item.sbu_id in studentsPlanId)) {
      console.log('Error: Course plan not found for student: ' + item.sbu_id)
      continue
    }
    condition = {
      coursePlanId: studentsPlanId[item.sbu_id],
      courseId: item.department + item.course_num,
      semester: item.semester,
      year: item.year
    }
    values = {
      coursePlanId: studentsPlanId[item.sbu_id],
      courseId: item.department + item.course_num,
      semester: item.semester,
      year: item.year,
      section: item.section,
      grade: item.grade,
      validity: true
    }
    if (deleted === 'true')
      course = await CoursePlanItem.create(values)
    else {
      let found = await CoursePlanItem.findOne({ where: condition })
      if (found)
        course = await CoursePlanItem.update(values, { where: condition })
    }
  }
  // Credits mapping for each course in the department
  const courses = await Course.findAll({ where: { department: dept } })
  let credits = {}
  courses.forEach(course => credits[course.courseId] = course.credits)
  calculateCompletion(studentsPlanId, credits, res)
}


/**
 * Calculates the GPA for a given set of courses.
 * @param {Array<Object>} coursePlanItems List of course plan items
 * @param {Map<String, Number>} credits Credits mapping for each course in the department
 * @returns The calculated GPA
 */
function calculateGPA(coursePlanItems, credits) {
  let totalPoints = 0
  let totalCredits = 0
  for (let course of coursePlanItems) {
    let courseCredit = credits[course.courseId] ? credits[course.courseId] : 0
    totalCredits += courseCredit
    totalPoints += courseCredit * (GRADES[course.grade] ? GRADES[course.grade] : 0)
  }
  return totalPoints / totalCredits
}


/**
 * Gets a requirement state based on the minimum value.
 * - If current value is 0, requirement is unsatisfied.
 * - If current value is >= minimum, requirement is satisfied.
 * - If current value is between 0 and minimum, requirement is pending.
 * @param {Number} value Current value of requirement
 * @param {Number} minimum Minimum value needed to satisfy requirement
 * @returns Requirement state string (unsatisfied, pending, satisfied)
 */
function getReqState(value, minimum) {
  if (value === 0)
    return 'unsatisfied'
  else if (value >= minimum)
    return 'satisfied'
  else
    return 'pending'
}


/**
 * Calculates and updates a students credit requirement state.
 * - If the total credits in the students course plan is less than minCredits, it is unsatisfied.
 * - If the total credits is >= minCredits and the total credits the students completed with a 
 * grade is >= minCredits, it is satisfied.
 * - If the total credits is >= minCredits but the total credits the student completed with a 
 * grade is < minCredits, it is pending.
 * @param {Map<String, Number>} credits Credits mapping for each course in the department
 * @param {Map<String, Number>} states Requirement state counts for current student
 * @param {Object} creditReq Credit Requirement object from database
 * @param {Object} student Current student object
 * @param {Array<Object>} coursePlanItems Course plan items for current student
 * @param {Array<Object>} takenAndCurrent Course plan items that the student has taken 
 * and currently taking
 */
async function calculateCreditRequirement(credits, states, creditReq, student, coursePlanItems, takenAndCurrent) {
  let creditState = ''
  let totalCredits = 0
  for (let j = 0; j < coursePlanItems.length; j++) {
    // Create the course credits mapping and get total credits for their entire course plan
    let courseName = coursePlanItems[j].courseId
    if (!credits[courseName]) {
      let course = await Course.findOne({ where: { courseId: courseName } })
      if (course && course.credits != null)
        credits[courseName] = course.credits
      else { // should not get to here...
        console.log('course doesnt exist: ' + courseName)
        credits[courseName] = 3
      }
    }
    totalCredits += credits[courseName]
  }
  const actualCredits = takenAndCurrent.reduce((a, b) => a + credits[b.courseId], 0)
  // Students entire course plan will not satify the requirement
  if (totalCredits < creditReq.minCredit) {
    creditState = 'unsatisfied'
    states[creditState]++
  } else {
    // Actual number of credits for courses the student has taken or curently taking
    creditState = getReqState(actualCredits, creditReq.minCredit)
    states[creditState]++
  }
  await updateOrCreate(student, 'Credit', creditReq.requirementId, creditState, [actualCredits])
}


/**
 * Calculates and updates a students grade requirement state.
 * - If the total credits for courses with grades >= minGrade is 0, it is unsatisfied.
 * - If the total credits for courses with grades >= minGrade is >= atLeastCredits, it is satisfied.
 * - If the total credits for courses with grades >= minGrade is > 0 and < atLeastCredits, it is pending.
 * @param {Map<String, Number>} credits Credits mapping for each course in the department
 * @param {Map<String, Number>} states Requirement state counts for current student
 * @param {Object} creditReq Credit Requirement object from database
 * @param {Object} student Current student object
 * @param {Array<Object>} gradedCoursePlan Course plan items for current student that have grades
 */
async function calculateGradeRequirement(credits, states, gradeReq, student, gradedCoursePlan) {
  let gradeState = ''
  if (gradeReq) {
    const numCredits = gradedCoursePlan
      .filter(course => GRADES[course.grade] >= gradeReq.minGrade)
      .reduce((a, b) => a + credits[b.courseId], 0)
    gradeState = getReqState(numCredits, gradeReq.atLeastCredits)
    states[gradeState]++
    await updateOrCreate(student, 'Grade', gradeReq.requirementId, gradeState, [numCredits])
  }
}


/**
 * Calculates and updates a students GPA requirement state (core, departmental, cumulative).
 * - If at least 1 GPA type is unsatisfied, it is unsatisfied.
 * - If all GPA types are satisfied, it is satisfied.
 * - If at least 1 GPA type is pending and others are satisfied, it is pending.
 * @param {Map<String, Number>} credits Credits mapping for each course in the department
 * @param {Map<String, Number>} states Requirement state counts for current student
 * @param {Object} gpaReq GPA requirement object from database
 * @param {Object} courseReq Course requirement object from database
 * @param {Object} student Current student object
 * @param {Array<Object>} gradedCoursePlan Course plan items for current student that have grades
 * @returns 
 */
async function calculateGpaRequirement(credits, states, gpaReq, courseReq, student, gradedCoursePlan) {
  let gpaState = ''
  let deptGpaState = ''
  let coreGpaState = ''
  let cumGpaState = ''
  let studentDeptGpa = 0
  let studentCoreGpa = 0
  let studentCumGpa = 0
  // 1. Calculate departmental GPA if needed
  if (gpaReq.department) {
    const deptCourses = gradedCoursePlan.filter(course => (
      course.courseId.slice(0, 3) === student.department
    ))
    studentDeptGpa = calculateGPA(deptCourses, credits)
    deptGpaState = getReqState(studentDeptGpa, gpaReq.department)
  }
  // 2. Calculate core GPA if needed
  if (gpaReq.core) {
    let coreCourses = new Set(courseReq
      .filter(req => req.type === 1)
      .reduce((a, b) => b.courses.concat(a), []))
    coreCourses = gradedCoursePlan.filter(course => coreCourses.has(course.courseId))
    studentCoreGpa = calculateGPA(coreCourses, credits)
    coreGpaState = getReqState(studentCoreGpa, gpaReq.core)
  }
  // 3. Calculate cumulative GPA
  studentCumGpa = calculateGPA(gradedCoursePlan, credits)
  cumGpaState = getReqState(studentCumGpa, gpaReq.cumulative)
  // 4. Set the state of the GPA requirement. 
  if ((deptGpaState === 'unsatisfied') ||
    (coreGpaState === 'unsatisfied') ||
    (cumGpaState === 'unsatisfied'))
    gpaState = 'unsatisfied'
  else if ((deptGpaState === 'pending') ||
    (coreGpaState === 'pending') ||
    (cumGpaState === 'pending'))
    gpaState = 'pending'
  else
    gpaState = 'satisfied'
  states[gpaState]++
  await updateOrCreate(student, 'Gpa', gpaReq.requirementId, gpaState,
    [studentCumGpa.toFixed(2), studentCoreGpa.toFixed(2), studentDeptGpa.toFixed(2)])
  return studentCumGpa
}


/**
 * Calculates and updates a students course requirement states.
 * - If student does not have enough courses for requirement, then it is unsatisfied.
 * - If student took at least minCourses/minCredits for a requirement and passed all n courses,
 * then it is satisfied.
 * - If student has at least minCourses/minCredits courses in their course plan and all n courses
 * have a passing grade (C or higher) or not taken yet, then it is pending.
 * @param {Map<String, Number>} credits Credits mapping for each course in the department
 * @param {Map<String, Number>} states Requirement state counts for current student
 * @param {Object} courseReq Course requirement object from database
 * @param {Object} student Current student object
 * @param {Array<Object>} coursePlanItems Course plan items for current student
 */
async function calculateCourseRequirement(credits, states, courseReq, student, coursePlanItems) {
  let coursesCount = {}
  let passedCourses = {}
  for (let j = 0; j < coursePlanItems.length; j++) {
    const course = coursePlanItems[j]
    if (course.grade && (GRADES[course.grade] >= GRADES['C'])) {
      if (passedCourses[course.courseId])
        passedCourses[course.courseId] += 1
      else
        passedCourses[course.courseId] = 1
    }
    // Only count course that they didnt fail
    if (!course.grade || (GRADES[course.grade] >= GRADES['C'])) {
      if (coursesCount[course.courseId])
        coursesCount[course.courseId] += 1
      else
        coursesCount[course.courseId] = 1
    }
  }
  // Each course requirement
  for (let requirement of courseReq) {
    if (requirement.type === 0) // Not required for the degree 
      continue
    let coursesUsedForReq = []
    let pendingCourses = []
    let courseReqState = ''
    let courseLower = requirement.courseLower ? requirement.courseLower : 9999999
    let creditLower = requirement.creditLower ? requirement.creditLower : 9999999
    const courselen = requirement.courses.length
    let repeatFlag = false
    for (let course of requirement.courses) {
      // Course is not in students course plan
      if (!coursesCount[course])
        continue
      // Course plan contains the course
      let courseCredits = credits[course]
      // Check if the course can be repeated multiple times for the requirement (min 2 courses but only 1 course in list)
      let coRepeat = requirement.courseLower ? (requirement.courseLower > courselen) : false
      let crRepeat = requirement.creditLower ? (requirement.creditLower / courseCredits > courselen) : false
      repeatFlag = coRepeat || crRepeat
      // If course can be counted multiple times for the requirement
      if (repeatFlag) {
        let passed = passedCourses[course]
        // If they satisfy minimum course limit, check if they actually passed the course n times
        if (passed && ((passed >= courseLower) || (passed >= creditLower / courseCredits)))
          courseReqState = 'satisfied'
        // Check if total applicable courses (removed failed courses) still fulfill requirements
        else if ((coursesCount[course] >= courseLower) || (coursesCount[course] >= creditLower / courseCredits))
          courseReqState = 'pending'
        else
          courseReqState = 'unsatisfied'
        // usedCourses.add(course)
        delete coursesCount[course]
        coursesUsedForReq.push(course)
        break
      }
      // Course was not used for another requirement: only count if passed or not taken yet
      if (passedCourses[course]) {
        delete coursesCount[course]
        coursesUsedForReq.push(course)
        courseLower -= 1
        creditLower -= courseCredits
        if (courseLower <= 0 || creditLower <= 0)
          break
      } else // not taken course
        pendingCourses.push(course)
    }
    if (!repeatFlag) {
      const currCredits = coursesUsedForReq.reduce((a, b) => credits[b] + a, 0)
      const pendingCredits = pendingCourses.reduce((a, b) => credits[b] + a, 0)
      const pendingCount = pendingCourses.length
      const expCourseLower = courseLower - pendingCount
      const expCreditLower = creditLower - pendingCredits
      if (courseLower <= 0 || creditLower <= 0)
        courseReqState = 'satisfied'
      else if (expCourseLower <= 0 || expCreditLower <= 0) {
        courseReqState = 'pending'
        if (expCourseLower <= 0) {
          let n = courseLower - coursesUsedForReq.length
          for (let i = 0; i < n; i++) {
            delete coursesCount[pendingCourses[i]]
            coursesUsedForReq.push(pendingCourses[i])
            courseLower -= 1
            creditLower -= credits[pendingCourses[i]]
          }
        } else {
          let n = creditLower - currCredits
          for (let i = 0; i < n; i += credits[pendingCourses[i]]) {
            delete coursesCount[pendingCourses[i]]
            coursesUsedForReq.push(pendingCourses[i])
            courseLower -= 1
            creditLower -= credits[pendingCourses[i]]
          }
        }
      }
      else
        courseReqState = 'unsatisfied'
    }
    states[courseReqState]++
    await updateOrCreate(student, 'Course', requirement.requirementId, courseReqState, coursesUsedForReq)
  }
}


/**
 * Updates students course plan completion and requirement states by recalculating
 * all degree requirement states (gpa, grade, credit, course).
 * @param {Map<String, String>} studentsPlanId Mapping of sbuId to coursePlanId
 * @param {Map<String, Number>} credits Credits mapping for each course in the department
 * @param {*} res 
 */
async function calculateCompletion(studentsPlanId, credits, res) {
  console.log('Calculating student CoursePlan completion...')
  let tot = 0
  // Loop through each student (key = sbu ID)
  for (let key in studentsPlanId) {
    // Keep track of total number of satisfied/pending/unsatisfied requirements
    let states = {
      'satisfied': 0,
      'unsatisfied': 0,
      'pending': 0
    }
    // Find the student and all the degree requirement objects for students degree
    const student = await Student.findOne({ where: { sbuId: key } })
    const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
    const creditReq = await CreditRequirement.findOne({ where: { requirementId: degree.creditRequirement } })
    const gpaReq = await GpaRequirement.findOne({ where: { requirementId: degree.gpaRequirement } })
    const gradeReq = await GradeRequirement.findOne({ where: { requirementId: degree.gradeRequirement } })
    const courseReq = await CourseRequirement.findAll({ where: { requirementId: degree.courseRequirement } })
    // Get this student's coursePlan to see what courses they've taken/currently taken/are going to take.
    const coursePlanItems = await CoursePlanItem.findAll({ where: { coursePlanId: studentsPlanId[key] } })
    // List of course plan items with grades
    const gradedCoursePlan = coursePlanItems.filter(course => course.grade !== null)
    // List of course plan items that the student has taken and currently taking
    const takenAndCurrent = coursePlanItems.filter(course => (
      (course.year < currYear) ||
      ((course.year === currYear) && (semDict[course.semester] <= semDict[currSem]))
    ))
    // CREDIT REQUIREMENT: Create and calculate credit requirement
    await calculateCreditRequirement(credits, states, creditReq, student, coursePlanItems, takenAndCurrent)
    // GRADE REQUIREMENT: Create and calculate grade requirement if gradeRequirement exists
    await calculateGradeRequirement(credits, states, gradeReq, student, gradedCoursePlan)
    // GPA REQUIREMENT: Create and calculate GPA requirement 
    const studentCumGpa = await calculateGpaRequirement(credits, states, gpaReq, courseReq, student, gradedCoursePlan)
    // COURSE REQUIREMENT: Create and calculate course requirements
    await calculateCourseRequirement(credits, states, courseReq, student, coursePlanItems)
    tot += 1
    await student.update({
      unsatisfied: states['unsatisfied'],
      satisfied: states['satisfied'],
      pending: states['pending'],
      gpa: studentCumGpa ? studentCumGpa.toFixed(2) : 0
    })
    // If all course plan items are pending and satisfied (no unsatisfied), then the course plan is complete
    const notTakenCourses = coursePlanItems.filter(item => item.grade === null)
    const coursePlanValidity = await getCoursePlanValidity(notTakenCourses)
    let studentCoursePlan = await CoursePlan.findOne({
      where: {
        coursePlanId: studentsPlanId[key]
      }
    })
    await studentCoursePlan.update({
      coursePlanComplete: (states['unsatisfied'] === 0) ? true : false,
      coursePlanValid: coursePlanValidity
    })
  }
  console.log('Done calculating ' + tot + ' students course plan completion')
  res.status(200).send('Success')
}


/**
 * Given a list of courses that the student has NOT taken yet, check if course plan items
 * for a given semester and year is valid if course offerings for that semester and year
 * were imported.
 * @param {Array<Object>} notTakenCourses List of course plan items that were not taken by student
 * @returns Boolean indicating if course plan is valid or not
 */
async function getCoursePlanValidity(notTakenCourses) {
  let coursePlanValidity = true
  if (notTakenCourses.length === 0)
    return coursePlanValidity
  // 1. Get list of all semester+year pairs
  let semesterYears = Array.from(new Set(notTakenCourses
    .map(item => item.semester + ' ' + item.year)))
    .map(item => item.split(' '))
  // 2. Filter list of semyears by semyears that have course offerings
  let semYears = []
  for (let semYear of semesterYears) {
    let found = await CourseOffering.findOne({
      where: {
        semester: semYear[0],
        year: semYear[1]
      }
    })
    if (found)
      semYears.push(semYear)
  }
  for (let semYear of semYears) {
    const semester = semYear[0]
    const year = Number(semYear[1])
    let invalidItems = []
    // Course plan items for the current semester and year only
    let courses = notTakenCourses.filter(item => item.semester === semester && item.year === year)
    // 3. Get all course offerings for the semester and year
    let courseOfferings = await CourseOffering.findAll({
      where: {
        identifier: courses.map(item => item.courseId),
        semester: semester,
        year: year
      }
    })
    let courseOfferingMap = {}
    courseOfferings.map(offering => courseOfferingMap[offering.identifier] = offering)
    for (let i = 0; i < courses.length; i++) {
      // If course was not offered, set validity to false
      if (!courseOfferingMap[courses[i].courseId]) {
        invalidItems.push(courses[i].courseId)
        continue
      }
      // Course was offered in semester and year
      for (let j = i + 1; j < courses.length; j++) {
        let first = courseOfferingMap[courses[i].courseId]
        if (!courseOfferingMap[courses[j].courseId]) {
          invalidItems.push(courses[j].courseId)
          continue
        }
        let second = courseOfferingMap[courses[j].courseId]
        shared.checkTimeConflict(first, second, invalidItems)
      }
    }
    // update courseplanitem validty for invaliditems
    if (invalidItems.length > 0) {
      await CoursePlanItem.update({ validity: false }, {
        where: {
          coursePlanId: notTakenCourses[0].coursePlanId,
          courseId: invalidItems,
          semester: semYear[0],
          year: Number(semYear[1])
        }
      })
      coursePlanValidity = false
    }
  }
  return coursePlanValidity
}


/**
 * Update or create a requirement for a degree
 */
async function updateOrCreate(student, requirementType, requirementId, state, metaData) {
  // console.log('Update/creating for '+student.sbuId+' for requirement type: ', requirementType)
  let reqStr = ''
  switch (requirementType) {
    case 'Grade':
      reqStr = 'GR'
      break
    case 'Gpa':
      reqStr = 'G'
      break
    case 'Credit':
      reqStr = 'CR'
      break
    case 'Course':
      reqStr = 'C'
      break
  }
  let found = await RequirementState.findOne({
    where: {
      sbuID: student.sbuId,
      requirementId: reqStr + requirementId
    }
  })
  if (found) {
    await found.update({
      state: state,
      metaData: metaData
    })
  } else {
    await RequirementState.create({
      sbuID: student.sbuId,
      requirementId: reqStr + requirementId,
      state: state,
      metaData: metaData
    })
  }
}


/* 
  Course Plan Items by their id
*/
exports.findItems = (req, res) => {
  let condition = req.query
  CoursePlan.findOne({
    where: condition
  }).then(coursePlan => {
    condition = {
      coursePlanId: coursePlan.coursePlanId
    }
    CoursePlanItem.findAll({
      where: condition
    }).then(coursePlanItems => {
      res.status(200).send(coursePlanItems)
    }).catch(err => {
      console.log(err)
    })
  })
}

exports.findAll = (req, res) => {
  CoursePlan
    .findAll({ where: req.query })
    .then(coursePlan => res.status(200).send(coursePlan))
    .catch(err => {
      console.log(err)
      res.status(500).send('Error')
    })
}

exports.count = (req, res) => {
  CoursePlanItem.findAll({
    where: req.query
  }).then(totalItems => {
    res.status(200).send(totalItems)
  }).catch(err => {
    console.log(err)
    res.status(500).send('Error')
  })
}

