const { IncomingForm } = require('formidable');
const database = require('../config/database.js');
const fs = require('fs');

const Degree = database.Degree;
const GradeRequirement = database.GradeRequirement;
const GpaRequirement = database.GpaRequirement;
const CreditRequirement = database.CreditRequirement;
const CourseRequirement = database.CourseRequirement;


// Upload degree
exports.upload = (req, res) => {
  var form = new IncomingForm()
  form.parse(req).on('file', (field, file) => {
    if (file.type != 'application/json') {
      res.status(500).send('File must be *.json')
    } else {
      fs.readFile(file.path, 'utf-8', (err, results) => {
        const jsonFile = JSON.parse(results)
        importDegree(jsonFile).then(result => {
          if (!result) {
            res.status(500).send("Cannot parse JSON file")
            return
          }
          res.status(200).send("Successfully Uploaded Degree Requirements")
        })
      })
    }
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
      res.status(500).send("Could not find degree requirement version.")
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
  // console.log(courseReq)
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
    if (found) {
      await updateDegree(found, degree)
    } else {
      await createDegree(degree)
    }
  }
  return 1
}


async function updateDegree(oldDegree, newDegree) {
  try {
    console.log("Updating degree")
    // Just delete all the course requirements for this current version and recreate new 
    // courserequirement records. Might end up using memory faster (overflowing autoincrement 
    // in mysql).
    oldCourseIds = oldDegree.dataValues.courseRequirement.split('`')
    for (let i = 0; i < oldCourseIds.length; i++) {
      await CourseRequirement.destroy({
        where: {
          requirementId: oldCourseIds[i]
        }
      })
    }

    // Get the list of new course requirement IDs. 
    const newCourseIds = await createCourseRequirements(newDegree)

    // Find the gradereq record from the oldDegree, then update.
    await GradeRequirement.findOne({
      where: {
        requirementId: oldDegree.dataValues.gradeRequirement
      }
    }).then(async (result) => {
      const updt = await result.update({
        atLeastCredits: newDegree.gradeRequirement === null
          ? null : newDegree.gradeRequirement.atLeastCredits,
        minGrade: newDegree.gradeRequirement === null
          ? null : newDegree.gradeRequirement.minGrade,
      })
    })

    // Find the gpareq record from the oldDegree, then update.
    await GpaRequirement.findOne({
      where: {
        requirementId: oldDegree.dataValues.gpaRequirement
      }
    }).then(async (result) => {
      await result.update({
        cumulative: newDegree.gpaRequirements.cumulGpa,
        department: newDegree.gpaRequirements.deptGpa,
        core: newDegree.gpaRequirements.coreGpa
      })
    })

    // Find the creditreq record from the oldDegree, then update.
    await CreditRequirement.findOne({
      where: {
        requirementId: oldDegree.dataValues.creditRequirement
      }
    }).then(async (result) => {
      await result.update({
        minCredit: newDegree.creditRequirement
      })
    })

    await oldDegree.update({
      courseRequirement: newCourseIds
    })
  } catch (e) {
    console.log(e)
    return 0
  }
  return 1
}


// Creates the new courseRequirements from the degree.courseRequirements 
// (["1:(1,1):(3,3)", "AMS500", "AMS502", "AMS504", ...]) then gathers
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
      courseLower: coursesRange[0] === "" ? null : Number(coursesRange[0]),
      courseUpper: coursesRange[1] === "" ? null : Number(coursesRange[1]),
      creditLower: creditsRange[0] === "" ? null : Number(creditsRange[0]),
      creditUpper: creditsRange[1] === "" ? null : Number(creditsRange[1]),
      courses: courseReq.slice(1)
    })
    courseReqIds.push(course.requirementId)
  }
  return courseReqIds
}



async function createDegree(degree) {
  try {
    requirementIds = {}
    const courseReqIds = await createCourseRequirements(degree)

    // Make the degree record first, since we have to satisfy the foreign key constraints.
    // of the grade/gpa/credit-requirements. Note, we do not set any values for the 
    // grade/gpa/credit requirements yet. They will be null. 
    const newDegree = await Degree.create({
      dept: degree.dept,
      track: degree.track,
      requirementVersion: degree.requirementVersion,
    })

    // We now update this newly-created Degree entry and set the grade/gpa/credit
    // requirement values to be == newDegree.degreeId. Every Degree+track we make 
    // will have their own grade/gpa/credit requirement anyways-- we won't share
    // them with other degrees. So, the DegreeId and grade/gpa/creditReq
    // fields are 1:1. That is, every one degree you make, you also make
    // one grade/gpa/credit req entry, so the IDs should end up being the same.
    const updateReqIds = await newDegree.update({
      gradeRequirement: newDegree.degreeId,
      gpaRequirement: newDegree.degreeId,
      creditRequirement: newDegree.degreeId,
      courseRequirement: courseReqIds
    })

    // Create this degree's respective grade/credit/gpa requirements. -----------
    // Note: We set the requirementId of each entry to be the newDegree.degreeId.

    if (degree.gradeRequirement) {
      const grade = await GradeRequirement.create({
        requirementId: newDegree.degreeId,
        atLeastCredits: degree.gradeRequirement === null
          ? null : degree.gradeRequirement.atLeastCredits,
        minGrade: degree.gradeRequirement === null
          ? null : degree.gradeRequirement.minGrade,
      })
    }

    const credit = await CreditRequirement.create({
      requirementId: newDegree.degreeId,
      minCredit: degree.creditRequirement
    })

    const gpa = await GpaRequirement.create({
      requirementId: newDegree.degreeId,
      cumulative: degree.gpaRequirements.cumulGpa,
      department: degree.gpaRequirements.deptGpa,
      core: degree.gpaRequirements.coreGpa
    })
  } catch (e) {
    console.log(e)
    return 0
  }
  return 1
}



// https://stackoverflow.com/questions/2615417/what-happens-when-auto-increment-on-integer-column-reaches-the-max-value-in-data