const database = require('../config/database.js');
const Op = database.Sequelize.Op;




// const degreecontrollerpi = require('./degreeController.js')

// degreecontrollerapi.findrequirements()

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
  let students = await Student.findAll({ where: { department: dept }})
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
  await calculateGPA(studentsPlanId, courseCredit, res)
  await calculateCompletion(studentsPlanId, res)
}


// Calculate and update the GPA for each student that was imported
async function calculateGPA(studentsPlanId, courseCredit, res) {
  let gradesPoint = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'F': 0 }
  for (let key in studentsPlanId) {
    let condition = { coursePlanId: studentsPlanId[key] }
    let items = await CoursePlanItem.findAll({ where: condition })
    if (items) {
      const foundItems = items.filter(item => (item.grade !== null))
      let earnedPoints = 0
      let totPoints = 0
      for (let i = 0; i < foundItems.length; i++) {
        if (!courseCredit[foundItems[i].courseId] || !gradesPoint[foundItems[i].grade])
          continue
        earnedPoints += gradesPoint[foundItems[i].grade] * courseCredit[foundItems[i].courseId]
        totPoints += courseCredit[foundItems[i].courseId]
      }
      let GPA = (earnedPoints / totPoints)
      if (key && !isNaN(GPA)) {
        GPA = GPA.toFixed(2)
        await Student.update({ gpa: GPA }, { where: { sbuId: key } })
      }
    }
    else
      console.log("error getting course plan items")
  }
  console.log("Done calculating GPAs")
  // res.status(200).send("Success")
}


async function calculateCompletion(studentsPlanId, res) {
  console.log("Calculating student CoursePlan completion...")
  let tot = 0
  for(let key in studentsPlanId) {
    let student = await Student.findOne({ where: { sbuId:key }})
    let creditState = 'unsatisfied'
    let gpaState = 'unsatisfied'
    let gradeState = 'unsatisfied'
    let courseState = 'unsatisfied'
    // For each students, look at their degree+track+reqVersion.
    // Get all the requirements to this student's specific Degree.
    let degree = await Degree.findOne({ where: { degreeId: student.degreeId }})
    let creditReq = await CreditRequirement.findOne({ where: { requirementId: degree.creditRequirement }})
    let gpaReq = await GpaRequirement.findOne({ where: { requirementId: degree.gpaRequirement }})
    let gradeReq = await GradeRequirement.findOne({ where: { requirementId: degree.gradeRequirement }})
    // List of all the course requirements for this degree
    let courseReq = await CourseRequirement.findAll({ where: { requirementId: degree.courseRequirement }})

    // Get this student's coursePlan to see what courses they've taken/currently taken/are going to take.
    // let coursePlan = await CoursePlan.findOne({ where: { studentId: student.sbuId }})
    let coursePlanItems = await CoursePlanItem.findAll({ where: { coursePlanId: studentsPlanId[key] }})
  
    // -----------------  Check credit requirement -----------------
    let totalCredits = 0
    let credits = {}
    for(let j = 0; j < coursePlanItems.length; j++) {
      // Add up all course credits they have in their current course plan.
      let course = await Course.findOne({ where: { courseId: coursePlanItems[j].courseId }})
      if (course && course.credits) {
        credits[course.courseId] = course.credits;
        totalCredits += course.credits
      }
      // totalCredits += course.credits
    } 
    if(totalCredits >= creditReq.minCredit) 
      creditState = 'satisfied'
    else
      creditState = 'unsatisfied'
    
    // console.log("Credit state: ", creditState)

    // -----------  Check gpaReqs (coreGpa, cumulGpa, deptGpa) ------------
    const GRADES = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'C-': 1.67, 'F': 0 }
    // Calculate student's achieved departmental gpa
    var deptCourses = coursePlanItems.filter((course) => (
      course.courseId.slice(0, 3) === student.department
    ));
    var deptTotalPoints = 0;
    var deptTotalCredits = 0;
    for (var deptCourse of deptCourses) {
      for (const [course, credit] of Object.entries(credits)) {
        if (course === deptCourse.courseId) {
          deptTotalCredits += credit
          deptTotalPoints += credit * GRADES[deptCourse.grade]
        }
      }
    } 
    let studentDeptGpa = deptTotalPoints/deptTotalCredits

    // console.log("Student dept gpa: ", studentDeptGpa)

    // Calculate student's achieved core gpa
    var coreReqs = courseReq.filter((req) => {
      req.type === 1
    })
    var coreCourses = [];
    for (var req of coreReqs) {
      for (var course of req.courses) {
        coreCourses.push(course);
      }
    }
    var takenCourses = coursePlanItems.filter((course) => (
      coreCourses.includes(course.courseId)
    ));
    var coreTotalPoints = 0;
    var coreTotalCredits = 0;
    for (var takenCourse of takenCourses) {
      for (const [course, credit] of Object.entries(credits)) {
        if (course === takenCourse.courseId) {
          coreTotalCredits += credit
          coreTotalPoints += credit * GRADES[takenCourse.grade]
        }
      }
    }
    let studentCoreGpa = coreTotalPoints/coreTotalCredits

    // console.log("Student core gpa: ", studentCoreGpa)

    // Set the state of the GPA requirement. 
    let satisfiedDept  = gpaReq.department ? studentDeptGpa >= gpaReq.department : true
    let satisfiedCore  = gpaReq.core ? studentCoreGpa >= gpaReq.core : true
    let satisfiedCumul =  gpaReq.cumulative ? student.gpa >= gpaReq.cumulative: true
    gpaState = (satisfiedDept && satisfiedCore && satisfiedCumul) ? 'satisfied' : 'unsatisfied'
    
    // ------------------- Check student's GradeRequirement ------------------
    const courses = coursePlanItems.filter((course) => GRADES[course.grade] >= gradeReq.minGrade);
    var sum = courses.reduce((a, b) => a + credits[b.courseId], 0);
    gradeState = (sum >= gradeReq.atLeastCredits) ?  'satisfied' : 'unsatisfied'

    // console.log("Grade state: ", gradeState)
    // console.log("Gpa state: " , gpaState)

    // Update or create the Grade, GPA, and CreditRequirements
    await updateOrCreate(student, 'Grade', gradeReq.requirementId, gradeState)
    await updateOrCreate(student, 'Gpa', gpaReq.requirementId, gpaState)
    await updateOrCreate(student, 'Credit', creditReq.requirementId, creditState)

    // ------------------ Check the CourseRequirements ---------------------------

    // Create a dictionary of courseId to number of times it occurs in the CoursePlan
    // (i.e) {  'AMS501' : 2 } --> Course AMS501 occured 2 times in this student's CoursePlan.
    let coursePlanItemMap = {}
    coursePlanItems.map((course) => {
      if(coursePlanItemMap[course.courseId] !== undefined) 
        coursePlanItemMap[course.courseId] += 1
      else
        coursePlanItemMap[course.courseId] = 1
    })

    for(let courseRequirement of courseReq) {
      if(courseRequirement.type === 0) // Not required for the degree (electives)
        continue
      let courseLower = (courseRequirement.courseLower) ? courseRequirement.courseLower : 0
      let creditLower = (courseRequirement.creditLower) ? courseRequirement.creditLower : 0
      for(let course of courseRequirement.courses){
        // course = "AMS527", for example. 
        if(coursePlanItemMap[course] !== undefined) {
          courseLower -= coursePlanItemMap[course]
          creditLower -= credits[course] * coursePlanItemMap[course]
        }
      }

      // console.log(coursePlanItemMap)
      // res.status(200).send("s")

      if(courseLower <= 0)
        await updateOrCreate(student, 'Course', courseRequirement.requirementId, 'satisfied')
      else
        await updateOrCreate(student, 'Course', courseRequirement.requirementId, 'unsatisfied')
    }
    tot += 1
  }
  console.log("Done calculating "+tot+" students' course plan completion")
  res.status(200).send("Success")
}

async function updateOrCreate(student, requirementType, requirementId, state) {
  // console.log("Update/creating for "+student.sbuId+" for requirement type: ", requirementType)
  let reqStr = ''
  switch(requirementType) {
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
  // console.log(reqStr)
  
  let found = await RequirementState.findOne({
    where: {
      sbuID: student.sbuId,
      requirementId: reqStr + requirementId
    }
  })

  // console.log("here: ", found)
  if(found) {
    await found.update({
      state: state
    })
  } else {
    // console.log("here")
    // console.log(typeof(student.sbuId))
    await RequirementState.create({
      sbuID: student.sbuId,
      requirementId: reqStr + requirementId,
      state: state
    })
  } 
}


/* 
  Course Plan Items
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