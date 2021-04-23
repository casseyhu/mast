const { GRADES, SEMTONUM, currSem, currYear, findRequirements, findCoursePlanItems } = require('./shared')
const database = require('../config/database.js')

const Degree = database.Degree
const RequirementState = database.RequirementState
const Student = database.Student
const Course = database.Course
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem


exports.suggest = async (req, res) => {
  console.log('Regular suggest')
  const student = JSON.parse(req.query.student)
  console.log(student.sbuId)
  const SBUID = student.sbuId
  const CPS = req.query.maxCourses
  // const PREFERRED = req.query.preferred
  // const AVOID = new Set(req.query.avoid)
  const PREFERRED = ['CSE526', 'CSE537']
  const AVOID = new Set(['CSE509', 'CSE610', 'CSE624'])
  const TIME = [req.query.startTime, req.query.endTime] // times to avoid??

  // Find the students degree requirements
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [gradeReq, gpaReq, creditReq, courseReq] = await findRequirements(degree)
  // Find the students degree requirement states
  let reqStates = await RequirementState.findAll({ where: { sbuID: SBUID } })
  // Find the students course plan items
  let coursePlanItems = await findCoursePlanItems(student.sbuId)
  // Create the course mapping for all courses required for degree
  const reqCourses = Array.from(new Set(courseReq.reduce((a, b) => b.courses.concat(a), [])))
  const foundCourses = await Course.findAll({ where: { courseId: reqCourses } })
  let courses = {}
  foundCourses.forEach(course => courses[course.courseId] = course)

  // List of courses student has taken and currently taking that they didnt fail
  const takenAndCurrent = coursePlanItems.filter(course => (
    (100 * course.year + SEMTONUM[course.semester] <= 100 * currYear + SEMTONUM[currSem]) &&
    (!course.grade || GRADES[course.grade] >= GRADES['C'])
  ))
  const takenAndCurrentCourses = new Set(takenAndCurrent.map(course => course.courseId))
  // Local copy of all course requirements
  courseReq = courseReq.map(requirement => (
    {
      type: requirement.type,
      courseLower: requirement.courseLower,
      courseUpper: requirement.courseUpper,
      creditLower: requirement.creditLower,
      creditUpper: requirement.creditUpper,
      courses: requirement.courses
    }
  ))

  // Delete courses from requirements list that were taken
  const creditsCounter = await deleteTakenCourses(courses, courseReq, takenAndCurrentCourses)
  // Get credits remaining, semesters remaining, and number of courses per semester
  let [creditsRemaining, coursesPerSem] = getRemaining(creditReq, student, creditsCounter, CPS)

  // Create course nodes
  const nodesMap = createNodes(courses, courseReq, PREFERRED, AVOID)
  let nodes = Object.values(nodesMap)
  nodes = sortNodes(nodes)

  suggestPlan(nodes)
  // console.log(nodes)

  res.status(200).send('good')
}


/**
 * 
 * @param {Map<String, Object>} courses Mapping of course ID to course object
 * @param {Array[Object]} courseReq List of remaining course requirements for degree with taken
 * courses removed
 * @param {Array[String]} takenAndCurrentCourses 
 * @returns 
 */
async function deleteTakenCourses(courses, courseReq, takenAndCurrentCourses) {
  let creditsCounter = 0
  let nonrequired = new Set()
  let allUsed = new Set()
  // Go through list of course requirements
  for (let requirement of courseReq) {
    let notTaken = []
    let used = []
    // Go through the list of courses required for course requirement
    for (let course of requirement.courses) {
      // Student did not take the course yet (or failed)
      if (!takenAndCurrentCourses.has(course))
        notTaken.push(course)
      // Student has passed / currently taking the course
      else {
        if (requirement.courseLower)
          requirement.courseLower -= 1
        if (requirement.creditLower)
          requirement.creditLower -= courses[course].credits
        // Course cannot be counted for multiple requirements
        if (!allUsed.has(course) && (requirement.courseLower && requirement.courseLower > 0)
          || (requirement.creditLower && requirement.creditLower > 0)) {
          creditsCounter += courses[course].credits
          used.push(course)
        }
      }
    }
    allUsed.add(used)
    if ((requirement.courseLower && requirement.courseLower <= 0)
      || (requirement.creditLower && requirement.creditLower <= 0))
      notTaken.forEach(course => nonrequired.add(course))
    else
      requirement.courses = notTaken
  }
  // Move all remaining courses into last nonrequired course requirement (0:(,):(,))
  courseReq[courseReq.length - 1].courses = Array.from(nonrequired)
  return creditsCounter
}


/**
 * Find the number of remaining credits needed for requirement and calcualte the average
 * number of course to take each semester if not supplied.
 * @param {Object} creditReq Credit requirement object
 * @param {Object} student Student to calculate for
 * @param {Number} creditsCounter Number of credits student has taken
 * @param {Number} CPS Number of courses per semester, if supplied
 * @returns An array containing the credits remaining and number of courses per semester.
 */
function getRemaining(creditReq, student, creditsCounter, CPS) {
  const creditsRemaining = (creditReq.minCredit - creditsCounter < 0) ? 0 : creditReq.minCredit - creditsCounter
  let semsRemaining = 0
  let sem = currSem
  let year = currYear
  while (sem != student.gradSem || year != student.gradYear) {
    semsRemaining++
    sem = (sem === 'Spring') ? 'Fall' : 'Spring'
    if (sem === 'Spring')
      year++
  }
  const coursesPerSem = CPS ? CPS : Math.ceil(creditsRemaining / (3 * semsRemaining))
  return [creditsRemaining, coursesPerSem]
}


/**
 * Creates all the course node objects with assigned weights.
 * @param {Map<String, Object>} courses Mapping of course ID to course object
 * @param {Array[Object]} courseReq List of remaining course requirements for degree with taken
 * courses removed
 * @param {Array[String]} PREFERRED List of courses that student prefers
 * @param {Set[String]} AVOID List of courses that student wants to avoid
 * @returns The mapping of course ID to course node
 */
function createNodes(courses, courseReq, PREFERRED, AVOID) {
  let preferenceMap = {}
  PREFERRED.forEach((course, i) => preferenceMap[course] = PREFERRED.length - i + 1)
  let keys = Object.keys(preferenceMap)
  for (let course of keys) {
    let c = course
    while (courses[c].prereqs[0] !== '') {
      let temp = courses[c].prereqs[0]
      preferenceMap[temp] = preferenceMap[c] * 2
      c = temp
    }
  }
  let nodes = {}
  for (let req of courseReq) {
    let reqNodes = []
    for (let course of req.courses) {
      if (nodes[course]) {
        reqNodes.push(nodes[course])
        continue
      }
      const weight = preferenceMap[course] ? preferenceMap[course] : (AVOID.has(course) ? -1 : 1)
      // Repeat course multiple times
      if ((req.courseLower && req.courseLower > req.courses.length)
        || (req.creditLower && req.creditLower > req.courses.length * courses[course].credits)) {
        nodes[course] = {
          course: course,
          required: false,
          credits: courses[course].credits,
          weight: weight,
          prereqs: courses[course].prereqs,
          count: req.courseLower ? req.courseLower : Math.floor(req.creditLower / courses[course].credits)
        }
        reqNodes.push(nodes[course])
        break
      }
      nodes[course] = {
        course: course,
        required: false,
        credits: courses[course].credits,
        weight: weight,
        prereqs: courses[course].prereqs,
        count: 1
      }
      reqNodes.push(nodes[course])
    }
    // If required course, sort the course list by weight and set the n highest weighted nodes as required
    if (req.type !== 0) {
      reqNodes.sort((a, b) => b.weight - a.weight)
      let i = 0
      while ((req.courseLower && req.courseLower > 0) || (req.creditLower && req.creditLower > 0)) {
        nodes[reqNodes[i].course].required = true
        req.courseLower -= 1
        req.creditLower -= nodes[reqNodes[i++].course].credits
      }
    }
  }
  return nodes
}


/**
 * First sort the required courses then sort the nonrequired courses and concatenate 
 * the two sorted lists.
 * @param {Array<Object>} nodes List of course nodes to sort
 * @returns The newly sorted array of course nodes.
 */
function sortNodes(nodes) {
  let nonrequired = nodes
    .filter(course => course.required === false)
    .sort((a, b) => b.weight - a.weight)
  let required = nodes
    .filter(course => course.required === true)
    .sort((a, b) => b.weight - a.weight)
  return required.concat(nonrequired)
}


async function suggestPlan(nodes) {

}


exports.smartSuggest = async (req, res) => {
  console.log('Smart suggest')
  // Find all students in the same dept and track
  let students = await Student.findAll({ 
    where: { 
      department: req.query.dept, 
      track: req.query.track
    } 
  })
  // Find all completed course plans for students in same dept and track
  let coursePlans = await CoursePlan.findAll({
    where: {
      studentId: students.map((student) => student.sbuId),
      coursePlanComplete: 1
    }
  })

  // Find all course plan entries for course plans found above
  let allItems = await CoursePlanItem.findAll({
    where: {
      coursePlanId: coursePlans.map((cp) => cp.coursePlanId)
    }
  })

  // Find the students degree requirements
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [gradeReq, gpaReq, creditReq, courseReq] = await findRequirements(degree)
  // Find the students degree requirement states
  let reqStates = await RequirementState.findAll({ where: { sbuID: SBUID } })
  // Find the students course plan items
  let coursePlanItems = await findCoursePlanItems(student.sbuId)
  // Create the course mapping for all courses required for degree
  const reqCourses = Array.from(new Set(courseReq.reduce((a, b) => b.courses.concat(a), [])))
  const foundCourses = await Course.findAll({ where: { courseId: reqCourses } })
  let courses = {}
  foundCourses.forEach(course => courses[course.courseId] = course)

  // List of courses student has taken and currently taking that they didnt fail
  const takenAndCurrent = coursePlanItems.filter(course => (
    (100 * course.year + SEMTONUM[course.semester] <= 100 * currYear + SEMTONUM[currSem]) &&
    (!course.grade || GRADES[course.grade] >= GRADES['C'])
  ))
  const takenAndCurrentCourses = new Set(takenAndCurrent.map(course => course.courseId))
  // Local copy of all course requirements
  courseReq = courseReq.map(requirement => (
    {
      type: requirement.type,
      courseLower: requirement.courseLower,
      courseUpper: requirement.courseUpper,
      creditLower: requirement.creditLower,
      creditUpper: requirement.creditUpper,
      courses: requirement.courses
    }
  ))

  // Delete courses from requirements list that were taken
  const creditsCounter = await deleteTakenCourses(courses, courseReq, takenAndCurrentCourses)
  // Get credits remaining, semesters remaining, and number of courses per semester
  let [creditsRemaining, coursesPerSem] = getRemaining(creditReq, student, creditsCounter, CPS)



  // Find total number of students for each course in course requirements
  let courseCount = {}
  req.query.courses.map((c) => 
    courseCount[c] = allItems.filter((item) => item.courseId === c).length
  )
  delete courseCount['']

  // Sort courses by popularity
  let popularCourses = Object.keys(courseCount).sort((c1, c2) => courseCount[c2] - courseCounts[c1])

    

  res.status(200).send('good')
}

