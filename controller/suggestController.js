const { GRADES, SEMTONUM, NUMTOSEM, currSem, currYear } = require('./constants')
const { findRequirements, findCoursePlanItems, checkTimeConflict, checkPrereq } = require('./shared')
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
  let coursesSem = {}
  // credits dictionary for courses in future semester
  foundCourses.forEach(course => courses[course.courseId] = course)
  // credits dictionary for courses in previous semester
  foundCourses.forEach(course => coursesSem[course.courseId + ' ' + course.semester + ' ' + course.year] = course)
  Object.keys(courses).forEach(course => courses[course].credits = ((courses[course].minCredits <= 3
    && courses[course].maxCredits >= 3) ? 3 : courses[course].minCredits))
  Object.keys(coursesSem).forEach(course => coursesSem[course].credits = ((coursesSem[course].minCredits <= 3
    && coursesSem[course].maxCredits >= 3) ? 3 : coursesSem[course].minCredits))
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
  let courseReqs = JSON.parse(JSON.stringify(courseReq))
  const coursesRemaining = await remainingRequirements(courses, courseReqs, takenAndCurrent)
  const [creditsCounter, allUsed] = await deleteTakenCourses(courses, courseReq, takenAndCurrentCourses, takenAndCurrent, coursesSem)
  // Get credits remaining, semesters remaining, and number of courses per semester
  let [creditsRemaining, coursesPerSem] = getRemaining(creditReq, student, creditsCounter, coursesRemaining, CPS)
  console.log('Credits remaining ', creditsRemaining, 'Courses remaining: ', coursesRemaining, 'CPS:', coursesPerSem)
  // Student has no more remaining credits
  if (creditsRemaining <= 0 && coursesRemaining <= 0) {
    res.status(200).send([])
    return
  }
  // List of course plans with lowest score
  let generated = []
  let minScore = Number.MAX_SAFE_INTEGER
  let counter = 0
  while (generated.length < 5 && counter < 100) {
    const takenAndCurrent = coursePlanItems.filter(course => (
      (100 * course.year + SEMTONUM[course.semester] <= 100 * currYear + SEMTONUM[currSem]) &&
      (!course.grade || GRADES[course.grade] >= GRADES['C'])
    ))
    const takenAndCurrentCourses = new Set(takenAndCurrent.map(course => course.courseId))
    courseReqs = JSON.parse(JSON.stringify(courseReq))
    // Create course nodes
    const nodesMap = createNodes(courses, courseReqs, PREFERRED, AVOID, [creditsRemaining, coursesPerSem], [], takenAndCurrent)
    let nodes = Object.values(nodesMap)
    nodes = sortNodes(nodesMap)
    //console.log(nodes)
    let [score, suggested] = await suggestPlan(nodes, student.department, creditsRemaining, coursesPerSem, TIME, takenAndCurrentCourses, allUsed)
    if (score !== null && score < minScore) {
      generated = [suggested]
      minScore = score
    }
    else if (score != null && score === minScore)
      generated.push(suggested)
    counter++
  }
  // console.log(generated[0])
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
async function deleteTakenCourses(courses, courseReq, takenAndCurrentCourses, takenAndCurrent, coursesSem) {
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
      if (!takenAndCurrentCourses.has(course))
        notTaken.push(course)
      else if (!allUsed.has(course)) {
        // Is a repeat course 
        if (requirement.courses.length < maxCourses) {
          let timesTaken = takenAndCurrent.filter(item => item.courseId === course).length
          let courseInPlan = takenAndCurrent.filter(item => (item.courseId === course))[0]
          let courseCredit = coursesSem[courseInPlan.courseId + ' ' + courseInPlan.semester + ' ' + courseInPlan.year].credits
          // creditsCounter += courseCredit * timesTaken
          // console.log(course, creditsCounter)

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
          let courseInPlan = takenAndCurrent.filter(item => (item.courseId === course))[0]
          if (requirement.type === 0 || (requirement.courseLower !== null && requirement.courseLower > 0)
            || (requirement.creditLower !== null && requirement.creditLower > 0)) {
            creditsCounter += coursesSem[courseInPlan.courseId + ' ' + courseInPlan.semester + ' ' + courseInPlan.year].credits
            used.push(course)
          }
          if (requirement.courseLower !== null)
            requirement.courseLower -= 1
          if (requirement.creditLower !== null)
            requirement.creditLower -= coursesSem[courseInPlan.courseId + ' ' + courseInPlan.semester + ' ' + courseInPlan.year].credits
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
  creditsCounter += takenAndCurrent.reduce((a, b) => !allUsed.has(b.courseId) && (coursesSem[b.courseId + ' ' + b.semester + ' ' + b.year] ? coursesSem[b.courseId + ' ' + b.semester + ' ' + b.year].credits : 0) + a, 0)
  console.log(creditsCounter)
  nonrequired = Array.from(nonrequired).filter(item => item !== '')
  courseReq = courseReq[courseReq.length - 1].courses.concat(nonrequired)
  // console.log("nonrequired: ", nonrequired)
  return [creditsCounter, allUsed]
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
function getRemaining(creditReq, student, creditsCounter, coursesRemaining, CPS) {
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
  let coursesPerSem = CPS ? CPS : Math.max(Math.ceil(creditsRemaining / (3 * semsRemaining)), Math.ceil(coursesRemaining / semsRemaining))
  if (CPS && student.department === 'BMI')
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
      if (!courses[course] || course === 'BMI592')
        continue
      // || !courses[course]
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
          count: (req.courseLower ? req.courseLower : Math.floor(req.creditLower / courses[course].credits)) //- timesTaken
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
        if (nodes[reqNodes[i].course].required) {
          // if randomization leads back to a node that was already marked required
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
 * Traverse through all the requirements and their courses and determine the number
 * of requirements left in the degree and track.
 * @param {Map<String, Object>} courses Mapping of course ID to course object
 * @param {Array[Object]} courseReq List of remaining course requirements for degree with taken
 * courses removed
 * @param {Array[Object]} takenAndCurrent 
 * @returns the number of requirements left
 */
async function remainingRequirements(courses, courseReq, takenAndCurrent) {
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
  console.log(courseReq)
  return courseReq.reduce((a, b) => (b.courseLower ? b.courseLower : b.creditLower ? Math.ceil(b.creditLower/courses[b.courses[0]].credits) : 0) + a, 0)
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
async function suggestPlan(nodes, department, creditsRemaining, coursesPerSem, prefTimes, takenAndCurrentCourses, allUsed) {
  // Mapping of semester+year to course nodes for that semester and year
  // console.log(takenAndCurrentCourses)
  // console.log(allUsed, nodes)
  // nodes = nodes.filter(node => !allUsed.has(node.course))
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
    if (num_iterations % 80 === 0 || !currCourse || currCoursesCount >= coursesPerSem) {
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
      // console.log("Next sem. " + currSemyear + "  currCoursesCount: " + currCoursesCount)
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
          if (!inTimePreference(found[i], prefTimes))
            timeConflict = true
        }
        if (timeConflict)
          continue
        currSemOfferings[currCourse.course] = found
      }
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
      else
        continue
    }
    // Check time conflicts if course offering exists
    let currSuggestions = suggestions[currSemyear]
    let added = false
    // console.log(currCourse.course, semsOffered, currSemyear)
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
        let courseAList = currSemOfferings[currCourse.course]
        shuffle(courseAList)
        currCourse.section = courseAList[0].section
        added = true
      }
    }
    else if (offeringExists && !currSemOfferings[currCourse.course]) {
      console.log('offerings imported for ' + currSemyear + ' but not for ' + currCourse.course + ', cannot add')
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

  let score = calculateScore(suggestions)
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



function calculateScore(coursePlan) {
  return Object.keys(coursePlan)
    .map(sem => coursePlan[sem].reduce((a, b) => b.weight + a, 0))
    .reduce((a, b) => a + b, 0)
}




exports.smartSuggest = async (req, res) => {
  console.log('Smart suggest')
  const student = JSON.parse(req.query.student)
  const SBUID = student.sbuId
  const CPS = req.query.maxCourses
  const TIME = [req.query.startTime ? req.query.startTime + ':00' : '07:00:00',
  req.query.endTime ? req.query.endTime + ':00' : '23:59:00']

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
  let coursePlanItems = await findCoursePlanItems(SBUID)
  // Create the course mapping for all courses required for degree
  const reqCourses = Array.from(new Set(courseReq.reduce((a, b) => b.courses.concat(a), [])))
  const foundCourses = await Course.findAll({ where: { courseId: reqCourses } })
  let courses = {}
  let coursesSem = {}
  // credits dictionary for courses in future semester
  foundCourses.forEach(course => courses[course.courseId] = course)
  // credits dictionary for courses in previous semester
  foundCourses.forEach(course => coursesSem[course.courseId + ' ' + course.semester + ' ' + course.year] = course)
  Object.keys(courses).forEach(course => courses[course].credits = ((courses[course].minCredits <= 3
    && courses[course].maxCredits >= 3) ? 3 : courses[course].minCredits))
  Object.keys(coursesSem).forEach(course => coursesSem[course].credits = ((coursesSem[course].minCredits <= 3
    && coursesSem[course].maxCredits >= 3) ? 3 : coursesSem[course].minCredits))
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
      courses: requirement.courses.filter(course => course !== '')
    }
  ))
  let courseReqs = JSON.parse(JSON.stringify(courseReq))
  // Delete courses from requirements list that were taken
  const coursesRemaining = await remainingRequirements(courses, courseReqs, takenAndCurrent)
  const [creditsCounter, allUsed] = await deleteTakenCourses(coursesSem, courseReq, takenAndCurrentCourses, takenAndCurrent)
  // Get credits remaining, semesters remaining, and number of courses per semester
  let [creditsRemaining, coursesPerSem] = getRemaining(creditReq, student, creditsCounter, coursesRemaining, CPS)
  console.log('Credits remaining ', creditsRemaining, 'Courses remaining: ', coursesRemaining, 'CPS:', coursesPerSem)

  if (creditsRemaining <= 0 && remainingCourses <= 0) {
    res.status(200).send([])
  }
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
  //courseReqs = JSON.parse(JSON.stringify(courseReq))
  const nodesMap = createNodes(courses, courseReq, [], new Set(), [creditsRemaining, coursesPerSem], popularCourses, takenAndCurrent)
  let nodes = Object.values(nodesMap)
  nodes = sortNodes(nodes)
  let [, suggested] = await suggestPlan(nodes, student.department, creditsRemaining, coursesPerSem, TIME, takenAndCurrentCourses)
  res.status(200).send([suggested])
}