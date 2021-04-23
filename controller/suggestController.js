const { GRADES, SEMTONUM, NUMTOSEM, currSem, currYear, findRequirements, findCoursePlanItems, checkTimeConflict } = require('./shared')
const database = require('../config/database.js')

const Degree = database.Degree
const RequirementState = database.RequirementState

const Course = database.Course
const CourseOffering = database.CourseOffering


exports.suggest = async (req, res) => {
  console.log('Regular suggest')
  const student = JSON.parse(req.query.student)
  console.log(student.sbuId)
  const SBUID = student.sbuId
  const CPS = req.query.maxCourses
  const PREFERRED = req.query.preferred
  const AVOID = new Set(req.query.avoid)
  // const PREFERRED = ['CSE526', 'CSE537']
  // const AVOID = new Set(['CSE509', 'CSE610', 'CSE624'])
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
  console.log("max courses:" + CPS)
  // Delete courses from requirements list that were taken
  const creditsCounter = await deleteTakenCourses(courses, courseReq, takenAndCurrentCourses)
  // Get credits remaining, semesters remaining, and number of courses per semester
  let [creditsRemaining, coursesPerSem] = getRemaining(creditReq, student, creditsCounter, CPS)

  // Create course nodes
  const nodesMap = createNodes(courses, courseReq, PREFERRED, AVOID)
  let nodes = Object.values(nodesMap)
  nodes = sortNodes(nodes)

  suggestPlan(nodes, student.department, creditsRemaining, coursesPerSem, takenAndCurrentCourses)
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


//  * @param {Number} creditsRemaining Number of credits remaining 
async function suggestPlan(nodes, department, creditsRemaining, coursesPerSem, takenAndCurrentCourses) {
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
  if (found)
    offeringExists = true

  let semsOffered = {}
  let currSemOfferings = {}
  let currCoursesCount = 0
  let currTaken = []
  let done = false
  let index = 0
  let currCourse = nodes[index]
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
      found = await CourseOffering.findOne({
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
      currCoursesCount = 0
      index = 0
      currSemOfferings = {}
      currTaken.forEach(item => takenAndCurrentCourses.add(item))
      currTaken = []
      continue
    }

    if (!currSemOfferings[currCourse.course]) {
      let found = await CourseOffering.findAll({
        where: {
          identifier: currCourse.course,
          semester: semester,
          year: year
        }
      })
      if (found)
        currSemOfferings[currCourse.course] = found
    }
    if (!semsOffered[currCourse.course]) {
      let found = await Course.findOne({
        where: {
          courseId: currCourse.course,
          // semester: semester,
          // year: year
        }
      })
      if (found)
        semsOffered[currCourse.course] = found.semestersOffered
    }
    // Check time conflicts and prereqs if course offering exists
    let currSuggestions = suggestions[currSemyear]
    let added = false
    if (currSemOfferings[currCourse.course] && offeringExists && currSuggestions) {
      // A list of course offerings for currCourse
      let courseAList = currSemOfferings[currCourse.course]
      shuffle(courseAList)
      for (let i = 0; i < courseAList.length; i++) {
        let courseA = courseAList[i]
        for (let j = 0; j < currSuggestions.length; j++) {
          let courseBList = currSemOfferings[currSuggestions[j].course]
          shuffle(courseBList)
          for (let k = 0; k < courseBList.length; k++) {
            let courseB = courseBList[k]
            if (!checkTimeConflict(courseA, courseB, []) && checkPrereq(currCourse, takenAndCurrentCourses)) {
              console.log("added " + currCourse.course)
              suggestions[currSemyear].push(currCourse)
              added = true
              i = j = k = Number.MAX_SAFE_INTEGER
            }
          }
        }
      }
    }
    // First course to add
    else if (currSemOfferings[currCourse.course] && offeringExists && !currSuggestions) {
      if (checkPrereq(currCourse, takenAndCurrentCourses)) {
        suggestions[currSemyear] = [currCourse]
        added = true
      }
    }
    // Course offering for currSemyear doesnt exist yet
    else {
      if (semsOffered[currCourse.course].includes(semester)) {
        if (checkPrereq(currCourse, takenAndCurrentCourses)) {
          if (currSuggestions)
            suggestions[currSemyear].push(currCourse)
          else
            suggestions[currSemyear] = [currCourse]
          added = true
        }
      }
    }
    if (added) {
      // takenAndCurrentCourses.add(currCourse.course)
      currTaken.push(currCourse.course)
      creditsRemaining -= currCourse.credits
      currCoursesCount += 1
      nodes.splice(index, 1)
    } else
      index++
  }
  console.log(suggestions)

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


function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function checkPrereq(courseA, takenAndCurrentCourses) {
  let prereqs = courseA.prereqs
  let passedPrereqs = true
  // if (courseA.course === 'CSE507')
  //   console.log(prereqs)
  if (prereqs[0] === '')
    return true
  for (let l = 0; l < prereqs.length; l++) {
    if (!takenAndCurrentCourses.has(prereqs[l])) {
      return false
    }
  }
  if (passedPrereqs)
    return true
  return false
}


exports.smartSuggest = (req, res) => {
  console.log('Smart suggest')
  res.status(200).send('good')
}

