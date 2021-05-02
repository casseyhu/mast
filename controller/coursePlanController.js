const { IncomingForm } = require('formidable')
const fs = require('fs')
const Papa = require('papaparse')
const { currSem, currYear, GRADES, SEMTONUM, NUMTOSEM } = require('./constants')
const { findRequirements, checkTimeConflict, findCoursePlanItems, updateOrCreate, beforeCurrent } = require('./shared')
const database = require('../config/database.js')

const Student = database.Student
const Course = database.Course
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem
const CourseOffering = database.CourseOffering
const Op = database.Sequelize.Op
const Degree = database.Degree
const RequirementState = database.RequirementState


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
          uploadCoursePlans(results.data, dept, res, deleted)
        }
      })
    })
}


/**
 * Updates a students course plan item (grade and/or section) and recalculates their course
 * plan completion.
 * @param {*} req Contains information about the student and their updated course plan values
 * @param {*} res 
 */
exports.updateItem = async (req, res) => {
  const info = req.body.params
  // console.log(info)
  try {
    await CoursePlanItem.update({
      grade: info.grade,
      section: info.section ? info.section : info.planItem.section,
      validity: true
    }, {
      where: {
        coursePlanId: info.planItem.coursePlanId,
        courseId: info.planItem.courseId,
        semester: info.planItem.semester,
        year: info.planItem.year,
        status: 1
      }
    })

    let studentsPlanId = {}
    studentsPlanId[info.student.sbuId] = info.planItem.coursePlanId
    await calculateCompletion(studentsPlanId, info.student.department, null)
    const items = await CoursePlanItem.findAll({ where: { coursePlanId: info.planItem.coursePlanId } })
    res.status(200).send(items)
  } catch (err) {
    console.log(err)
    res.status(500).send('Could not update course plan entry')
  }
}


exports.deleteItem = async (req, res) => {
  const params = req.body.params
  try {
    let del = await CoursePlanItem.destroy({
      where: {
        coursePlanId: params.course.coursePlanId,
        courseId: params.course.courseId,
        semester: params.course.semester,
        year: params.course.year,
      }
    })
    let studentsPlanId = {}
    studentsPlanId[params.sbuId] = params.course.coursePlanId
    await calculateCompletion(studentsPlanId, params.department, null)
    const items = await CoursePlanItem.findAll({ where: { coursePlanId: params.course.coursePlanId } })
    res.status(200).send(items)
  } catch (err) {
    console.log('Error in deleting item from plan')
    console.log(err)
    res.status(500).send('Could not delete course from course plan.')
  }
}


/**
 * Add a course to a student's course plan item. 
 * If the course to add will cause conflicts with other courses for the semester, 
 * then don't add.  
 * @param {*} req Contains information (i.e student's id), which is used to find the
 * course plan for the student, to add the new course to. 
 * @param {*} res 
 * @returns 
 */
exports.addItem = async (req, res) => {
  console.log('adding course')
  let query = req.body.params
  // Find student's courseplanId by getting their coursePlan first.
  let coursePlan = await CoursePlan.findOne({
    where: {
      studentId: query.sbuId
    }
  })
  let conflictingCourses = []
  let courseId = query.courseId ? query.courseId : query.course.courseId
  let queryCourse = await CourseOffering.findOne({
    where: {
      identifier: courseId,
      semester: query.semester,
      year: query.year,
      section: query.section
    }
  })
  if (queryCourse) {
    for (let semCourse of query.coursePlan) {
      let courseB = await CourseOffering.findOne({
        where: {
          identifier: semCourse.courseId,
          semester: semCourse.semester,
          year: semCourse.year,
          section: semCourse.section
        }
      })
      checkTimeConflict(queryCourse, courseB, conflictingCourses)
    }
    if (conflictingCourses.length !== 0) {
      let ret = Array.from(new Set(conflictingCourses))
      ret.splice(ret.indexOf(courseId), 1)
      res.status(500).send('Course ' + courseId + ' has time conflicts with: ' +
        ret.join(', ') + '; Unable to add.')
      return
    }
  }
  // Insert the course into the student's courseplanitems. 
  try {
    let insert = await CoursePlanItem.create({
      coursePlanId: coursePlan.coursePlanId,
      courseId: courseId,
      semester: query.semester,
      year: query.year,
      section: query.section,
      grade: query.grade ? query.grade : null,
      validity: true,
      status: query.status ? query.status : 1
    })
    // After adding the course, re-calculate their completion. 
    let studentsPlanId = {}
    studentsPlanId[query.sbuId] = coursePlan.coursePlanId
    console.log('added course, now trying to recalculate their completion')
    await calculateCompletion(studentsPlanId, query.department, null)
    const cpItems = await CoursePlanItem.findAll({ where: { coursePlanId: coursePlan.coursePlanId } })
    res.status(200).send(cpItems)
  } catch (error) {
    console.log(error)
    res.status(500).send('Unable to add course to course plan.')
  }
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
  // 1. Filters the course plan items from the csv for only the students of this department 
  coursePlans = coursePlans.filter(coursePlan => students.has(coursePlan.sbu_id))
  students = coursePlans.map(item => item.sbu_id)
  // Find all existing course plan items for students of this department
  const existCoursePlans = await CoursePlan.findAll({ where: { studentId: students } })
  // 2. Delete all course plan items and requirement states for the list of students
  if (deleted === 'true') {
    await CoursePlanItem.destroy({
      where: {
        coursePlanId: existCoursePlans.map(coursePlan => coursePlan.coursePlanId)
      }
    })
    await RequirementState.destroy({ where: { sbuID: students } })
  }
  let studentsPlanId = {}
  let courses = {}
  existCoursePlans.forEach(plan => studentsPlanId[plan.studentId] = plan.coursePlanId)
  // 3. Create/Update all the course plan items for students of this department
  for (let i = 0; i < coursePlans.length; i++) {
    const item = coursePlans[i]
    if (!item.sbu_id || !studentsPlanId[item.sbu_id] || !SEMTONUM[item.semester]
      || Number(item.year) < 2000 || Number(item.year) > 2500 || (item.grade && !(item.grade in GRADES))) {
      console.log('Error: Invalid fields')
      continue
    }
    // Check if course is a valid course
    if (!courses[item.department + item.course_num]) {
      let found = await Course.findOne({ where: { courseId: item.department + item.course_num } })
      if (!found)
        continue
      courses[item.department + item.course_num] = found
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
      section: item.section ? item.section : 'N/A',
      grade: item.grade,
      validity: true
    }
    if (deleted === 'true') {
      try {
        await CoursePlanItem.create(values)
      } catch (err) {
        console.log(item.department + item.course_num + ' for ' + item.sbu_id + ' Already Created')
      }
    } else
      await updateOrCreate(CoursePlanItem, condition, values, true, false)
  }
  calculateCompletion(studentsPlanId, dept, res)
}


/**
 * Recalculate all the requirement completion and update the requirement states when the degree of a 
 * student has been altered.
 * @param {Map<String, String>} studentsPlanId Mapping of sbuId to coursePlanId
 * @param {String} department Department to calcualte for
 * @param {*} res 
*/
exports.changeCompletion = async (studentsPlanId, department, res) => {
  calculateCompletion(studentsPlanId, department, res)
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
    // Transfer credits don't count towards GPA
    if (course.status === 2)
      continue
    let courseCredit = credits[course.courseId] ? credits[course.courseId] : 0
    totalCredits += courseCredit
    totalPoints += courseCredit * (GRADES[course.grade] ? GRADES[course.grade] : 0)
  }
  if (totalCredits === 0)
    return 0
  else
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
    if (coursePlanItems[j].grade && GRADES[coursePlanItems[j].grade] < GRADES['C'])
      continue
    // Create the course credits mapping and get total credits for their entire course plan
    let courseName = coursePlanItems[j].courseId
    if (!credits[courseName]) {
      let course = await Course.findOne({ where: { courseId: courseName } })
      if (course && course.minCredits !== null && course.maxCredits !== null)
        credits[courseName] = (course.minCredits <= 3 && course.maxCredits >= 3) ? 3 : course.minCredits
      else { // should not get to here...
        console.log('course doesnt exist: ' + courseName)
        credits[courseName] = 3
      }
    }
    totalCredits += credits[courseName]
  }
  const actualCredits = takenAndCurrent.reduce((a, b) => a + (GRADES[b.grade] >= GRADES['C'] && credits[b.courseId]), 0)
  // Students entire course plan will not satify the requirement
  if (totalCredits < creditReq.minCredit) {
    creditState = 'unsatisfied'
    states[creditState]++
  } else {
    // Actual number of credits for courses the student has taken or curently taking
    creditState = getReqState(actualCredits, creditReq.minCredit)
    states[creditState]++
  }
  await updateOrCreateReq(student, 'CR', creditReq.requirementId, creditState, [actualCredits])
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
    await updateOrCreateReq(student, 'GR', gradeReq.requirementId, gradeState, [numCredits])
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
 * @param {Array[Object]} gradedCoursePlan Course plan items for current student that have grades
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
    deptGpaState = studentDeptGpa < gpaReq.department ? 'unsatisfied' : 'satisfied'
  }
  // 2. Calculate core GPA if needed
  if (gpaReq.core) {
    let coreCourses = new Set(courseReq
      .filter(req => req.type === 1)
      .reduce((a, b) => b.courses.concat(a), []))
    coreCourses = gradedCoursePlan.filter(course => coreCourses.has(course.courseId))
    studentCoreGpa = calculateGPA(coreCourses, credits)
    coreGpaState = studentCoreGpa < gpaReq.core ? 'unsatisfied' : 'satisfied'
  }
  // 3. Calculate cumulative GPA
  studentCumGpa = calculateGPA(gradedCoursePlan, credits)
  cumGpaState = studentCumGpa < gpaReq.cumulative ? 'unsatisfied' : 'satisfied'
  // 4. Set the state of the GPA requirement. 
  if (deptGpaState === 'unsatisfied' || coreGpaState === 'unsatisfied' || cumGpaState === 'unsatisfied')
    gpaState = 'unsatisfied'
  else
    gpaState = 'satisfied'
  states[gpaState]++
  await updateOrCreateReq(student, 'G', gpaReq.requirementId, gpaState,
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
  // 1. Each course requirement which contains a list of courses that can be used to satify the requirement
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
      // 2. Compare length of courses in list to the credit or course lower
      let coRepeat = requirement.courseLower ? (requirement.courseLower > courselen) : false
      let crRepeat = requirement.creditLower ? (requirement.creditLower / courseCredits > courselen) : false
      repeatFlag = coRepeat || crRepeat
      // 3. If course can be counted multiple times for the requirement
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
      // 4. Not repeat course. Only count if student passed the course and keep track of future courses that satisfy requirement
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
      if (courseLower <= 0 || creditLower <= 0) // if satisfied with taken courses, then satisfied
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
    await updateOrCreateReq(student, 'C', requirement.requirementId, courseReqState, coursesUsedForReq)
  }
}


/**
 * Updates students course plan completion and requirement states by recalculating
 * all degree requirement states (gpa, grade, credit, course).
 * @param {Map<String, String>} studentsPlanId Mapping of sbuId to coursePlanId
 * @param {String} department Department to calculate for
 * @param {*} res 
 */
async function calculateCompletion(studentsPlanId, department, res) {
  console.log('Calculating student CoursePlan completion...')
  // Credits mapping for each course in the department
  const courses = await Course.findAll({ where: { department: department } })
  let credits = {}
  courses.forEach(course => credits[course.courseId] = course.credits)

  let tot = 0
  let degrees = {}
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
    if (!degrees[student.degreeId])
      degrees[student.degreeId] = await findRequirements(degree)
    const [gradeReq, gpaReq, creditReq, courseReq] = degrees[student.degreeId]
    // Get this student's coursePlan to see what courses they've taken/currently taken/are going to take.
    const coursePlanItems = await CoursePlanItem.findAll({
      where: {
        coursePlanId: studentsPlanId[key],
        status: {[Op.or]: [1, 2]}
      }
    })
    // List of course plan items with grades
    const gradedCoursePlan = coursePlanItems.filter(course => course.grade !== null)
    // List of course plan items that the student has taken and currently taking
    const takenAndCurrent = coursePlanItems.filter(course => (
      (course.year < currYear) ||
      ((course.year === currYear) && (SEMTONUM[course.semester] <= SEMTONUM[currSem]))
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
    let studentCoursePlan = await CoursePlan.findOne({
      where: {
        coursePlanId: studentsPlanId[key]
      }
    })
    const notTakenCourses = coursePlanItems.filter(item => item.grade === null)
    const coursePlanValidity = await checkCoursePlanValidity(notTakenCourses)
    await studentCoursePlan.update({
      coursePlanComplete: (states['unsatisfied'] === 0) ? true : false,
      coursePlanValid: coursePlanValidity // added for sorting via browse
    })
  }
  console.log('Done calculating ' + tot + ' students course plan completion')
  if (res)
    res.status(200).send('Success')
}


/**
 * Given a list of courses that the student has NOT taken yet, check if course plan items
 * for a given semester and year is valid if course offerings for that semester and year
 * were imported.
 * @param {Array<Object>} notTakenCourses List of course plan items that were not taken by student
 * @returns Boolean indicating if course plan is valid or not
 */
async function checkCoursePlanValidity(notTakenCourses) {
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
    courseOfferings.map(offering => courseOfferingMap[offering.identifier + offering.section] = offering)
    for (let i = 0; i < courses.length; i++) {
      // If course was not offered, set validity to false
      if (!courseOfferingMap[courses[i].courseId + courses[i].section]) {
        invalidItems.push(courses[i].courseId)
        continue
      }
      // Course was offered in semester and year
      for (let j = i + 1; j < courses.length; j++) {
        let first = courseOfferingMap[courses[i].courseId + courses[i].section]
        if (!courseOfferingMap[courses[j].courseId + courses[j].section]) {
          invalidItems.push(courses[j].courseId)
          continue
        }
        let second = courseOfferingMap[courses[j].courseId + courses[j].section]
        checkTimeConflict(first, second, invalidItems)
      }
    }
    // update courseplanitem validty for invaliditems
    if (invalidItems.length > 0) {
      await CoursePlanItem.update({ validity: false }, {
        where: {
          coursePlanId: notTakenCourses[0].coursePlanId,
          courseId: invalidItems,
          semester: semester,
          year: year
        }
      })
      coursePlanValidity = false
    }
  }
  return coursePlanValidity
}


/**
 * Update or create a degree requirement state.
 * @param {Object} student Student to update requirement for
 * @param {String} requirementType Requirement type (Credit, Grade, Gpa, Course)
 * @param {Number} requirementId Requirement ID of requirement
 * @param {String} state State to set requirement (unsatisfied, pending, satisfied)
 * @param {Array<String>} metaData List of metadata information to store with requirement state
 */
async function updateOrCreateReq(student, requirementType, requirementId, state, metaData) {
  let condition = {
    sbuID: student.sbuId,
    requirementId: requirementType + requirementId
  }
  let values = {
    sbuID: student.sbuId,
    requirementId: requirementType + requirementId,
    state: state,
    metaData: metaData
  }
  await updateOrCreate(RequirementState, condition, values, true, true)
}


/**
 * Finds all course plan items for a given studentId.
 * @param {*} req Contains paramaters containing studentId
 * @param {*} res 
 */
exports.findItems = async (req, res) => {
  try {
    const coursePlanItems = await findCoursePlanItems(req.query.sbuId)
    res.status(200).send(coursePlanItems)
  } catch (err) {
    console.log(err)
    res.status(500).send('Error')
  }
}


/**
 * Finds the list of course plan items for a course in a specified semester and year.
 * @param {*} req Contains paramters for courseId, semester, and year
 * @param {*} res 
 */
exports.count = (req, res) => {
  CoursePlanItem
    .findAll({ where: req.query })
    .then(totalItems => res.status(200).send(totalItems))
    .catch(err => {
      console.log(err)
      res.status(500).send('Error')
    })
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
exports.addSuggestion = async (req, res) => {
  const query = req.body.params
  const courses = query.courses
  const student = query.student
  let coursePlan = await CoursePlan.findOne({ where: { studentId: student.sbuId } })
  if (!coursePlan) {
    console.log('Course plan not found')
    res.status(500).send('Course plan not found')
    return
  }
  for (let semyear of Object.keys(courses)) {
    const year = Number(semyear.substring(0, 4))
    const semester = NUMTOSEM[Number(semyear.substring(4))]
    console.log(student.sbuId)
    for (let node of courses[semyear]) {
      let condition = {
        coursePlanId: coursePlan.coursePlanId,
        courseId: node.course,
        semester: semester,
        year: year,
        section: node.section ? node.section : 'N/A'
      }
      let values = {
        coursePlanId: coursePlan.coursePlanId,
        courseId: node.course,
        semester: semester,
        year: year,
        section: node.section ? node.section : 'N/A',
        grade: null,
        validity: true,
        status: 0
      }
      // Only create if it doesnt exist yet in course plan
      await updateOrCreate(CoursePlanItem, condition, values, false, true)
    }
  }
  let items = await CoursePlanItem.findAll({ where: { coursePlanId: coursePlan.coursePlanId } })
  res.status(200).send(items)
}


exports.accept = async (req, res) => {
  try {
    const items = req.body.params.items
    const checked = req.body.params.checked
    const student = req.body.params.student
    for (let index in items) {
      if (checked[index])
        await CoursePlanItem.update({ status: 1 }, { where: items[index] })
      else
        await CoursePlanItem.destroy({ where: items[index] })
    }
    let studentsPlanId = {}
    studentsPlanId[student.sbuId] = items[0].coursePlanId
    await calculateCompletion(studentsPlanId, student.department, null)
    const newItems = await CoursePlanItem.findAll({ where: { coursePlanId: items[0].coursePlanId } })
    res.status(200).send(newItems)
  } catch (err) {
    console.log(err)
    res.status(500).send('Invalid query')
  }
}


exports.checkPreconditions = async (req, res) => {
  let coursePlan = await CoursePlan.findOne({
    where: {
      studentId: req.query.sbuId
    }
  })
  let course = JSON.parse(req.query.course)
  // Check if the sem+year the student is adding to has grades already.
  const items = await CoursePlanItem.findAll({
    where: {
      coursePlanId: coursePlan.coursePlanId,
      semester: req.query.semester,
      year: req.query.year,
      status: 1
    }
  })
  if (items.length > 0) {
    for (let item of items) {
      if (item.grade) {
        res.status(500).send('Cannot add courses to semester with imported grades.')
        return
      }
    }
  }
  // Check if the course already exists in the course plan for semester+year.
  let found = await CoursePlanItem.findOne({
    where: {
      coursePlanId: coursePlan.coursePlanId,
      courseId: course.courseId,
      semester: req.query.semester,
      year: Number(req.query.year),
      // section: req.query.section,
    }
  })
  if (found) {
    res.status(500).send('Course ' + course.courseId + ' already exists in ' +
      req.query.semester + ' ' + req.query.year + '.')
    return
  }
  // Check if we have Course Offerings for the given semester + year.
  // If course offerings were imported, then check if this course has offerings. 
  found = await CourseOffering.findOne({
    where: {
      semester: req.query.semester,
      year: req.query.year
    }
  })
  if (!found) {
    // If no course offerings were imported for SEM+YEAR, they can add course. 
    res.status(200).send(true)
    return
  }
  // Else, we have to check if there exists an offering for this course in SEM+YEAR.
  // For now, it finds ALL possible offerings (all sections) of this course in SEM+YEAR. 
  let offering = await CourseOffering.findAll({
    where: {
      identifier: course.courseId,
      semester: req.query.semester,
      year: req.query.year
    }
  })
  if(offering.length > 0) {
    // There were offerings found for this course.
    res.status(200).send(true)
    return 
  }
  else {
    res.status(500).send('Course ' + course.courseId + ' has no offerings for ' + 
      req.query.semester + ' ' + req.query.year + '.')
    return
  }
  // res.status(200).send(false)
}