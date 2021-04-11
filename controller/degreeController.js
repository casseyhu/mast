const { IncomingForm } = require('formidable')
const fs = require('fs')
const database = require('../config/database.js')

const Degree = database.Degree
const GradeRequirement = database.GradeRequirement
const GpaRequirement = database.GpaRequirement
const CreditRequirement = database.CreditRequirement
const CourseRequirement = database.CourseRequirement


// Upload degree
exports.upload = (req, res) => {
  var form = new IncomingForm()
  form.parse(req)
    .on('file', (field, file) => {
      if (file.type != 'application/json') {
        res.status(500).send('File must be *.json')
        return
      }
      fs.readFile(file.path, 'utf-8', (err, results) => {
        const jsonFile = JSON.parse(results)
        importDegree(jsonFile).then(result => {
          if (!result) {
            res.status(500).send('Cannot parse JSON file')
            return
          }
          res.status(200).send('Successfully Uploaded Degree Requirements')
        })
      })
    })
}


// Find all requirements for a degree by department and track
exports.findRequirements = (req, res) => {
  Degree
    .findOne({
      where: {
        dept: req.query.department,
        track: req.query.track,
        degreeId: req.query.degreeId
      }
    })
    .then(degree => {
      findRequirements(degree, res)
    })
    .catch(err => {
      res.status(500).send('Could not find degree requirement version.')
    })
}


async function findRequirements(degree, res) {
  let gradeReq = await GradeRequirement.findOne({
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
  res.status(200).send([gradeReq, gpaReq, creditReq, courseReq])
}

// Import the degrees from the json file
async function importDegree(json_file) {
  for (let degAndTrack of Object.keys(json_file)) {
    const degree = json_file[degAndTrack]
    // Query to find if a degree with dept, track, and version exists
    const found = await Degree.findOne({
      where: {
        dept: degree.dept,
        track: degree.track,
        requirementVersion: degree.requirementVersion
      }
    })
    if (found)
      await updateDegree(found, degree)
    else
      await createDegree(degree)
  }
  return 1
}


async function updateDegree(oldDegree, newDegree) {
  try {
    console.log('Updating degree')
    // Just delete all the course requirements for this current version and recreate new 
    // courserequirement records. Might end up using memory faster (overflowing autoincrement 
    // in mysql).
    await CourseRequirement.destroy({ where: { requirementId: oldDegree.courseRequirement } })
    // Get the list of new course requirement IDs. 
    const newCourseIds = await createCourseRequirements(newDegree)
    await oldDegree.update({
      courseRequirement: newCourseIds
    })

    // Find the gradereq record from the oldDegree, then update.
    if (newDegree.gradeRequirement) {
      const gradeRequirement = await GradeRequirement.findOne({
        where: {
          requirementId: oldDegree.gradeRequirement
        }
      })
      await gradeRequirement.update({
        atLeastCredits: newDegree.gradeRequirement.atLeastCredits,
        minGrade: newDegree.gradeRequirement.minGrade,
      })
    }

    // Find the gpareq record from the oldDegree, then update.
    const gpaRequirement = await GpaRequirement.findOne({
      where: {
        requirementId: oldDegree.gpaRequirement
      }
    })
    await gpaRequirement.update({
      cumulative: newDegree.gpaRequirements.cumulGpa,
      department: newDegree.gpaRequirements.deptGpa,
      core: newDegree.gpaRequirements.coreGpa
    })

    // Find the creditreq record from the oldDegree, then update.
    const creditRequirement = await CreditRequirement.findOne({
      where: {
        requirementId: oldDegree.creditRequirement
      }
    })
    await creditRequirement.update({
      minCredit: newDegree.creditRequirement
    })
  } catch (e) {
    console.log(e)
    return 0
  }
  return 1
}


// Creates the new courseRequirements from the degree.courseRequirements 
// (['1:(1,1):(3,3)', 'AMS500', 'AMS502', 'AMS504', ...]) then gathers
// all the new requirementId's that were made for every entry into the db. 
// Returns this list of the new requirement Ids. 
async function createCourseRequirements(degree) {
  courseReqIds = []
  for (let i = 0; i < degree.courseRequirements.length; i++) {
    courseReq = degree.courseRequirements[i]
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



async function createDegree(degree) {
  try {
    let gradeRequirement = null
    let creditRequirement = null
    let gpaRequirement = null

    // Create tje cpirse requirements
    const courseReqIds = await createCourseRequirements(degree)

    // Create the grade requirement
    if (degree.gradeRequirement) {
      gradeRequirement = await GradeRequirement.create({
        // requirementId: newDegree.degreeId,
        atLeastCredits: degree.gradeRequirement === null
          ? null : degree.gradeRequirement.atLeastCredits,
        minGrade: degree.gradeRequirement === null
          ? null : degree.gradeRequirement.minGrade,
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

    // Create the degree
    await Degree.create({
      dept: degree.dept,
      track: degree.track,
      requirementVersion: degree.requirementVersion,
      gradeRequirement: gradeRequirement ? gradeRequirement.requirementId : null,
      gpaRequirement: gpaRequirement.requirementId,
      creditRequirement: creditRequirement.requirementId,
      courseRequirement: courseReqIds
    })

  } catch (e) {
    console.log(e)
    return 0
  }
  return 1
}



// https://stackoverflow.com/questions/2615417/what-happens-when-auto-increment-on-integer-column-reaches-the-max-value-in-data