const { IncomingForm } = require('formidable')
const fs = require('fs')
const { findRequirements, titleCase } = require('./shared')
const database = require('../config/database.js')
const coursePlanController = require('./coursePlanController')
// const { CoursePlan } = require('../config/database.js')

const Degree = database.Degree
const CoursePlan = database.CoursePlan
const GradeRequirement = database.GradeRequirement
const GpaRequirement = database.GpaRequirement
const CreditRequirement = database.CreditRequirement
const CourseRequirement = database.CourseRequirement
const RequirementState = database.RequirementState


/**
 * Uploads a degree requirement to the database from a JSON file.
 * @param {*} req Contains a formData containing the JSON file
 * @param {*} res 
 */
exports.upload = (req, res) => {
  var form = new IncomingForm()
  let dept = ''
  form
    .parse(req)
    .on('field', (name, field) => {
      if (name === 'dept') dept = field
    })
    .on('file', (field, file) => {
      if (file.type != 'application/json') {
        res.status(500).send('File must be *.json')
        return
      }
      fs.readFile(file.path, 'utf-8', async (err, results) => {
        try {
          const jsonFile = JSON.parse(results)
          for (let degAndTrack of Object.keys(jsonFile)) {
            const degree = jsonFile[degAndTrack]
            if (degree.dept !== dept)
              continue
            // Query to find if a degree with dept, track, and version exists
            const found = await Degree.findOne({
              where: {
                dept: degree.dept.toUpperCase(),
                track: titleCase(degree.track),
                requirementVersion: degree.requirementVersion
              }
            })
            if (found)
              await updateDegree(found, degree)
            else
              await createDegree(degree)
          }
          res.status(200).send('Successfully Uploaded Degree Requirements')
        } catch (err) {
          res.status(500).send('Cannot parse JSON file')
          return
        }
      })
    })
}


/**
 * Find all requirements for a degree by department, track, and degreeId.
 * @param {*} req Contains paramters for department, track, and degreeId
 * @param {*} res 
 */
exports.findRequirements = async (req, res) => {
  let condition = {
    dept: req.query.department,
    track: titleCase(req.query.track),
  }
  if (req.query.reqVersion)
    condition['requirementVersion'] = req.query.reqVersion
  if (req.query.degreeId)
    condition['degreeId'] = req.query.degreeId
  const degree = await Degree.findOne({ where: condition })
  const results = await findRequirements(degree)
  if (results.length === 0)
    res.status(500).send('Could not find degree requirement version.')
  else
    res.status(200).send(results)
}


/**
 * Creates the new courseRequirement objects for the new degree in the database. 
 * Course requirements structure is of the form:
 * - (['1:(1,1):(3,3)', 'AMS500', 'AMS502', 'AMS504', ...])
 * @param {Array<String>} courseRequirements List of course requirement strings
 * @returns List of the new course requirement ids that were created.
 */
async function createCourseRequirements(courseRequirements) {
  courseReqIds = []
  for (let i = 0; i < courseRequirements.length; i++) {
    courseReq = courseRequirements[i]
    reqStr = courseReq[0].split(':')
    coursesRange = reqStr[1].slice(1, reqStr[1].length - 1).split(',')
    creditsRange = reqStr[2].slice(1, reqStr[2].length - 1).split(',')
    const course = await CourseRequirement.create({
      type: Number(reqStr[0]),
      courseLower: coursesRange[0] === '' ? null : Number(coursesRange[0]),
      courseUpper: coursesRange[1] === '' ? null : Number(coursesRange[1]),
      creditLower: creditsRange[0] === '' ? null : Number(creditsRange[0]),
      creditUpper: creditsRange[1] === '' ? null : Number(creditsRange[1]),
      courses: courseReq.slice(1)
    })
    courseReqIds.push(course.requirementId)
  }
  return courseReqIds
}


/**
 * Updates an existing degree in the database to the new updated degree.
 * @param {Object} oldDegree Old degree object
 * @param {Object} newDegree New degree object
 */
async function updateDegree(oldDegree, newDegree) {
  try {
    console.log('Updating degree')
    // Delete all course requirements for oldDegree and create new courserequirements.
    let requirementIds = oldDegree.courseRequirement.map(course => 'C' + course)
    let requirementStates = await RequirementState.findAll({ where: { requirementId: requirementIds } })
    let affectedStudents = Array.from(new Set(requirementStates.map(state => state.sbuID)))
    await CourseRequirement.destroy({ where: { requirementId: oldDegree.courseRequirement } })
    // Create and update the new course requirements for the degree
    const newCourseIds = await createCourseRequirements(newDegree.courseRequirements)
    await oldDegree.update({ courseRequirement: newCourseIds })
    // Update the grade requirement record if applicable (AMS)
    if (newDegree.gradeRequirement) {
      await GradeRequirement.update({
        atLeastCredits: newDegree.gradeRequirement.atLeastCredits,
        minGrade: newDegree.gradeRequirement.minGrade
      }, {
        where: { requirementId: oldDegree.gradeRequirement }
      })
    }
    // Find the gpareq record from the oldDegree, then update.
    await GpaRequirement.update({
      cumulative: newDegree.gpaRequirements.cumulGpa,
      department: newDegree.gpaRequirements.deptGpa,
      core: newDegree.gpaRequirements.coreGpa
    }, {
      where: { requirementId: oldDegree.gpaRequirement }
    })
    // Find the creditreq record from the oldDegree, then update.
    await CreditRequirement.update({
      minCredit: newDegree.creditRequirement
    }, {
      where: { requirementId: oldDegree.creditRequirement }
    })
    let studentsPlanId = {}
    for (let id of affectedStudents) {
      for (let cId of newCourseIds) {
        await RequirementState.create({
          sbuID: id,
          requirementId: 'C' + cId,
          state: 'unsatisfied',
          metaData: []
        })
      }
      let coursePlan = await CoursePlan.findOne({where: { studentId: id }})
      studentsPlanId[id] = coursePlan.coursePlanId
    }
    await coursePlanController.changeCompletion(studentsPlanId, newDegree.dept, null)
  } catch (e) {
    console.log(e)
  }
}


/**
 * Creates a new degree object with all its requirements in the database.
 * @param {Object} degree New degree object
 */
async function createDegree(degree) {
  try {
    let gradeRequirement = null
    let creditRequirement = null
    let gpaRequirement = null
    // Create the course requirements
    const courseReqIds = await createCourseRequirements(degree.courseRequirements)
    // Create the grade requirement, if applicable (AMS)
    if (degree.gradeRequirement) {
      gradeRequirement = await GradeRequirement.create({
        // requirementId: newDegree.degreeId,
        atLeastCredits: degree.gradeRequirement === null
          ? null : degree.gradeRequirement.atLeastCredits,
        minGrade: degree.gradeRequirement === null
          ? null : degree.gradeRequirement.minGrade
      })
    }
    // Create the credit requirement
    creditRequirement = await CreditRequirement.create({
      minCredit: degree.creditRequirement
    })
    // Create the gpa requirement
    gpaRequirement = await GpaRequirement.create({
      cumulative: degree.gpaRequirements.cumulGpa,
      department: degree.gpaRequirements.deptGpa,
      core: degree.gpaRequirements.coreGpa
    })
    // Finally, create the degree object
    await Degree.create({
      dept: degree.dept.toUpperCase(),
      track: titleCase(degree.track),
      requirementVersion: degree.requirementVersion,
      gradeRequirement: gradeRequirement ? gradeRequirement.requirementId : null,
      gpaRequirement: gpaRequirement.requirementId,
      creditRequirement: creditRequirement.requirementId,
      courseRequirement: courseReqIds
    })
  } catch (e) {
    console.log(e)
  }
}

