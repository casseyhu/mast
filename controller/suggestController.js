const { GRADES, SEMTONUM, NUMTOSEM, currSem, currYear, findRequirements, findCoursePlanItems, checkTimeConflict } = require('./shared')
const database = require('../config/database.js')

const Degree = database.Degree
const RequirementState = database.RequirementState
const Student = database.Student
const Course = database.Course
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem
const CourseOffering = database.CourseOffering

const rnodes = [
  {
    course: 'BMI592',
    required: true,
    credits: 1,
    weight: 1,
    prereqs: [''],
    count: 1,
    section: null
  }
]

exports.suggest = async (req, res) => {
  const student = JSON.parse(req.query.student)
  console.log('Regular suggest' + student.sbuId)
  const SBUID = student.sbuId
  const CPS = req.query.maxCourses
  const PREFERRED = req.query.preferred ? req.query.preferred : []
  const AVOID = new Set(req.query.avoid)
  const TIME = [req.query.startTime ? req.query.startTime + ':00' : '07:00:00',
  req.query.endTime ? req.query.endTime + ':00' : '23:59:00']
  console.log(TIME)
  // Find the students degree requirements
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [, , creditReq, courseReq] = await findRequirements(degree)
  // Find the students degree requirement states
  // let reqStates = await RequirementState.findAll({ where: { sbuID: SBUID } })
  // Find the students course plan items
  let coursePlanItems = await findCoursePlanItems(SBUID)
  // Create the course mapping for all courses required for degree
  const foundCourses = await Course.findAll({
    where: {
      courseId: Array.from(new Set(courseReq.reduce((a, b) => b.courses.concat(a), [])))
    }
  })
  let courses = {}
  foundCourses.forEach(course => courses[course.courseId] = course)
  Object.keys(courses).forEach(course => courses[course].credits = ((courses[course].minCredits <= 3
    && courses[course].maxCredits >= 3) ? 3 : courses[course].minCredits))
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
  // let courseReqs = JSON.parse(JSON.stringify(courseReq))
  const creditsCounter = await deleteTakenCourses(courses, courseReq, takenAndCurrentCourses, takenAndCurrent)
  // Get credits remaining, semesters remaining, and number of courses per semester
  let [creditsRemaining, coursesPerSem] = getRemaining(creditReq, student, creditsCounter, CPS)
  console.log('Credits remaining ', creditsRemaining, 'CPS:', coursesPerSem)

  // Student has no more remaining credits
  if (creditsRemaining <= 0) {
    res.status(200).send([])
    return
  }
  // List of course plans with lowest score
  let generated = []
  let minScore = Number.MAX_SAFE_INTEGER
  let counter = 0
  while (generated.length < 5 && counter < 50) {
    const takenAndCurrent = coursePlanItems.filter(course => (
      (100 * course.year + SEMTONUM[course.semester] <= 100 * currYear + SEMTONUM[currSem]) &&
      (!course.grade || GRADES[course.grade] >= GRADES['C'])
    ))
    const takenAndCurrentCourses = new Set(takenAndCurrent.map(course => course.courseId))
    let courseReqs = JSON.parse(JSON.stringify(courseReq))
    // Create course nodes
    const nodesMap = createNodes(courses, courseReqs, PREFERRED, AVOID, [creditsRemaining, coursesPerSem], [], takenAndCurrent)
    let nodes = Object.values(nodesMap)
    nodes = sortNodes(nodesMap)
    // console.log(nodes)
    let [score, suggested] = await suggestPlan(nodes, student.department, creditsRemaining, coursesPerSem, TIME, takenAndCurrentCourses)
    if (score < minScore) {
      generated = [suggested]
      minScore = score
    }
    else if (score === minScore)
      generated.push(suggested)
    counter++
  }
  console.log(generated[0])
  // console.log(generated)
  console.log('done')
  res.status(200).send(generated)
}


/**
 * 
 * @param {Map<String, Object>} courses Mapping of course ID to course object
 * @param {Array[Object]} courseReq List of remaining course requirements for degree with taken
 * courses removed
 * @param {Array[String]} takenAndCurrentCourses 
 * @returns 
 */
async function deleteTakenCourses(courses, courseReq, takenAndCurrentCourses, takenAndCurrent) {
  let creditsCounter = 0
  let nonrequired = new Set()
  let allUsed = new Set()
  // Go through list of course requirements
  for (let requirement of courseReq) {
    let notTaken = []
    let used = []
    // Go through the list of courses required for course requirement
    for (let course of requirement.courses) {
      let maxCourses = requirement.courseLower
        ? requirement.courseLower
        : (requirement.creditLower ? requirement.creditLower / courses[course].credits : 1)
      // Student did not take the course yet (or failed)
      if (!takenAndCurrentCourses.has(course)) {
        notTaken.push(course)
      } else if (!allUsed.has(course)) {
        // Is a repeat course 
        if (requirement.courses.length < maxCourses) {
          let timesTaken = takenAndCurrent.filter(item => item.courseId === course).length
          creditsCounter += courses[course].credits * timesTaken
          if (timesTaken >= maxCourses) {
            // Satisfied the amount of times they needed to take this course (BMI592)
            used.push(course)
          }
          else
            notTaken.push(course)
          break
        }
        // Student has passed / currently taking the course
        else {
          if (requirement.courseLower)
            requirement.courseLower -= 1
          if (requirement.creditLower)
            requirement.creditLower -= courses[course].credits
          // Course cannot be counted for multiple requirements
          if (requirement.type === 0 || (requirement.courseLower !== null && requirement.courseLower >= 0)
            || (requirement.creditLower !== null && requirement.creditLower >= 0)) {
            creditsCounter += courses[course].credits
            used.push(course)
          }
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
  // console.log("nonrequired: ", nonrequired)
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
  let coursesPerSem = CPS ? CPS : Math.ceil(creditsRemaining / (3 * semsRemaining))
  if (student.department === 'BMI')
    coursesPerSem--
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
function createNodes(courses, courseReq, preferred, avoid, [creditsRemaining, coursesPerSem], popularCourses, takenAndCurrent) {
  let preferenceMap = {}
  preferred.forEach((course, i) => preferenceMap[course] = preferred.length - i + 1)
  let keys = Object.keys(preferenceMap)
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
  // Go through each course requirement
  for (let req of courseReq) {
    let reqNodes = []
    let repeat = false
    // Go through each course in the requirement
    for (let course of req.courses) {
      if (nodes[course]) {
        reqNodes.push(nodes[course])
        continue
      }
      if (course === 'BMI592')
        continue
      courses[course].prereqs = courses[course].prereqs.map(prereq => prereq.replace(' ', ''))
      const weight = preferenceMap[course] ? preferenceMap[course] : (avoid.has(course) ? -1 : (popularCourses.includes(course) ? 2 : 1))
      // Repeat course multiple times
      if ((req.courseLower && req.courseLower > req.courses.length)
        || (req.creditLower && req.creditLower > req.courses.length * courses[course].credits)) {
        let timesTaken = takenAndCurrent.filter(item => item.courseId === course).length
        nodes[course] = {
          course: course,
          required: req.type !== 0,
          credits: courses[course].credits,
          weight: weight,
          prereqs: courses[course].prereqs,
          count: (req.courseLower ? req.courseLower : Math.floor(req.creditLower / courses[course].credits)) - timesTaken
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
    if (!repeat && req.type !== 0 && reqNodes.length > 0) {
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
  // Sort the required course nodes
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
  // Sort the nonrequired course nodes
  let nonrequired = nodes.filter(course => course.required === false)
  shuffle(nonrequired)
  nonrequired = nonrequired.sort((a, b) => b.weight - a.weight)
  return required.concat(nonrequired)
}


//  * @param {Number} creditsRemaining Number of credits remaining 
async function suggestPlan(nodes, department, creditsRemaining, coursesPerSem, prefTimes, takenAndCurrentCourses) {
  // Mapping of semester+year to course nodes for that semester and year
  const MAX_ITERATIONS = 1500
  let num_iterations = 0
  let suggestions = {}
  let currSemyear = currYear * 100 + SEMTONUM[currSem]
  let offeringExists = false
  if (takenAndCurrentCourses.length > 0)
    currSemyear = getNextSem(currSemyear)
  // let currSemyear = getNextSem(currYear * 100 + SEMTONUM[currSem])
  let semester = NUMTOSEM[currSemyear % 100]
  let year = Math.floor(currSemyear / 100)

  let semsOffered = {}
  let currSemOfferings = {}
  let currCoursesCount = 0
  let currTaken = []
  let index = Number.MAX_SAFE_INTEGER
  let currCourse = null
  let done = false
  while (!done) {
    // Early fail for when no course plans can be generated so no infinite loop. 
    num_iterations++
    if (num_iterations > MAX_ITERATIONS)
      return {}
    currCourse = nodes[index]
    // Check if we finished adding all required course nodes and satisfied credit requirement
    if (creditsRemaining <= 0 && (!nodes[0] || !nodes[0].required)) {
      // email student for extended grad date
      if (suggestions[currSemyear] && department === 'BMI') {
        const creditsInPlan = suggestions[currSemyear].reduce((a, b) => b.credits + a, 0)
        if (creditsInPlan >= 12)
          suggestions[currSemyear].push(rnodes[0])
      }
      break
    }
    // Check if we've added maximum courses per semester
    if (!currCourse || currCoursesCount >= coursesPerSem) {
      if (suggestions[currSemyear] && department === 'BMI') {
        const creditsInPlan = suggestions[currSemyear].reduce((a, b) => b.credits + a, 0)
        if (creditsInPlan >= 12)
          suggestions[currSemyear].push(rnodes[0])
      }
      currSemyear = getNextSem(currSemyear)
      semester = NUMTOSEM[currSemyear % 100]
      year = Math.floor(currSemyear / 100)
      const found = await CourseOffering.findOne({
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
      if (currTaken.length > 0) {
        currTaken.forEach(item => takenAndCurrentCourses.add(item))
        currTaken = []
      }
      // console.log("Next sem. " + currSemyear + "  currCoursesCount: " + currCoursesCount)
      continue
    }
    // Check if student has taken all prereqs for this course, if any before adding
    if (!checkPrereq(currCourse, takenAndCurrentCourses)) {
      index++
      continue
    }
    currCourse = { ...nodes[index], section: null }
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
          // If the course isn't in the time preference, skip it. 
          if (!inTimePreference(courseA, prefTimes)) {
            continue
          }
          for (let j = 0; j < currSuggestions.length; j++) {
            // A list of course offerings for a course plan course (may be a list of different sections)
            let courseBList = currSemOfferings[currSuggestions[j].course]
            shuffle(courseBList)
            for (let k = 0; k < courseBList.length; k++) {
              let courseB = courseBList[k]
              if (!inTimePreference(courseB, prefTimes))
                continue
              if (!checkTimeConflict(courseA, courseB, [])) {
                currCourse.section = courseA.section
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
      console.log("offerings imported but not for this course, cannot add")
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
      //console.log(currCourse)
      creditsRemaining -= currCourse.credits
      currCoursesCount += 1
      if (currCourse.count > 1) {
        nodes[index].count -= 1
        currCourse.count -= 1
        index++
      } else
        nodes.splice(index, 1)
    } else
      index++
  }

  let score = calculateScore(suggestions)
  // console.log(suggestions)
  // console.log(creditsRemaining, score)
  // console.log(coursesPerSem)
  return [score, suggestions]
}


/**
 * Checks if a course is in the user speficied time preference range.  
 * @param {Object} course Course object returned from Sequelize. 
 * @returns true if course falls in user time range, false otherwise.
 */
function inTimePreference(course, preferredTime) {
  if (course.startTime && course.endTime) {
    if (preferredTime[0] > course.startTime || course.endTime > preferredTime[1])
      return false // not in time preference range 
  }
  // If the course has no specific startTime & endTime, or course in range
  return true
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


function calculateScore(coursePlan) {
  return Object.keys(coursePlan)
    .map(sem => coursePlan[sem].reduce((a, b) => b.weight + a, 0))
    .reduce((a, b) => a + b, 0)
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
  let [, , creditReq, courseReq] = await findRequirements(degree)
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
  console.log("CrrEDits", creditsCounter)
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
  const nodesMap = createNodes(courses, courseReq, new Set(), new Set(), TIME, popularCourses, takenAndCurrent)
  let nodes = Object.values(nodesMap)
  nodes = sortNodes(nodes)
  // console.log(nodes)

  suggestPlan(nodes, student.department, creditsRemaining, coursesPerSem, takenAndCurrentCourses)
  res.status(200).send('good')
}

