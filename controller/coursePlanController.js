const { IncomingForm } = require('formidable')
const fs = require('fs')
const Papa = require('papaparse')
const { CourseOffering } = require('../config/database.js')
const database = require('../config/database.js')
const Op = database.Sequelize.Op
const Student = database.Student
const Course = database.Course
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem
const Degree = database.Degree
const GradeRequirement = database.GradeRequirement
const GpaRequirement = database.GpaRequirement
const CreditRequirement = database.CreditRequirement
const CourseRequirement = database.CourseRequirement
const RequirementState = database.RequirementState


const GRADES = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'F': 0 }
const semDict = {
  'Fall': 8,
  'Spring': 2,
  'Winter': 1,
  'Summer': 5
}
const currSem = 'Spring'
const currYear = 2021

// Upload course plans/grades CSV
exports.uploadPlans = (req, res) => {
  let form = new IncomingForm()
  let dept = ''
  let deleted = false
  form.parse(req).on('field', (name, field) => {
    if (name === 'dept')
      dept = field
    else if(name === 'delete'){
      deleted = field
    }
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
        if (header[0] !== 'sbu_id'
          || header[1] !== 'department'
          || header[2] !== 'course_num'
          || header[3] !== 'section'
          || header[4] !== 'semester'
          || header[5] !== 'year'
          || header[6] !== 'grade') {
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
  // let students = Array.from(new Set(coursePlans.map(item => item.sbu_id)))

async function uploadCoursePlans(coursePlans, dept, res, deleted) {
  console.log(deleted)
  // grabs all students of this department
  let students = await Student.findAll({ where: { department: dept }})
  // gets the list of only the sbuids of the students of this department
  students = Array.from(new Set(students.map(student => student.sbuId)))
  // filters the course plan items from the csv for only the students on this department 
  coursePlans = coursePlans.filter(coursePlan => students.includes(coursePlan.sbu_id) )
  students = coursePlans.map(item => item.sbu_id)
  // delete all existing course plan items for duplicate students from database
  console.log(coursePlans.includes(112206690))
  if(deleted === 'true'){
    let existCoursePlans = await CoursePlan.findAll({where : { studentId : students }})
    let coursePlanIds = existCoursePlans.map(coursePlan => coursePlan.coursePlanId)
    console.log("waiting for existing course plans", coursePlanIds)
    // Delete all courseplanitems 
    await CoursePlanItem.destroy({ where: { coursePlanId: coursePlanIds } })
    await RequirementState.destroy({where : {sbuID : students}})
  }
  // console.log(coursePlans)
  let studentsPlanId = {}
  // Create/Update all the course plan items
  for (let i = 0; i < coursePlans.length; i++) {
    if (!coursePlans[i].sbu_id)
      continue
    let condition = { studentId: coursePlans[i].sbu_id }
    let found = await CoursePlan.findOne({ where: condition })
    // console.log(found)
    if (!found) {
      console.log('Error: Course plan not found for student: ' + coursePlans[i].sbu_id)
      continue
    }
    studentsPlanId[coursePlans[i].sbu_id] = found.coursePlanId
    condition = {
      coursePlanId: found.coursePlanId,
      courseId: coursePlans[i].department + coursePlans[i].course_num,
      semester: coursePlans[i].semester,
      year: coursePlans[i].year
    }
    values = {
      coursePlanId: found.coursePlanId,
      courseId: coursePlans[i].department + coursePlans[i].course_num,
      semester: coursePlans[i].semester,
      year: coursePlans[i].year,
      section: coursePlans[i].section,
      grade: coursePlans[i].grade,
      validity: true
    }
    found = await CoursePlanItem.findOne({ where: condition })
    if (found)
      course = await CoursePlanItem.update(values, { where: condition })
    else if(deleted === 'true')
      course = await CoursePlanItem.create(values)
  }

  // Credits mapping for each course in the department
  let courses = await Course.findAll({ where: { department: dept } })
  let credits = {}
  for (let j = 0; j < courses.length; j++)
    credits[courses[j].courseId] = courses[j].credits
  calculateCompletion(studentsPlanId, credits, res)
}


function calculateGPA(coursePlanItems, credits) {
  let totalPoints = 0
  let totalCredits = 0
  for (let course of coursePlanItems) {
    let courseCredit = GRADES[course.grade] ? credits[course.courseId] : 0
    totalCredits += courseCredit
    totalPoints += courseCredit * (GRADES[course.grade] ? GRADES[course.grade] : 0)
  }
  return totalPoints / totalCredits
}


function getReqState(value, minimum) {
  if (value === 0)
    return 'unsatisfied'
  else if (value >= minimum)
    return 'satisfied'
  else
    return 'pending'
}


// Calculate course plan and requirements completion by setting states
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
    // Initialize the credit/gpa/grade requirement states
    let creditState = ''
    let gradeState = ''
    let gpaState = ''

    // Find the student and all the degree requirement objects for students degree
    let student = await Student.findOne({ where: { sbuId: key } })
    let degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
    // console.log(student)
    // console.log(degree.degreeId + '  ' + degree.creditRequirement )
    let creditReq = await CreditRequirement.findOne({ where: { requirementId: degree.creditRequirement } })
    let gpaReq = await GpaRequirement.findOne({ where: { requirementId: degree.gpaRequirement } })
    let gradeReq = await GradeRequirement.findOne({ where: { requirementId: degree.gradeRequirement } })
    let courseReq = await CourseRequirement.findAll({ where: { requirementId: degree.courseRequirement } })
    // Get this student's coursePlan to see what courses they've taken/currently taken/are going to take.
    let coursePlanItems = await CoursePlanItem.findAll({ where: { coursePlanId: studentsPlanId[key] } })

    // List of course plan items with grades
    let gradedCoursePlan = coursePlanItems.filter((course) => (
      course.grade !== null
    ))

    // List of course plan items that the student has taken and currently taking
    let takenAndCurrent = coursePlanItems.filter((course) => (
      (course.year < currYear) ||
      ((course.year === currYear) && (semDict[course.semester] <= semDict[currSem]))
    ))

    // CREDIT REQUIREMENT: Create and calculate credit requirement
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

    // GRADE REQUIREMENT: Create and calculate grade requirement if gradeRequirement exists
    if (gradeReq) {
      const numCredits = gradedCoursePlan
        .filter((course) => GRADES[course.grade] >= gradeReq.minGrade)
        .reduce((a, b) => a + credits[b.courseId], 0)
      gradeState = getReqState(numCredits, gradeReq.atLeastCredits)
      states[gradeState]++
      await updateOrCreate(student, 'Grade', gradeReq.requirementId, gradeState, [numCredits])
    }

    // GPA REQUIREMENT: Create and calculate GPA requirement 
    let studentDeptGpa = 0
    let studentCoreGpa = 0
    let studentCumGpa = 0
    let deptGpaState = ''
    let coreGpaState = ''
    let cumGpaState = ''
    // 1. Calculate departmental GPA if needed
    if (gpaReq.department) {
      let deptCourses = gradedCoursePlan.filter((course) => (
        course.courseId.slice(0, 3) === student.department
      ))
      studentDeptGpa = calculateGPA(deptCourses, credits)
      deptGpaState = getReqState(studentDeptGpa, gpaReq.department)
    }
    // 2. Calculate core GPA if needed
    if (gpaReq.core) {
      let coreCourses = new Set(courseReq
        .filter((req) => req.type === 1)
        .reduce((a, b) => b.courses.concat(a), []))
      coreCourses = takenAndCurrent.filter((course) => coreCourses.has(course.courseId))
      studentCoreGpa = calculateGPA(coreCourses, credits)
      coreGpaState = getReqState(studentCoreGpa, gpaReq.core)
    }
    // 3. Calculate cumulative GPA
    studentCumGpa = calculateGPA(gradedCoursePlan, credits)
    cumGpaState = getReqState(studentCumGpa, gpaReq.cumulative)
    // Set the state of the GPA requirement. 
    if ((deptGpaState === 'unsatisfied')
      || (coreGpaState === 'unsatisfied')
      || (cumGpaState === 'unsatisfied'))
      gpaState = 'unsatisfied'
    else if ((deptGpaState === 'pending')
      || (coreGpaState === 'pending')
      || (cumGpaState === 'pending'))
      gpaState = 'pending'
    else
      gpaState = 'satisfied'
    states[gpaState]++
    await updateOrCreate(student, 'Gpa', gpaReq.requirementId, gpaState,
      [studentCumGpa.toFixed(2), studentCoreGpa.toFixed(2), studentDeptGpa.toFixed(2)])

    // COURSE REQUIREMENT: Create and calculate course requirements
    let coursesCount = {}
    let passedCourses = {}
    let notTakenCourses = {}
    for (let j = 0; j < coursePlanItems.length; j++) {
      let course = coursePlanItems[j]
      if (course.grade && (GRADES[course.grade] >= GRADES['C'])) {
        if (passedCourses[course.courseId])
          passedCourses[course.courseId] += 1
        else
          passedCourses[course.courseId] = 1
      } else if (!course.grade) {
        if (notTakenCourses[course.courseId])
          notTakenCourses[course.courseId] += 1
        else
          notTakenCourses[course.courseId] = 1
      }
      if (coursesCount[course.courseId])
        coursesCount[course.courseId] += 1
      else
        coursesCount[course.courseId] = 1
    }
    let usedCourses = new Set()   // course cant be used for multiple requirements
    for (let requirement of courseReq) {  // each course requirement
      if (requirement.type === 0) // Not required for the degree 
        continue
      let coursesUsedForReq = []
      let courseReqState = ''
      let courseLower = (requirement.courseLower) ? requirement.courseLower : 9999999
      let creditLower = (requirement.creditLower) ? requirement.creditLower : 9999999
      let courseLowerCopy = courseLower
      let creditLowerCopy = creditLower
      let repeatFlag = false
      const courselen = requirement.courses.length
      for (let course of requirement.courses) {
        if (!coursesCount[course])
          continue
        // course plan contains the course
        let courseCredits = credits[course]
        let coRepeat = requirement.courseLower ? (requirement.courseLower > courselen) : false
        let crRepeat = requirement.creditLower ? (requirement.creditLower / courseCredits > courselen) : false
        // Course can be counted multiple times for the requirement
        if (coRepeat || crRepeat) {
          repeatFlag = true
          if ((coursesCount[course] >= courseLower) || (coursesCount[course] >= creditLower / courseCredits)) {
            // Check courses taken and currently taking
            let passed = passedCourses[course]
            if (passed && ((passed >= courseLower) || (passed >= creditLower / courseCredits)))
              courseReqState = 'satisfied'
            else
              courseReqState = 'pending'
          } else
            courseReqState = 'unsatisfied'
          usedCourses.add(course)
          coursesUsedForReq.push(course)
          break
        }
        // Course was not used for another requirement: only count if passed or not taken yet
        else if (!usedCourses.has(course) && (passedCourses[course] || notTakenCourses[course])) {
          usedCourses.add(course)
          coursesUsedForReq.push(course)
          if (passedCourses[course]) {
            passedCourses[course] -= 1
            if (passedCourses[course] === 0)
              delete passedCourses[course]
          } else if (notTakenCourses[course]) {
            courseReqState = 'pending'
            notTakenCourses[course] -= 1
            if (notTakenCourses[course] === 0)
              delete notTakenCourses[course]
          }
          courseLower -= 1
          creditLower -= courseCredits
          if (courseLower <= 0 || creditLower <= 0)
            break
        }
      }
      if (!repeatFlag) {
        if (courseLower === courseLowerCopy || creditLower === creditLowerCopy)
          courseReqState = 'unsatisfied'
        else if (courseReqState === '' && (courseLower <= 0 || creditLower <= 0))
          courseReqState = 'satisfied'
        else
          courseReqState = 'pending'
      }
      states[courseReqState]++
      await updateOrCreate(student, 'Course', requirement.requirementId, courseReqState, coursesUsedForReq)
    }
    tot += 1
    await student.update({
      unsatisfied: states['unsatisfied'],
      satisfied: states['satisfied'],
      pending: states['pending'],
      gpa: studentCumGpa ? studentCumGpa.toFixed(2) : 0
    })

    // If all course plan items are pending and satisfied (no unsatisfied), then the course plan is complete
    notTakenCourses = coursePlanItems.filter(item => item.grade === null)
    let coursePlanValidity = await setCoursePlanValidity(notTakenCourses)
    let studentCoursePlan = await CoursePlan.findOne({ where: { coursePlanId: studentsPlanId[key] } })
    await studentCoursePlan.update({
      coursePlanComplete: (states['unsatisfied'] === 0) ? true : false,
      coursePlanValidity: coursePlanValidity
    })
  }
  console.log('Done calculating ' + tot + ' students course plan completion')
  res.status(200).send('Success')
}


async function setCoursePlanValidity(notTakenCourses) {
  let coursePlanValidity = true
  if (notTakenCourses.length === 0)
    return coursePlanValidity
  // 1. Get list of all semester+year pairs
  let semesterYears = Array.from(new Set(notTakenCourses.map(item => item.semester + ' ' + item.year)))
    .map(item => item.split(' '))
  // 2. Filter list of semyears by semyears that have course offerings
  let semYears = []
  for (let semYear of semesterYears) {
    let found = await CourseOffering.findOne({ where: { semester: semYear[0], year: semYear[1] } })
    if (found)
      semYears.push(semYear)
  }
  for (let semYear of semYears) {
    let invalidItems = []
    // Course plan items for the current semester and year only
    let courses = notTakenCourses.filter(item => item.semester === semYear[0] && item.year === Number(semYear[1]))
    // 3. Get all course offerings for the semester and year
    let courseOfferings = await CourseOffering.findAll({
      where: {
        identifier: courses.map(item => item.courseId),
        semester: semYear[0],
        year: Number(semYear[1])
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
        if (!first.startTime || !second.startTime
          || !first.endTime || !second.endTime
          || !first.days || !second.days)
          continue
        let fDays = first.days
        let sDays = second.days
        if ((fDays.includes('M') && sDays.includes('M')) ||
          (fDays.includes('TU') && sDays.includes('TU')) ||
          (fDays.includes('W') && sDays.includes('W')) ||
          (fDays.includes('TH') && sDays.includes('TH')) ||
          (fDays.includes('F') && sDays.includes('F'))) {
          // Check time conflict
          let fStart = first.startTime
          let sStart = second.startTime
          let fEnd = first.endTime
          let sEnd = second.endTime
          if ((fStart >= sStart && fStart < sEnd) ||
            (fEnd <= sEnd && fEnd > sStart) ||
            (sStart >= fStart && sStart < fEnd) ||
            (sEnd <= fEnd && sEnd > fStart)) {
            invalidItems.push(first.identifier)
            invalidItems.push(second.identifier)
          }
        }
      }
    }
    // update courseplanitem validty for invaliditems
    if (notTakenCourses[0].coursePlanId === 114) {
      console.log(invalidItems)
    }
    if (invalidItems) {
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
  CoursePlan.findOne({ where: condition }).then(coursePlan => {
    condition = { coursePlanId: coursePlan.coursePlanId }
    CoursePlanItem.findAll({ where: condition }).then(coursePlanItems => {
      res.status(200).send(coursePlanItems)
    }).catch(err => {
      console.log(err)
    })
  })
}

exports.findAll = (req, res) => {
  let condition = req.query
  CoursePlan.findAll({ where: condition }).then(coursePlan => {
    res.status(200).send(coursePlan)
  }).catch(err => {
    console.log(err)
  })
}

exports.count = (req, res) => {
  let condition = req.query
  CoursePlanItem.findAll({ where: condition }).then(totalItems => {
    res.status(200).send(totalItems)
  }).catch(err => {
    console.log(err)
  })
}

exports.filterCV = (req, res) => {
  // console.log(req.query)
  let condition = { studentId: req.query.studentId }
  complete = Number(req.query.complete)
  valid = Number(req.query.valid)
  if(valid !== -1 && complete !== -1) {
    // console.log("Complete and valid filter")
    // console.log("Complete: ", valid, " Valid: ", complete)
    condition = {
      [Op.and]: [
        { studentId: req.query.studentId },
        { coursePlanComplete: complete },
        { coursePlanValid: valid}
      ]
    }
  }
  else if(complete !== -1) {
    // console.log("Complete filter")
    // console.log("Complete: ", valid, " Valid: ", complete)
    condition = {
      [Op.and]: [
        { studentId: req.query.studentId },
        { coursePlanComplete: complete }
      ]
    }
  }
  else if(valid !== -1) {
    // console.log("Valid filter")
    // console.log("Complete: ", valid, " Valid: ", complete)
    condition = {
      [Op.and]: [
        { studentId: req.query.studentId },
        { coursePlanValid: valid }
      ]
    }
  }
  CoursePlan.findAll({ where: condition }).then(results => { 
    res.status(200).send(results)
  }).catch(err => {
    console.log(err)
    res.status(500).send('Error')
  })
}

// Delete all course plans and student reqs from database. Used primarly for testing by GPD
exports.deleteAll = (req, res) => {
  CoursePlanItem.drop().then(() => {
    database.sequelize.sync({ force: false })
    CoursePlan.drop().then(() => {
      database.sequelize.sync({ force: false })
      RequirementState.drop().then(() => {
        database.sequelize.sync({ force: false })
        res.status(200).send('Deleted course plan data.')
      })
    })
  })
  .catch(err => {
    console.log('Delete course plan error' + err)
    res.status(500).send('Error: ' + err)
  })
  
}