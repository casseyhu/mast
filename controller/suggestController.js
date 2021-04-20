const shared = require('./shared')
const database = require('../config/database.js')

const Student = database.Student
const Degree = database.Degree
const RequirementState = database.RequirementState

const Course = database.Course

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


exports.suggest = async (req, res) => {
  console.log('Regular suggest')
  const SBUID = 146537373
  const CPS = null
  const PREFFERED = []
  const AVOID = []
  const TIME = [] // times to avoid??

  // Find the students degree requirements
  const student = await Student.findOne({ where: { sbuId: SBUID } })
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [gradeReq, gpaReq, creditReq, courseReq] = await shared.findRequirements(degree)
  // Find the students degree requirement states
  let reqStates = await RequirementState.findAll({ where: { sbuID: SBUID } })
  // Find the students course plan items
  let coursePlanItems = await shared.findCoursePlanItems(student.sbuId)
  // Create the credits mapping for all courses required for degree
  const reqCourses = Array.from(new Set(courseReq.reduce((a, b) => b.courses.concat(a), [])))
  const courses = await Course.findAll({ where: { courseId: reqCourses } })
  let credits = {}
  courses.forEach(course => credits[course.courseId] = course.credits)
  let prereqs = {}
  courses.forEach(course => prereqs[course.courseId] = course.prereqs)

  // List of courses student has taken and currently taking that they didnt fail
  const takenAndCurrent = coursePlanItems.filter(course => (
    (100 * course.year + semDict[course.semester] <= 100 * currYear + semDict[currSem]) &&
    (!course.grade || GRADES[course.grade] >= GRADES['C'])
  ))
  const takenAndCurrentCourses = new Set(takenAndCurrent.map(course => course.courseId))

  let courseReqs = courseReq.map(requirement => (
    {
      type: requirement.type,
      courseLower: requirement.courseLower,
      courseUpper: requirement.courseUpper,
      creditLower: requirement.creditLower,
      creditUpper: requirement.creditUpper,
      courses: requirement.courses
    }
  ))

  let creditsCounter = 0

  let remainingCourses = new Set()
  // Go through list of course requirements and update values
  for (let requirement of courseReqs) {
    let notTaken = []
    for (let course of requirement.courses) {
      // Check if student has taken or currently taking the course
      if (!takenAndCurrentCourses.has(course))
        notTaken.push(course)
      // Student has taken / currently taking the course
      else {
        // Decrement lower limits
        if (requirement.courseLower)
          requirement.courseLower -= 1
        if (requirement.creditLower)
          requirement.creditLower -= credits[course]
        creditsCounter += credits[course]
      }
    }
    if ((requirement.courseLower && requirement.courseLower <= 0)
      || (requirement.creditLower && requirement.creditLower <= 0))
      notTaken.forEach(course => remainingCourses.add(course))
    else
      requirement.courses = notTaken
  }
  // Move all remaining courses into last nonrequired course requirement (0:(,):(,))
  courseReqs[courseReqs.length - 1].courses = Array.from(remainingCourses)

  // Get credits remaining, semesters remaining, and number of courses per semester
  let creditsRemaining = (creditReq.minCredit - creditsCounter < 0) ? 0 : creditReq.minCredit - creditsCounter
  let semsRemaining = 0
  let sem = currSem
  let year = currYear
  while (sem != student.gradSem || year != student.gradYear) {
    semsRemaining++
    sem = (sem === 'Spring') ? 'Fall' : 'Spring'
    if (sem === 'Spring')
      year++
  }
  let coursesPerSem = CPS ? CPS : Math.ceil(creditsRemaining / (3 * semsRemaining))

  let nodes = createNodes(courseReqs, credits, prereqs)
  console.log(nodes)
  // console.log(coursesPerSem)
  // console.log(semsRemaining)
  // console.log(creditsCounter)

  res.status(200).send('good')
}


function createNodes(courseReqs, credits, prereqs) {
  // Create course nodes
  let nodes = {}
  for (let requirement of courseReqs) {
    for (let course of requirement.courses) {
      if (nodes[course])
        continue
      // Repeat course multiple times
      if ((requirement.courseLower && requirement.courseLower > requirement.courses.length)
        || (requirement.creditLower && requirement.creditLower > requirement.courses.length * credits[course])) {
        nodes[course] = {
          course: course,
          required: requirement.type !== 0,
          credits: credits[course],
          weight: 1,
          prereqs: prereqs[course],
          count: requirement.courseLower ? requirement.courseLower : Math.floor(requirement.creditLower / credits[course])
        }
        break
      }
      nodes[course] = {
        course: course,
        required: requirement.type !== 0,
        credits: credits[course],
        weight: 1,
        prereqs: prereqs[course],
        count: 1
      }
    }
  }
  return nodes
}




exports.smartSuggest = (req, res) => {
  console.log('Smart suggest')
  res.status(200).send('good')
}

