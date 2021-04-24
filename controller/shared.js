const database = require('../config/database.js')

const GradeRequirement = database.GradeRequirement
const GpaRequirement = database.GpaRequirement
const CreditRequirement = database.CreditRequirement
const CourseRequirement = database.CourseRequirement

const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem

exports.currSem = 'Spring'
exports.currYear = 2021

exports.GRADES = {
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
exports.SEMTONUM = {
  'Fall': 8,
  'Spring': 2,
  'Winter': 1,
  'Summer': 5
}
exports.NUMTOSEM = {
  8: 'Fall',
  2: 'Spring',
  1: 'Winter',
  5: 'Summer'
}


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