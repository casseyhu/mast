const database = require('../config/database.js')

const Degree = database.Degree
const GradeRequirement = database.GradeRequirement
const GpaRequirement = database.GpaRequirement
const CreditRequirement = database.CreditRequirement
const CourseRequirement = database.CourseRequirement

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
      return true
    }
  }
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