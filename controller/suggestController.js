const { GRADES, SEMTONUM, NUMTOSEM, currSem, currYear, findRequirements, findCoursePlanItems, checkTimeConflict } = require('./shared')
const database = require('../config/database.js')
const student = require('../models/student')

const Degree = database.Degree
const RequirementState = database.RequirementState
const Student = database.Student
const Course = database.Course
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem
const CourseOffering = database.CourseOffering


exports.suggest = async (req, res) => {
  console.log('Regular suggest')
  const student = JSON.parse(req.query.student)
  console.log(student.sbuId)
  const SBUID = student.sbuId
  const CPS = req.query.maxCourses
  const PREFERRED = req.query.preferred ? req.query.preferred : []
  const AVOID = new Set(req.query.avoid)
  // const PREFERRED = ['CSE526', 'CSE537']
  // const AVOID = new Set(['CSE509', 'CSE610', 'CSE624'])
  const TIME = [req.query.startTime, req.query.endTime] // 
  console.log(TIME)
  // Find the students degree requirements
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [, , creditReq, courseReq] = await findRequirements(degree)
  // // Find the students degree requirement states
  // let reqStates = await RequirementState.findAll({ where: { sbuID: SBUID } })
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
  let [creditsRemaining, coursesPerSem] = getRemaining(creditReq, student.gradSem, student.gradYear, creditsCounter, CPS)

  // Create course nodes
  const nodesMap = createNodes(courses, courseReq, PREFERRED, AVOID, TIME, [])
  let nodes = Object.values(nodesMap)
  nodes = sortNodes(nodesMap)
  // console.log(nodes)
  suggestPlan(nodes, student.department, creditsRemaining, coursesPerSem, takenAndCurrentCourses)

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
      if (!takenAndCurrentCourses.has(course)) {
        notTaken.push(course)
      }
      // Student has passed / currently taking the course
      else {
        if (requirement.courseLower)
          requirement.courseLower -= 1
        if (requirement.creditLower)
          requirement.creditLower -= courses[course].credits
        // Course cannot be counted for multiple requirements
        if (!allUsed.has(course) && (requirement.courseLower !== null && requirement.courseLower >= 0)
          || (requirement.creditLower && requirement.creditLower > 0)) {
          creditsCounter += courses[course].credits
          used.push(course)
        }
      }
    }
    used.forEach(course => allUsed.add(course))
    if ((requirement.courseLower !== null && requirement.courseLower <= 0)
      || (requirement.creditLower !== null && requirement.creditLower <= 0))
      notTaken.forEach(course => nonrequired.add(course))
    else
      requirement.courses = notTaken
  }
  // Move all remaining courses into last nonrequired course requirement (0:(,):(,))
  nonrequired = Array.from(nonrequired).filter(item => item !== '')
  courseReq[courseReq.length - 1].courses = nonrequired
  console.log("nonrequired: ", nonrequired)
  return creditsCounter
}


/**
 * Find the number of remaining credits needed for requirement and calculate the average
 * number of course to take each semester if not supplied.
 * @param {Object} creditReq Credit requirement object
 * @param {String} gradSem Graduation semester to calculate up to
 * @param {Number} gradYear Graduation year to calculate up to
 * @param {Number} creditsCounter Number of credits student has taken
 * @param {Number} CPS Number of courses per semester, if supplied
 * @returns An array containing the credits remaining and number of courses per semester.
 */
function getRemaining(creditReq, gradSem, gradYear, creditsCounter, CPS) {
  const creditsRemaining = (creditReq.minCredit - creditsCounter < 0) ? 0 : creditReq.minCredit - creditsCounter
  let semsRemaining = 0
  let sem = currSem
  let year = currYear
  while (sem != gradSem || year != gradYear) {
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
 * @param {Array[String]} preferred List of courses that student prefers
 * @param {Set[String]} avoid List of courses that student wants to avoid
 * @returns The mapping of course ID to course node
 */
function createNodes(courses, courseReq, preferred, avoid, popularCourses) {
  let preferenceMap = {}
  preferred.forEach((course, i) => preferenceMap[course] = preferred.length - i + 1)
  let keys = Object.keys(preferenceMap)
  console.log(keys)
  for (let course of keys) {
    let queue = [course]
    while (queue.length > 0) {
      let popped = queue.shift()
      if (courses[popped].prereqs[0] === '')
        continue
      for (let i = 0; i < courses[popped].prereqs.length; i++) {
        let prereq = courses[popped].prereqs[i]
        queue.push(prereq)
        if (preferenceMap[prereq])
          preferenceMap[prereq] = Math.max(preferenceMap[prereq], preferenceMap[popped]) * 2
        else
          preferenceMap[prereq] = preferenceMap[popped] * 2
      }
    }
  }
  let nodes = {}
  for (let req of courseReq) {
    let reqNodes = []
    let repeat = false
    for (let course of req.courses) {
      if (nodes[course]) {
        reqNodes.push(nodes[course])
        continue
      }
      const weight = preferenceMap[course] ? preferenceMap[course] : (avoid.has(course) ? -1 : (popularCourses.includes(course) ? 2 : 1))
      // Repeat course multiple times
      if ((req.courseLower && req.courseLower > req.courses.length)
        || (req.creditLower && req.creditLower > req.courses.length * courses[course].credits)) {
        nodes[course] = {
          course: course,
          required: req.type !== 0,
          credits: courses[course].credits,
          weight: weight,
          prereqs: courses[course].prereqs,
          count: req.courseLower ? req.courseLower : Math.floor(req.creditLower / courses[course].credits)
        }
        reqNodes.push(nodes[course])
        repeat = true
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
    // If it is a required requirement, sort the course list by weight and set the n highest weighted nodes as required
    if (!repeat && req.type !== 0) {
      shuffle(reqNodes)
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
 * @param {Map<String, Object>} nodesMap Mapping of course ID to course nodes
 * @returns The newly sorted array of course nodes.
 */
function sortNodes(nodesMap) {
  let nodes = Object.values(nodesMap)
  let required = nodes.filter(course => course.required === true)
  for (let course of required) {
    let queue = [course]
    while (queue.length > 0) {
      let popped = queue.shift()
      if (popped.prereqs[0] === '')
        continue
      for (let i = 0; i < popped.prereqs.length; i++) {
        let prereq = popped.prereqs[i]
        queue.push(nodesMap[prereq])
        nodesMap[prereq].weight = Math.max(nodesMap[prereq].weight, popped.weight) * 2
      }
    }
  }
  shuffle(required)
  required = required.sort((a, b) => b.weight - a.weight)

  let nonrequired = nodes.filter(course => course.required === false)
  shuffle(nonrequired)
  nonrequired = nonrequired.sort((a, b) => b.weight - a.weight)
  return required.concat(nonrequired)
}


//  * @param {Number} creditsRemaining Number of credits remaining 
async function suggestPlan(nodes, department, creditsRemaining, coursesPerSem, takenAndCurrentCourses) {
  // Mapping of semester+year to course nodes for that semester and year
  let suggestions = {}
  let offeringExists = false
  let currSemyear = getNextSem(currYear * 100 + SEMTONUM[currSem])
  let semester = NUMTOSEM[currSemyear % 100]
  let year = Math.floor(currSemyear / 100)
  let found = await CourseOffering.findOne({
    where: {
      identifier: {
        [database.Sequelize.Op.like]: department + '%',
      },
      semester: semester,
      year: year
    }
  })
  offeringExists = false
  if (found)
    offeringExists = true

  let semsOffered = {}
  let currSemOfferings = {}
  let currCoursesCount = 0
  let currTaken = []
  let index = 0
  let currCourse = null
  let done = false
  while (!done) {
    currCourse = nodes[index]
    // Check if we finished adding all required course nodes and satisfied credit requirement
    if (creditsRemaining <= 0 && !nodes[0].required) {
      // email student for extended grad date
      break
    }
    // Check if we've added maximum courses per semester
    if (!currCourse || currCoursesCount >= coursesPerSem) {
      currSemyear = getNextSem(currSemyear)
      semester = NUMTOSEM[currSemyear % 100]
      year = Math.floor(currSemyear / 100)
      let found = await CourseOffering.findOne({
        where: {
          identifier: {
            [database.Sequelize.Op.like]: department + '%',
          },
          semester: semester,
          year: year
        }
      })
      offeringExists = false
      if (found)
        offeringExists = true
      currSemOfferings = {}
      currCoursesCount = 0
      index = 0
      currTaken.forEach(item => takenAndCurrentCourses.add(item))
      currTaken = []
      // console.log("Next sem. " + currSemyear + "  currCoursesCount: " + currCoursesCount)
      continue
    }
    // Check if student has taken all prereqs for this course, if any before adding
    if (!checkPrereq(currCourse, takenAndCurrentCourses)) {
      index++
      continue
    }
    // Get all the course offerings for currCourse (multiple sections)
    if (offeringExists && !currSemOfferings[currCourse.course]) {
      let found = await CourseOffering.findAll({
        where: {
          identifier: currCourse.course,
          semester: semester,
          year: year
        }
      })
      if (found.length > 0)
        currSemOfferings[currCourse.course] = found
    }
    // Get the list of semesters that the course is offered in (using current semester year data)
    if (!semsOffered[currCourse.course]) {
      let found = await Course.findOne({
        where: {
          courseId: currCourse.course,
          semester: currSem,
          year: currYear
        }
      })
      if (found)
        semsOffered[currCourse.course] = found.semestersOffered
    }
    // Check time conflicts if course offering exists
    let currSuggestions = suggestions[currSemyear]
    let added = false
    if (offeringExists && currSemOfferings[currCourse.course]) {
      if (currSuggestions) {
        // A list of course offerings for currCourse (may be a list of different sections)
        let courseAList = currSemOfferings[currCourse.course]
        shuffle(courseAList)
        for (let i = 0; i < courseAList.length; i++) {
          let courseA = courseAList[i]
          for (let j = 0; j < currSuggestions.length; j++) {
            // A list of course offerings for a course plan course (may be a list of different sections)
            let courseBList = currSemOfferings[currSuggestions[j].course]
            shuffle(courseBList)
            for (let k = 0; k < courseBList.length; k++) {
              let courseB = courseBList[k]
              if (!checkTimeConflict(courseA, courseB, [])) {
                suggestions[currSemyear].push(currCourse)
                added = true
                i = j = k = Number.MAX_SAFE_INTEGER
              }
            }
          }
        }
      }
      // First course to add when course offering exists
      else {
        suggestions[currSemyear] = [currCourse]
        added = true
      }
    }
    else if (offeringExists && !currSemOfferings[currCourse.course]) {
      // console.log("offerings imported but not for this course, cannot add")
    }
    // Course offering for currSemyear doesnt exist yet
    else if (semsOffered[currCourse.course].includes(semester)) {
      if (currSuggestions)
        suggestions[currSemyear].push(currCourse)
      else
        suggestions[currSemyear] = [currCourse]
      added = true
    }
    if (added) {
      // console.log("added " + currCourse.course)
      currTaken.push(currCourse.course)
      creditsRemaining -= currCourse.credits
      currCoursesCount += 1
      nodes.splice(index, 1)
    } else
      index++
  }
  console.log(suggestions)
  console.log(creditsRemaining)
  console.log(coursesPerSem)
}


/**
 * Returns the next semester and year after a given semester and year.
 * @param {Number} currSem Current semester and year
 * @returns The next semester and year number.
 */
function getNextSem(currSem) {
  if (currSem % 100 === 2)
    return currSem + 6
  else
    return (Math.floor(currSem / 100) + 1) * 100 + 2
}


/**
 * Randomly shuffles an array of objects in place.
 * @param {Array[Object]} array An array of objects to shuffle
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}


/**
 * Determines if the student has taken the pre-requisites for a course.
 * @param {Object} courseA A course node object
 * @param {Array[String]} takenAndCurrentCourses List of courses that the student has taken
 * and currently taking
 * @returns Boolean value indicating whether they have taken/currently taking pre-requisites
 * for the course.
 */
function checkPrereq(courseA, takenAndCurrentCourses) {
  let prereqs = courseA.prereqs
  if (prereqs[0] === '')
    return true
  for (let l = 0; l < prereqs.length; l++) {
    if (!takenAndCurrentCourses.has(prereqs[l]))
      return false
  }
  return true
}







exports.smartSuggest = async (req, res) => {
  console.log('Smart suggest')
  const student = JSON.parse(req.query.student)
  const CPS = req.query.maxCourses
  const TIME = [req.query.startTime, req.query.endTime] // times to avoid??
  // Find all students in the same dept and track
  let students = await Student.findAll({ 
    where: { 
      department: student.department, 
      track: student.track
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

  /******************************COPIED FROM SET UP CODE IN SUGGEST******************************
  *******************************************START**********************************************/
  // Find the students degree requirements
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [gradeReq, gpaReq, creditReq, courseReq] = await findRequirements(degree)
  // Find the students degree requirement states
  let reqStates = await RequirementState.findAll({ where: { sbuID: student.sbuId } })
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
  console.log("CrrEDits",creditsCounter)
  let gradSem = student.gradSem
  let gradYear = student.gradYear
  // Get credits remaining, semesters remaining, and number of courses per semester
  let [creditsRemaining, coursesPerSem] = getRemaining(creditReq, gradSem, gradYear, creditsCounter, CPS)
  /*******************************************END***********************************************/

  // Find total number of students for each course in course requirements
  let courseCount = {}
  reqCourses.map((c) =>
    courseCount[c] = allItems.filter((item) => item.courseId === c).length
  )
  delete courseCount['']
  // Sort courses by popularity
  let popularCourses = Object.keys(courseCount).sort((c1, c2) => courseCount[c2] - courseCount[c1])
  // Create course nodes

  const nodesMap = createNodes(courses, courseReq, new Set(), new Set(), popularCourses)
  let nodes = Object.values(nodesMap)
  nodes = sortNodes(nodes)
  // console.log(nodes)

  suggestPlan(nodes, student.department, creditsRemaining, coursesPerSem, takenAndCurrentCourses)
  res.status(200).send('good')
}

