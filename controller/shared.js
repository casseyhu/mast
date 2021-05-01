const database = require('../config/database.js')
const { currSem, currYear, SEMTONUM } = require('./constants.js')
const Degree = database.Degree
const GradeRequirement = database.GradeRequirement
const GpaRequirement = database.GpaRequirement
const CreditRequirement = database.CreditRequirement
const CourseRequirement = database.CourseRequirement

const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem

/**
 * Checks if two course offerings have a conflict in day and time.
 * @param {Object} courseA First course offering object
 * @param {Object} courseB Second course offering object
 * @param {Map} invalidCourses List of invalid conflict courses to append to 
 * @returns Boolean indicating if there was a conflict
 */
exports.checkTimeConflict = (courseA, courseB, invalidCourses) => {
  // If empty fields, skip checking
  if (courseA.identifier === courseB.identifier || !courseA.days || !courseB.days ||
    !courseA.startTime || !courseB.startTime || !courseA.endTime || !courseB.endTime)
    return false
  let aDays = courseA.days
  let bDays = courseB.days
  if ((aDays.includes('M') && bDays.includes('M')) ||
    (aDays.includes('TU') && bDays.includes('TU')) ||
    (aDays.includes('W') && bDays.includes('W')) ||
    (aDays.includes('TH') && bDays.includes('TH')) ||
    (aDays.includes('F') && bDays.includes('F'))) {
    // Check time conflict
    let aStart = courseA.startTime
    let bStart = courseB.startTime
    let aEnd = courseA.endTime
    let bEnd = courseB.endTime
    if ((aStart >= bStart && aStart < bEnd) || (aEnd <= bEnd && aEnd > bStart) ||
      (bStart >= aStart && bStart < aEnd) || (bEnd <= aEnd && bEnd > aStart)) {
      invalidCourses.push(courseA.identifier)
      invalidCourses.push(courseB.identifier)
      console.log("time conflict")
      return true
    }
  }
  return false
}


/**
 * Determines if the student has taken the pre-requisites for a course.
 * @param {Object} courseA A course node or Course object
 * @param {Array[String]} takenAndCurrentCourses List of courses that the student has taken
 * and currently taking
 * @returns Boolean value indicating whether they have taken/currently taking pre-requisites
 * for the course.
 */
exports.checkPrereq = (course, takenAndCurrentCourses, returnPrereqs) => {
  let prereqs = course.prereqs
  let unsatisfiedPrereqs = []
  if (prereqs[0] === '')
    return returnPrereqs ? unsatisfiedPrereqs : true
  for (let l = 0; l < prereqs.length; l++) {
    if (!takenAndCurrentCourses.has(prereqs[l])) {
      unsatisfiedPrereqs.push(prereqs[l])
      if (!returnPrereqs)
        return false
    }
  }
  return returnPrereqs ? unsatisfiedPrereqs : true
}


/**
 * Finds all the requirement objects for a given degree.
 * @param {Object} degree Degree object to find requirements for
 * @returns An array of all the requirement objects.
 */
exports.findRequirements = async (degree) => {
  try {
    let gradeReq = null
    if (degree.gradeRequirement)
      gradeReq = await GradeRequirement.findOne({
        where: {
          requirementId: degree.gradeRequirement
        }
      })
    let gpaReq = await GpaRequirement.findOne({
      where: {
        requirementId: degree.gpaRequirement
      }
    })
    let creditReq = await CreditRequirement.findOne({
      where: {
        requirementId: degree.creditRequirement
      }
    })
    let courseReq = await CourseRequirement.findAll({
      where: {
        requirementId: degree.courseRequirement
      }
    })
    return [gradeReq, gpaReq, creditReq, courseReq]
  } catch (err) {
    return []
  }
}


/**
 * Finds all the course plan items for a given student.
 * @param {Number} sbuId SBU ID to find course plan items for
 * @returns List of course plan items for the student
 */
exports.findCoursePlanItems = async (sbuId) => {
  const coursePlan = await CoursePlan.findOne({ where: { studentId: sbuId } })
  const items = await CoursePlanItem.findAll({
    where: {
      coursePlanId: coursePlan.coursePlanId
    }
  })
  return items
}


/**
 * Updates or creates a new entry in a database table.
 * @param {Model} model The database table to use
 * @param {Map<String, Object>} condition Condition to find by
 * @param {Map<String, Object>} values Values to update or create
 * @param {Boolean} update Update if it exists?
 * @param {Boolean} create Create if it doesnt exist?
 */
exports.updateOrCreate = async (model, condition, values, update, create) => {
  let found = await model.findOne({ where: condition })
  if (found && update)
    await found.update(values)
  else if (!found && create)
    await model.create(values)
}


/**
 * Updates a course plan item if it is an in-plan item else delete the item.
 * @param {Model} model The database table to use
 * @param {Map<String, Object>} condition Condition to find by
 * @param {Map<String, Object>} values Values to update to
 * @returns True if it updated the item, false otherwise.
 */
exports.updateOrDelete = async (model, condition, values) => {
  let found = await model.findOne({ where: condition })
  if (found.status) {
    await found.update(values)
    return true
  } else {
    await model.destroy({ where: condition })
    return false
  }
}


/**
 * Finds and returns a list of exception courses and departments.
 * @param {Array[String]} depts List of departments to get courses for
 * @param {String} semester Semester to get courses for
 * @param {Number} year Year to get courses for
 * @returns A list of exception departments and exception courses for given departments
 */
exports.getDepartmentalCourses = async (depts, semester, year) => {
  let degrees = await Degree.findAll({
    where: {
      dept: depts,
      requirementVersion: year * 100 + SEMTONUM[semester]
    }
  })
  let courseRequirements = await CourseRequirement.findAll({
    where: {
      requirementId: degrees.reduce((a, b) => b.courseRequirement.concat(a), [])
    }
  })

  let exceptions = new Set(courseRequirements
    .reduce((a, b) => b.courses.filter(course => course && !(depts.includes(course.substring(0, 3))))
      .concat(a), []))
  exceptions = Array.from(exceptions)
  let exceptionDepts = new Set(exceptions.map(course => course.substring(0, 3)))
  exceptionDepts = Array.from(exceptionDepts)
  return [exceptionDepts, exceptions]
}


/**
 * Checks if a semester and year combo is before current semester and year
 * @param {String} semester 
 * @param {Number} year 
 */
exports.beforeCurrent = (semester, year) => {
  return year * 100 + SEMTONUM[semester] < currYear * 100 + SEMTONUM[currSem]
}


/**
 * Converts a string to title case
 * @param {String} str String to convert
 * @returns Title-cased string
 */
exports.titleCase = (str) => {
  var arr = str.toLowerCase().split(' ')
  for (var i = 0; i < arr.length; i++)
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].substring(1)
  return arr.join(' ')
}