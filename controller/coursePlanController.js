const database = require('../config/database.js');

const Student = database.Student;
const Course = database.Course;
const CoursePlan = database.CoursePlan;
const CoursePlanItem = database.CoursePlanItem;
const Degree = database.Degree;
const GradeRequirement = database.GradeRequirement;
const GpaRequirement = database.GpaRequirement;
const CreditRequirement = database.CreditRequirement;
const CourseRequirement = database.CourseRequirement;
const RequirementState = database.RequirementState;

const { IncomingForm } = require('formidable');
const fs = require('fs');
const Papa = require('papaparse');

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
  let form = new IncomingForm();
  let dept = ''
  form.parse(req).on('field', (name, field) => {
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
        uploadCoursePlans(coursePlans, dept, res)
      }
    })
  })
}


async function uploadCoursePlans(coursePlans, dept, res) {
  let students = await Student.findAll({ where: { department: dept } })
  students = new Set(students.map(student => student.sbuId))
  coursePlans = coursePlans.filter(coursePlan => students.has(coursePlan.sbu_id))
  // console.log(coursePlans)
  let studentsPlanId = {}
  // Create/Update all the course plan items
  for (let i = 0; i < coursePlans.length; i++) {
    if (!coursePlans[i].sbu_id)
      continue
    let condition = { studentId: coursePlans[i].sbu_id }
    let found = await CoursePlan.findOne({ where: condition })
    if (!found) {
      console.log(condition)
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
      validity: 1
    }
    found = await CoursePlanItem.findOne({ where: condition })
    if (found)
      course = await CoursePlanItem.update(values, { where: condition })
    else
      course = await CoursePlanItem.create(values)
  }

  // Create mapping of all courses to credits to calculate GPA for each student
  let courses = await Course.findAll()
  let courseCredit = {}
  for (let j = 0; j < courses.length; j++)
    courseCredit[courses[j].courseId] = courses[j].credits
  // await calculateGPA(studentsPlanId, courseCredit, res)
  await calculateCompletion(studentsPlanId, res)
}


// // Calculate and update the GPA for each student that was imported
// async function calculateGPA(studentsPlanId, courseCredit, res) {
//   for (let key in studentsPlanId) {
//     let condition = { coursePlanId: studentsPlanId[key] }
//     let items = await CoursePlanItem.findAll({ where: condition })
//     if (items) {
//       const foundItems = items.filter(item => (item.grade !== null))
//       let earnedPoints = 0
//       let totPoints = 0
//       for (let i = 0; i < foundItems.length; i++) {
//         if (!courseCredit[foundItems[i].courseId] || !GRADES[foundItems[i].grade])
//           continue
//         earnedPoints += GRADES[foundItems[i].grade] * courseCredit[foundItems[i].courseId]
//         totPoints += courseCredit[foundItems[i].courseId]
//       }
//       let GPA = (earnedPoints / totPoints)
//       if (key && !isNaN(GPA)) {
//         GPA = GPA.toFixed(2)
//         await Student.update({ gpas: GPA }, { where: { sbuId: key } })
//       }
//     }
//     else
//       console.log("error getting course plan items")
//   }
//   console.log("Done calculating GPAs")
//   // res.status(200).send("Success")
// }


// Calculate course plan and requirements completion by setting states
async function calculateCompletion(studentsPlanId, res) {
  console.log("Calculating student CoursePlan completion...")
  let tot = 0
  // Credits mapping for each course in a given semester and year
  let credits = {}

  // Loop through each student (key = sbu ID)
  for (let key in studentsPlanId) {
    // Keep track of total number of satisfied/pending/unsatisfied requirements
    let unsatisfied = 0
    let satisfied = 0
    let pending = 0

    let creditState = ''
    let gradeState = ''
    let gpaState = ''

    // Find the student and all the degree requirement objects for students degree
    let student = await Student.findOne({ where: { sbuId: key } })
    let degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
    let creditReq = await CreditRequirement.findOne({ where: { requirementId: degree.creditRequirement } })
    let gpaReq = await GpaRequirement.findOne({ where: { requirementId: degree.gpaRequirement } })
    let gradeReq = await GradeRequirement.findOne({ where: { requirementId: degree.gradeRequirement } })
    let courseReq = await CourseRequirement.findAll({ where: { requirementId: degree.courseRequirement } })
    // Get this student's coursePlan to see what courses they've taken/currently taken/are going to take.
    let coursePlanItems = await CoursePlanItem.findAll({ where: { coursePlanId: studentsPlanId[key] } })

    // List of course plan items with grades
    let gradedCoursePlan = coursePlanItems.filter((course) => (
      course.grade !== null
    ));

    // List of course plan items that the student has taken and currently taking
    let takenAndCurrent = coursePlanItems.filter((course) => (
      (course.year < currYear) ||
      ((course.year === currYear) && (semDict[course.semester] <= semDict[currSem]))
    ));

    // CREDIT REQUIREMENT: Create and calculate credit requirement
    let totalCredits = 0
    for (let j = 0; j < coursePlanItems.length; j++) {
      // Create the course credits mapping and get total credits for their entire course plan
      let coursePlanItem = coursePlanItems[j]
      let coursePlanItemCSY = coursePlanItem.courseId + coursePlanItem.semester + coursePlanItem.year
      if (!credits[coursePlanItemCSY]) {
        let course = await Course.findOne({
          where: {
            courseId: coursePlanItem.courseId
            // ,
            // semester: coursePlanItem.semester,
            // year: coursePlanItem.year
          }
        })
        if (course && course.credits)
          credits[coursePlanItemCSY] = course.credits;
      }
      totalCredits += credits[coursePlanItemCSY] ? credits[coursePlanItemCSY] : 0
    }
    // Students entire course plan will not satify the requirement
    let actualCredits = takenAndCurrent.reduce((a, b) => (
      a + credits[b.courseId + b.semester + b.year]
    ), 0)
    if (totalCredits < creditReq.minCredit) {
      creditState = 'unsatisfied'
      unsatisfied++
    } else {
      // Actual number of credits for courses the student has taken or curently taking
      if (actualCredits === 0) {
        creditState = 'unsatisfied'
        unsatisfied++
      } else if (actualCredits >= creditReq.minCredit) {
        creditState = 'satisfied'
        satisfied++
      } else {
        creditState = 'pending'
        pending++
      }
    }
    await updateOrCreate(student, 'Credit', creditReq.requirementId, creditState, [actualCredits])

    // GRADE REQUIREMENT: Create and calculate grade requirement if gradeRequirement exists
    if (gradeReq) {
      const numCredits = gradedCoursePlan
        .filter((course) => GRADES[course.grade] >= gradeReq.minGrade)
        .reduce((a, b) => a + credits[b.courseId + b.semester + b.year], 0);
      if (numCredits === 0) {
        gradeState = 'unsatisfied'
        unsatisfied++
      } else if (numCredits >= gradeReq.atLeastCredits) {
        gradeState = 'satisfied'
        satisfied++
      } else {
        gradeState = 'pending'
        pending++
      }
      await updateOrCreate(student, 'Grade', gradeReq.requirementId, gradeState, [])
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
      ));
      let deptTotalPoints = 0;
      let deptTotalCredits = 0;
      for (let deptCourse of deptCourses) {
        let courseCredit = credits[deptCourse.courseId + deptCourse.semester + deptCourse.year]
        deptTotalCredits += courseCredit
        deptTotalPoints += courseCredit * GRADES[deptCourse.grade]
      }
      studentDeptGpa = deptTotalPoints / deptTotalCredits
      if (studentDeptGpa === 0)
        deptGpaState = 'unsatisfied'
      else if (studentDeptGpa >= gpaReq.department)
        deptGpaState = 'satisfied'
      else
        deptGpaState = 'pending'
    }
    // 2. Calculate core GPA if needed
    if (gpaReq.core) {
      let coreCourses = new Set(courseReq
        .filter((req) => req.type === 1)
        .reduce((a, b) => b.courses.concat(a), []))
      coreCourses = takenAndCurrent
        .filter((course) => coreCourses.has(course.courseId));
      let coreTotalPoints = 0;
      let coreTotalCredits = 0;
      for (let coreCourse of coreCourses) {
        let courseCredit = credits[coreCourse.courseId + coreCourse.semester + coreCourse.year]
        coreTotalCredits += courseCredit
        coreTotalPoints += courseCredit * GRADES[coreCourse.grade]
      }
      studentCoreGpa = coreTotalPoints / coreTotalCredits
      if (studentCoreGpa === 0)
        coreGpaState = 'unsatisfied'
      else if (studentCoreGpa >= gpaReq.core)
        coreGpaState = 'satisfied'
      else
        coreGpaState = 'pending'
    }
    // 3. Calculate cumulative GPA
    let cumTotalPoints = 0;
    let cumTotalCredits = 0;
    for (let course of gradedCoursePlan) {
      let courseCredit = credits[course.courseId + course.semester + course.year]
      cumTotalCredits += courseCredit
      cumTotalPoints += courseCredit * GRADES[course.grade]
    }
    studentCumGpa = cumTotalPoints / cumTotalCredits
    if (studentCumGpa === 0)
      cumGpaState = 'unsatisfied'
    else if (studentCumGpa >= gpaReq.cumulative)
      cumGpaState = 'satisfied'
    else
      cumGpaState = 'pending'
    // Set the state of the GPA requirement. 
    if ((deptGpaState === 'unsatisfied') || (coreGpaState === 'unsatisfied') || (cumGpaState === 'unsatisfied')) {
      gpaState = 'unsatisfied'
      unsatisfied++
    } else if ((deptGpaState === 'pending') || (coreGpaState === 'pending') || (cumGpaState === 'pending')) {
      gpaState = 'pending'
      pending++
    } else {
      gpaState = 'satisfied'
      satisfied++
    }
    await updateOrCreate(student, 'Gpa', gpaReq.requirementId, gpaState,
      [studentCumGpa.toFixed(2), studentCoreGpa.toFixed(2), studentDeptGpa.toFixed(2)])
    if (student.sbuId === 125318430) {
      console.log('gpas: ', studentCumGpa, studentCoreGpa, studentDeptGpa)
      console.log('totalCredits: ' + totalCredits)
      console.log('credits: ' + credits)
      console.log('courseplan: ' + coursePlanItems)
      // console.log('graded: ',gradedCoursePlan )
    }
    // if (student.sbuId === 731468826) {
    //   console.log(studentCoreGpa, gpaReq.core)
    //   console.log(student.gpa, satisfiedDept, satisfiedCore, satisfiedCumul, takenCourses)
    // }
    // console.log(courseReq)
    // console.log("Grade state: ", gradeState)
    // console.log("Gpa state: " , gpaState)

    // COURSE REQUIREMENT: Create and calculate course requirements
    let coursesCount = {}
    coursePlanItems.map((course) => {
      if (coursesCount[course.courseId])
        coursesCount[course.courseId] += 1
      else
        coursesCount[course.courseId] = 1
    })
    let passedCourses = {}
    let failedCourses = {}
    for (let j = 0; j < gradedCoursePlan.length; j++) {
      let course = gradedCoursePlan[j]
      if (GRADES[course.grade] >= GRADES['C']) {
        if (passedCourses[course.courseId])
          passedCourses[course.courseId].push(course)
        else
          passedCourses[course.courseId] = [course]
      } else {
        if (failedCourses[course.courseId])
          failedCourses[course.courseId].push(course)
        else
          failedCourses[course.courseId] = [course]
      }
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
      for (let course of requirement.courses) {
        // If course was not used for another requirement and student passed the course, 
        let courseCredits = credits[course.courseId + course.semester + course.year]
        let coRepeat = (requirement.courseLower) ? (requirement.courseLower > requirement.courses.length) : false
        let crRepeat = (requirement.creditLower) ? (requirement.creditLower / courseCredits > requirement.courses.length) : false
        let multipleRepeats = coRepeat || crRepeat
        if (coursesCount[course]) {  // course plan contains the course
          let passedCourseCount = passedCourses[course]
          if (multipleRepeats) {
            repeatFlag = true
            if ((coursesCount[course] >= courseLower) || (coursesCount[course] >= creditLower / courseCredits)) { // took more than courseLower/creditLower
              // check courses taken and currently taking
              if ((passedCourseCount.length >= courseLower) || (passedCourseCount.length >= creditLower / courseCredits)) {
                courseReqState = 'satisfied'
                satisfied++
              } else {
                courseReqState = 'pending'
                pending++
              }
            } else {
              courseReqState = 'unsatisfied'
              unsatisfied++
            }
            usedCourses.add(course)
            coursesUsedForReq.push(course)
            break
          }
          else if (!usedCourses.has(course)) {  // course was not used for another requirement
            if (passedCourses[course]) {
              usedCourses.add(course)
              coursesUsedForReq.push(course)
              passedCourses[course].pop()
              if (passedCourses[course] === [])
                passedCourses.delete(course)
              courseLower -= 1
              creditLower -= courseCredits
            } else if (!failedCourses[course]) {
              usedCourses.add(course)
              coursesUsedForReq.push(course)
              courseLower -= 1
              creditLower -= courseCredits
            }
            if (courseLower <= 0 || creditLower <= 0)
              break
          }
        }
      }
      if (!repeatFlag) {
        if (courseLower === courseLowerCopy || creditLower === creditLowerCopy) {
          courseReqState = 'unsatisfied'
          unsatisfied++
        } else if (courseLower <= 0 || creditLower <= 0) {
          courseReqState = 'satisfied'
          satisfied++
        } else {
          courseReqState = 'pending'
          pending++
        }
      }
      // console.log(coursesUsedForReq)
      await updateOrCreate(student, 'Course', requirement.requirementId, courseReqState, coursesUsedForReq)
    }
    tot += 1
    await student.update({
      unsatisfied: unsatisfied,
      satisfied: satisfied,
      pending: pending,
      gpa: studentCumGpa ? studentCumGpa.toFixed(2) : 0
    })
  }
  // , studentCoreGpa.toFixed(2), studentDeptGpa.toFixed(2)]
  console.log("Done calculating " + tot + " students' course plan completion")
  res.status(200).send("Success")
}

async function updateOrCreate(student, requirementType, requirementId, state, metaData) {
  // console.log("Update/creating for "+student.sbuId+" for requirement type: ", requirementType)
  // console.log(coursesUsedForReq)
  let reqStr = ''
  switch (requirementType) {
    case 'Grade':
      reqStr = 'GR'
      break;
    case 'Gpa':
      reqStr = 'G'
      break;
    case 'Credit':
      reqStr = 'CR'
      break;
    case 'Course':
      reqStr = 'C'
      break;
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
  let condition = req.query;
  CoursePlan.findOne({ where: condition }).then(coursePlan => {
    condition = { coursePlanId: coursePlan.coursePlanId }
    CoursePlanItem.findAll({ where: condition }).then(coursePlanItems => {
      res.status(200).send(coursePlanItems)
    }).catch(err => {
      console.log(err)
    })
  })
  // CoursePlanItem
  //   .findAll({ where: { grade: { [Op.not]: req.query.grade } } })
  //   .then(foundGrades => {
  //     res.status(200).send(foundGrades)
  //   })
  //   .catch(err => {
  //     console.log(err)
  //   })
}

exports.count = (req, res) => {
  let condition = req.query;
  CoursePlanItem.findAll({ where: condition }).then(totalItems => {
    res.status(200).send(totalItems)
  }).catch(err => {
    console.log(err)
  })
}