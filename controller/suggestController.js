const { GRADES, SEMTONUM, NUMTOSEM, currSem, currYear } = require('./constants')
const { findRequirements, findCoursePlanItems, checkTimeConflict, checkPrereq } = require('./shared')
const database = require('../config/database.js')

const Degree = database.Degree
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
  const CPS = req.query.maxCourses
  const PREFERRED = req.query.preferred ? req.query.preferred : []
  const AVOID = new Set(req.query.avoid)
  const TIME = [req.query.startTime ? req.query.startTime + ':00' : '07:00:00',
  req.query.endTime ? req.query.endTime + ':00' : '23:59:00']
  console.log('Regular suggest for ' + student.sbuId)
  // Find the students degree requirements
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [, , creditReq, courseReq] = await findRequirements(degree)
  // Find the students course plan items
  const coursePlanItems = await findCoursePlanItems(student.sbuId)
  // Create the course mapping for all courses required for degree
  const foundCourses = await Course.findAll({
    attributes: { exclude: ['description', 'name'] },
    where: {
      courseId: Array.from(new Set(courseReq.reduce((a, b) => b.courses.concat(a), [])))
    }
  })
  foundCourses.forEach(course => course.credits = (course.minCredits <= 3 && course.maxCredits >= 3) ? 3 : course.minCredits)
  let courses = {}      // Maps course Id to course object
  let coursesSem = {}   // Maps course Id + semester + year to course object
  // Credits dictionary for courses in future semester
  foundCourses.forEach(course => courses[course.courseId] = course)
  // Credits dictionary for courses in previous semester
  foundCourses.forEach(course => coursesSem[course.courseId + ' ' + course.semester + ' ' + course.year] = course)
  // List of courses student has taken and currently taking that they didnt fail
  const takenAndCurrentOriginal = coursePlanItems.filter(course => (
    (100 * course.year + SEMTONUM[course.semester] <= 100 * currYear + SEMTONUM[currSem]) &&
    (!course.grade || GRADES[course.grade] >= GRADES['C'])
  ))
  const takenAndCurrent = JSON.parse(JSON.stringify(takenAndCurrentOriginal))
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
  let courseReqs = JSON.parse(JSON.stringify(courseReq))
  const allUsed = deleteTakenCourses(courses, courseReqs, takenAndCurrent, coursesSem)
  // Get credits remaining, semesters remaining, and number of courses per semester
  let filteredCourseReq = JSON.parse(JSON.stringify(courseReqs))
  courseReqs = JSON.parse(JSON.stringify(courseReq))
  const [coursesRemaining, creditsRemaining, coursesPerSem] = remainingRequirements(courses, courseReqs, creditReq, takenAndCurrent, student, CPS)
  console.log('Credits remaining ', creditsRemaining, 'Courses remaining: ', coursesRemaining, 'CPS:', coursesPerSem)
  // Student has no more remaining credits
  if (creditsRemaining <= 0 && coursesRemaining <= 0) {
    res.status(200).send([])
    return
  }
  // List of course plans with lowest score
  let generated = []
  let maxScore = Number.MIN_SAFE_INTEGER
  let counter = 0
  while (generated.length < 5 && counter < 50) {
    const takenAndCurrent = JSON.parse(JSON.stringify(takenAndCurrentOriginal))
    const courseReqs = JSON.parse(JSON.stringify(filteredCourseReq))
    // Create course nodes
    const createParams = {
      preferences: PREFERRED,
      avoid: AVOID
    }
    const nodesMap = createNodes(courses, courseReqs, [], takenAndCurrent, createParams)
    let nodes = sortNodes(Object.values(nodesMap))
    nodes = nodes.filter(node => !allUsed.has(node.course))
    const suggestParams = {
      department: student.department,
      creditsRemaining: creditsRemaining,
      coursesPerSem, coursesPerSem,
      timeConstraint: TIME,
      graduation: student.gradYear * 100 + SEMTONUM[student.gradSem],
      takenAndCurrentCourses: new Set(takenAndCurrent.map(course => course.courseId))
    }
    let [score, suggested] = await suggestPlan(nodes, suggestParams)
    console.log(score, maxScore)
    if (score !== null && score > maxScore) {
      generated = [suggested]
      maxScore = score
    }
    else if (score != null && score === maxScore)
      generated.push(suggested)
    counter++
  }
  // console.log(generated[0])
  console.log('done')
  res.status(200).send(generated)
}


/**
 * 
 * @param {Map<String, Object>} courses Mapping of course ID to course object
 * @param {Array[Object]} courseReq List of remaining course requirements for degree with taken
 * courses removed
 * @returns 
 */
function deleteTakenCourses(courses, courseReq, takenAndCurrent, coursesSem) {
  const takenAndCurrentCourses = new Set(takenAndCurrent.map(course => course.courseId))
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
      if (!takenAndCurrentCourses.has(course))
        notTaken.push(course)
      else if (!allUsed.has(course)) {
        // Is a repeat course 
        if (requirement.courses.length < maxCourses) {
          let timesTaken = takenAndCurrent.filter(item => item.courseId === course).length
          if (requirement.courseLower && requirement.courseUpper && requirement.courseLower > requirement.courseUpper)
            continue
          const courseInPlan = takenAndCurrent.filter(item => item.courseId === course)[0]
          const courseCredit = coursesSem[courseInPlan.courseId + ' ' + courseInPlan.semester + ' ' + courseInPlan.year].credits
          requirement.courseLower -= timesTaken
          requirement.creditLower -= courseCredit * timesTaken
          // Satisfied the amount of times they needed to take this course (BMI592)
          if (timesTaken >= maxCourses)
            used.push(course)
          else
            notTaken.push(course)
          break
        }
        // Student has passed / currently taking the course
        else {
          // Course cannot be counted for multiple requirements
          const courseInPlan = takenAndCurrent.filter(item => item.courseId === course)[0]
          const courseCredit = coursesSem[courseInPlan.courseId + ' ' + courseInPlan.semester + ' ' + courseInPlan.year] ? coursesSem[courseInPlan.courseId + ' ' + courseInPlan.semester + ' ' + courseInPlan.year].credits : courses[courseInPlan.courseId].credits
          if (requirement.type === 0 || (requirement.courseLower !== null && requirement.courseLower > 0)
            || (requirement.creditLower !== null && requirement.creditLower > 0))
            used.push(course)
          if (requirement.courseLower !== null)
            requirement.courseLower -= 1
          if (requirement.creditLower !== null)
            requirement.creditLower -= courseCredit
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
  nonrequired = Array.from(nonrequired).filter(item => item !== '')
  courseReq = courseReq[courseReq.length - 1].courses.concat(nonrequired)
  // console.log("nonrequired: ", nonrequired)
  return allUsed
}


/**
 * Traverse through all the requirements and their courses and determine the number
 * of requirements left in the degree and track.
 * @param {Map<String, Object>} courses Mapping of course ID to course object
 * @param {Array[Object]} courseReq List of remaining course requirements for degree with taken
 * courses removed
 * @param {Array[Object]} takenAndCurrent 
 * @returns the number of requirements left
 */
function remainingRequirements(courses, courseReq, creditReq, takenAndCurrent, student, CPS) {
  let timesTaken = {}
  takenAndCurrent.forEach(course => timesTaken[course.courseId] = takenAndCurrent.filter(item => item.courseId === course.courseId).length)
  for (let requirement of courseReq) {
    for (let course of requirement.courses) {
      //course does not exist in the dictionary or has satisifed amount
      if (!timesTaken[course] || timesTaken[course] <= 0)
        continue
      if (requirement.courseLower)
        requirement.courseLower--
      if (requirement.creditLower)
        requirement.creditLower -= courses[course].credits
      timesTaken[course]--
      if ((requirement.courseLower || requirement.courseLower <= 0) && (requirement.creditLower || requirement.creditLower <= 0)) {
        break
      }
    }
  }
  const creditsTaken = takenAndCurrent.reduce((a, b) => courses[b.courseId].credits + a, 0)
  const coursesRemaining = courseReq.reduce((a, b) => (b.courseLower ? b.courseLower : b.creditLower ? Math.ceil(b.creditLower / courses[b.courses[0]].credits) : 0) + a, 0)
  const creditsRemaining = (creditReq.minCredit - creditsTaken < 0) ? 0 : creditReq.minCredit - creditsTaken
  let semsRemaining = 0
  let semyear = currYear * 100 + SEMTONUM[currSem]
  let gradSemyear = Number(student.gradYear) * 100 + SEMTONUM[student.gradSem]
  while (semyear < gradSemyear) {
    semsRemaining++
    const year = (semyear % 10 === 8) ? Math.floor(semyear / 100) + 1 : Math.floor(semyear / 100)
    const sem = (semyear % 10 === 2) ? 8 : 2
    semyear = year * 100 + sem
  }
  let coursesPerSem = 0
  if (semsRemaining === 0 && !CPS)
    coursesPerSem = 5
  else
    coursesPerSem = CPS ? CPS : Math.max(Math.ceil(creditsRemaining / (3 * semsRemaining)), Math.ceil(coursesRemaining / semsRemaining))
  if (CPS && student.department === 'BMI')
    coursesPerSem--
  return [coursesRemaining, creditsRemaining, coursesPerSem]
}



/**
 * Creates all the course node objects with assigned weights.
 * @param {Map<String, Object>} courses Mapping of course ID to course object
 * @param {Array[Object]} courseReq List of remaining course requirements for degree with taken
 * courses removed
 * @param 
 * @returns The mapping of course ID to course node
 */
function createNodes(courses, courseReq, popularCourses, takenAndCurrent, params) {
  let preferenceMap = {}
  params.preferences.forEach((course, i) => preferenceMap[course] = params.preferences.length - i + 1)
  // Create mapping of course ids to weights
  for (let course of Object.keys(preferenceMap)) {
    let queue = [course]
    while (queue.length > 0) {
      let popped = queue.shift()
      if (courses[popped].prereqs[0] === '')
        continue
      for (let i = 0; i < courses[popped].prereqs.length; i++) {
        let prereq = courses[popped].prereqs[i]
        queue.push(prereq)
        preferenceMap[prereq] = preferenceMap[prereq] ? Math.max(preferenceMap[prereq], preferenceMap[popped]) * 2 : preferenceMap[popped] * 2
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
      if (nodes[course]) {  // node already created
        reqNodes.push(nodes[course])
        continue
      }
      if (!courses[course] || course === 'BMI592')
        continue
      // || !courses[course]
      courses[course].prereqs = courses[course].prereqs.map(prereq => prereq.replace(' ', ''))
      const weight = preferenceMap[course] ? preferenceMap[course] : (params.avoid.has(course) ? -1 : (popularCourses.includes(course) ? 2 : 1))
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
        if (nodes[reqNodes[i].course].required) { // if randomization leads back to a node that was already marked required
          i++
          continue
        }
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
      if (!nodesMap[popped] || popped.prereqs[0] === '')
        continue
      for (let i = 0; i < popped.prereqs.length; i++) {
        let prereq = popped.prereqs[i]
        queue.push(nodesMap[prereq])
        nodesMap[prereq].weight = Math.max(nodesMap[prereq].weight, popped.weight) * 2
      }
    }
  }
  shuffle(required)
  required = required.sort((a, b) => {
    if (b.count - a.count !== 0) {
      return b.count - a.count
    }
    return b.weight - a.weight
  })
  // Sort the nonrequired course nodes
  let nonrequired = nodes.filter(course => course.required === false)
  shuffle(nonrequired)
  nonrequired = nonrequired.sort((a, b) => b.weight - a.weight)
  return required.concat(nonrequired)
}


//  * @param {Number} creditsRemaining Number of credits remaining 
async function suggestPlan(nodes, params) {
  let { department, creditsRemaining, coursesPerSem, timeConstraint, graduation, takenAndCurrentCourses } = params
  // Mapping of semester+year to course nodes for that semester and year
  let num_iterations = 0
  let suggestions = {}
  let currSemyear = currYear * 100 + SEMTONUM[currSem]
  let offeringExists = false
  if (takenAndCurrentCourses.length > 0)
    currSemyear = getNextSem(currSemyear)
  let semester = NUMTOSEM[currSemyear % 100]
  let year = Math.floor(currSemyear / 100)

  let currSemOfferings = {}
  let currCoursesCount = 0
  let currTaken = []
  let index = Number.MAX_SAFE_INTEGER
  let currCourse = null
  while (1) {
    // Early fail for when no course plans can be generated so no infinite loop. 
    num_iterations++
    if (num_iterations > 1500)
      return [null, {}]
    currCourse = nodes[index]
    // Check if we finished adding all required course nodes and satisfied credit requirement
    if (creditsRemaining <= 0 && (!nodes[0] || !nodes[0].required)) {
      // email student for extended grad date
      if (suggestions[currSemyear] && department === 'BMI') {
        const creditsInPlan = suggestions[currSemyear].reduce((a, b) => b.credits + a, 0)
        if (creditsInPlan >= 12) {
          suggestions[currSemyear].push(rnodes[0])
          creditsRemaining -= rnodes[0].credits
        }
      }
      break
    }
    // Check if we've added maximum courses per semester
    if (!currCourse || currCoursesCount >= coursesPerSem) {
      if (suggestions[currSemyear] && department === 'BMI') {
        const creditsInPlan = suggestions[currSemyear].reduce((a, b) => b.credits + a, 0)
        if (creditsInPlan >= 12) {
          suggestions[currSemyear].push(rnodes[0])
          creditsRemaining -= rnodes[0].credits
        }
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
      // console.log("Next sem. " + currSemyear)
      continue
    }
    // Check if student has taken all prereqs for this course, if any before adding
    if (!checkPrereq(currCourse, takenAndCurrentCourses, false)) {
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
      let timeConflict = false
      if (found.length > 0) {
        for (let i = 0; i < found.length; i++) {
          if (!timeConflict && !inTimePreference(found[i], timeConstraint)) {
            timeConflict = true
          }
        }
        if (timeConflict) {
          index++
          continue
        }
        currSemOfferings[currCourse.course] = found
      }
    }
    // Check time conflicts if course offering exists
    let currSuggestions = suggestions[currSemyear]
    let added = false
    let hasTimeConflict = false
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
              if (!hasTimeConflict && !checkTimeConflict(courseA, courseBList[k], [])) {
                currCourse.section = courseA.section
                added = true
              }
              else {
                hasTimeConflict = true
                i = j = k = Number.MAX_SAFE_INTEGER
              }
            }
          }
        }
        if (!hasTimeConflict) {
          suggestions[currSemyear].push(currCourse)
        }
        else {
          index++
        }
      }
      // First course to add when course offering exists
      else {
        suggestions[currSemyear] = [currCourse]
        let courseAList = currSemOfferings[currCourse.course]
        shuffle(courseAList)
        currCourse.section = courseAList[0].section
        added = true
      }
    }
    else if (offeringExists && !currSemOfferings[currCourse.course])
      console.log('offerings imported for ' + currSemyear + ' but not for ' + currCourse.course + ', cannot add')
    else {
      if (currSuggestions)
        suggestions[currSemyear].push(currCourse)
      else
        suggestions[currSemyear] = [currCourse]
      added = true
    }
    if (added) {
      currTaken.push(currCourse.course)
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

  let score = calculateScore(suggestions, graduation)
  return [score, suggestions]
}


/**
 * Checks if a course is in the user speficied time preference range.  
 * @param {Object} course Course Offering object returned from Sequelize. 
 * @returns true if course falls in user time range, false otherwise.
 */
function inTimePreference(course, preferredTime) {
  if (course.startTime && course.endTime) {
    if (preferredTime[0] > course.endTime || preferredTime[1] < course.startTime
      || preferredTime[0] > course.startTime || preferredTime[1] < course.endTime) {
      return false // not in time preference range 
    }
  }
  // console.log(course, preferredTime)
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



function calculateScore(coursePlan, graduation) {
  return Object.keys(coursePlan)
    .map(sem => sem <= graduation ? coursePlan[sem].reduce((a, b) => b.weight + a, 0) : -10)
    .reduce((a, b) => a + b, 0)
  // return Object.keys(coursePlan)
  //   .map(sem => sem <= graduation ? coursePlan[sem].reduce((a, b) => (b.required ? b.weight : -b.weight) + a, 0) : '')
  //   .reduce((a, b) => a + b, 0)
}


exports.smartSuggest = async (req, res) => {
  const student = JSON.parse(req.query.student)
  const CPS = req.query.maxCourses
  const TIME = [req.query.startTime ? req.query.startTime + ':00' : '07:00:00',
  req.query.endTime ? req.query.endTime + ':00' : '23:59:00']
  console.log('Smart suggest for ' + student.sbuId)
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
      studentId: students.map(student => student.sbuId),
      coursePlanComplete: true
    }
  })

  // Find all course plan entries for course plans found above
  let allItems = await CoursePlanItem.findAll({
    where: {
      coursePlanId: coursePlans.map(item => item.coursePlanId)
    }
  })

  // Find the students degree requirements
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [, , creditReq, courseReq] = await findRequirements(degree)
  const coursePlanItems = await findCoursePlanItems(student.sbuId)
  // Create the course mapping for all courses required for degree
  const reqCourses = Array.from(new Set(courseReq.reduce((a, b) => b.courses.concat(a), [])))
  const foundCourses = await Course.findAll({
    attributes: { exclude: ['description', 'name'] },
    where: {
      courseId: reqCourses
    }
  })
  foundCourses.forEach(course => course.credits = (course.minCredits <= 3 && course.maxCredits >= 3) ? 3 : course.minCredits)
  let courses = {}
  let coursesSem = {}
  // Credits dictionary for courses in future semester
  foundCourses.forEach(course => courses[course.courseId] = course)
  // Credits dictionary for courses in previous semester
  foundCourses.forEach(course => coursesSem[course.courseId + ' ' + course.semester + ' ' + course.year] = course)
  // List of courses student has taken and currently taking that they didnt fail
  const takenAndCurrentOriginal = coursePlanItems.filter(course => (
    (100 * course.year + SEMTONUM[course.semester] <= 100 * currYear + SEMTONUM[currSem]) &&
    (!course.grade || GRADES[course.grade] >= GRADES['C'])
  ))
  const takenAndCurrent = JSON.parse(JSON.stringify(takenAndCurrentOriginal))
  // Local copy of all course requirements
  courseReq = courseReq.map(requirement => (
    {
      type: requirement.type,
      courseLower: requirement.courseLower,
      courseUpper: requirement.courseUpper,
      creditLower: requirement.creditLower,
      creditUpper: requirement.creditUpper,
      courses: requirement.courses.filter(course => course !== '')
    }
  ))
  // Delete courses from requirements list that were taken
  let courseReqs = JSON.parse(JSON.stringify(courseReq))
  const allUsed = deleteTakenCourses(courses, courseReqs, takenAndCurrent, coursesSem)
  // Get credits remaining, semesters remaining, and number of courses per semester
  let filteredCourseReq = JSON.parse(JSON.stringify(courseReqs))
  courseReqs = JSON.parse(JSON.stringify(courseReq))
  const [coursesRemaining, creditsRemaining, coursesPerSem] = remainingRequirements(courses, courseReqs, creditReq, takenAndCurrent, student, CPS)
  console.log('Credits remaining ', creditsRemaining, 'Courses remaining: ', coursesRemaining, 'CPS:', coursesPerSem)

  if (creditsRemaining <= 0 && coursesRemaining <= 0) {
    res.status(200).send([])
    return
  }
  /*******************************************END***********************************************/

  // Find total number of students for each course in course requirements
  let courseCount = {}
  reqCourses.map(c => courseCount[c] = allItems.filter(item => item.courseId === c).length)
  delete courseCount['']
  // Sort courses by popularity
  let popularCourses = Object.keys(courseCount).sort((c1, c2) => courseCount[c2] - courseCount[c1])

  let maxScore = Number.MIN_SAFE_INTEGER
  let generated = []
  // Create course nodes
  for (let i = 0; i < 50; i++) {
    const takenAndCurrent = JSON.parse(JSON.stringify(takenAndCurrentOriginal))
    const courseReqs = JSON.parse(JSON.stringify(filteredCourseReq))
    const createParams = {
      preferences: [],
      avoid: new Set()
    }
    const nodesMap = createNodes(courses, courseReqs, popularCourses, takenAndCurrent, createParams)
    let nodes = sortNodes(Object.values(nodesMap))
    nodes = nodes.filter(node => !allUsed.has(node.course))
    const suggestParams = {
      department: student.department,
      creditsRemaining: creditsRemaining,
      coursesPerSem, coursesPerSem,
      timeConstraint: TIME,
      graduation: student.gradYear * 100 + SEMTONUM[student.gradSem],
      takenAndCurrentCourses: new Set(takenAndCurrent.map(course => course.courseId))
    }
    let [score, suggested] = await suggestPlan(nodes, suggestParams)
    console.log(score, maxScore)
    if (score !== null && score > maxScore) {
      maxScore = score
      generated = [suggested]
    }
  }
  res.status(200).send(generated)
}