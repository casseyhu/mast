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
        const json_file = JSON.parse(results)
        importDegree(json_file).then(result => {
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

//Find all degrees
exports.findAll = (req, res) => {
  Degree.findAll().then(degrees => {
    res.send(degrees);
  }).catch(err => {
    res.status(500).send("Error: " + err);
  })
}


async function importDegree(json_file) {
  for (let deg_and_track of Object.keys(json_file)) {
    const degree = json_file[deg_and_track]
    const [exists, record_found] = await degreeExists(degree)
    if (exists) {
      const update = await updateDegree(record_found[0], degree)
    } else {
      const new_degree = await createDegree(degree)
    }
  }
  return 1
}

async function degreeExists(degree) {
  let query = await Degree.findAll({
    where: {
      dept: degree.dept,
      track: degree.track,
      requirementVersion: degree.requirementVersion
    }
  })
  // If query.length !== 0, degree was found. This would return true.
  // Else, query.length === 0 (degree not found). This would return false. 
  return [query.length !== 0, query] 
}

async function updateDegree(old_degree, new_degree) {
  try{
    console.log("Updating degree")
    // Just delete all the course requirements for this current version and recreate new 
    // courserequirement records. Might end up using memory faster (overflowing autoincrement 
    // in mysql).
    old_course_ids = old_degree.dataValues.courseRequirement.split('`')
    for(let i = 0; i < old_course_ids.length; i++){
      const delete_courseReq = await CourseRequirement.destroy({
        where:{
          requirementId: old_course_ids[i]
        }
      })
    }
    
    // Get the list of new course requirement IDs. 
    const new_course_ids = await createCourseRequirements(new_degree)

    // Find the gradereq record from the old_degree, then update.
    const update_gradeReq = await GradeRequirement.findOne({where: {
      requirementId: old_degree.dataValues.gradeRequirement
    }}).then(async (result) => {
      const updt = await result.update({
        atLeastCredits: new_degree.gradeRequirement === null
          ? null : new_degree.gradeRequirement.atLeastCredits,
        minGrade: new_degree.gradeRequirement === null
          ? null : new_degree.gradeRequirement.minGrade,
      })
    })

    // Find the gpareq record from the old_degree, then update.
    const update_gpaReq = await GpaRequirement.findOne({where: {
      requirementId: old_degree.dataValues.gpaRequirement
    }}).then(async (result) => {
      const updt = await result.update({
        cumulative: new_degree.gpaRequirements.cumulGpa,
        department: new_degree.gpaRequirements.deptGpa,
        core: new_degree.gpaRequirements.coreGpa
      })
    })

    // Find the creditreq record from the old_degree, then update.
    const update_creditReq = await CreditRequirement.findOne({where: {
      requirementId: old_degree.dataValues.creditRequirement
    }}).then(async (result) => {
      const updt = await result.update({
        minCredit: new_degree.creditRequirement
      })
    })
    
    const update_courseReqId = await old_degree.update({
      courseRequirement: new_course_ids
    })
  } catch(e) {
    console.log(e)
    return 0
  }
  return 1
}


// Creates the new courseRequirements from the degree.courseRequirements 
// (["1:(1,1):(3,3)", "AMS500", "AMS502", "AMS504", ...]) then gathers
// all the new requirementId's that were made for every entry into the db. 
// Returns this list of the new requirement Ids. 
async function createCourseRequirements(degree){
  course_req_ids = []
  for (let i = 0; i < degree.courseRequirements.length; i++) {
    course_req = degree.courseRequirements[i]
    req_str = course_req[0].split(':')
    courses_range = req_str[1].slice(1, req_str[1].length - 1).split(',')
    credits_range = req_str[2].slice(1, req_str[2].length - 1).split(',')
    const course = await CourseRequirement.create({
      type: Number(req_str[0]),
      courseLower: courses_range[0] === "" ? null : Number(courses_range[0]),
      courseUpper: courses_range[1] === "" ? null : Number(courses_range[1]),
      creditLower: credits_range[0] === "" ? null : Number(credits_range[0]),
      creditUpper: credits_range[1] === "" ? null : Number(credits_range[1]),
      courses: course_req.slice(1)
    })
    course_req_ids.push(course.requirementId)
  }
  return course_req_ids
}



async function createDegree(degree){
  try {
    requirement_ids = {}
    const course_req_ids = await createCourseRequirements(degree)

    // Make the degree record first, since we have to satisfy the foreign key constraints.
    // of the grade/gpa/credit-requirements. Note, we do not set any values for the 
    // grade/gpa/credit requirements yet. They will be null. 
    const new_degree = await Degree.create({
      dept: degree.dept,
      track: degree.track,
      requirementVersion: degree.requirementVersion,
    })
    
    // We now update this newly-created Degree entry and set the grade/gpa/credit
    // requirement values to be == new_degree.degreeId. Every Degree+track we make 
    // will have their own grade/gpa/credit requirement anyways-- we won't share
    // them with other degrees. So, the DegreeId and grade/gpa/creditReq
    // fields are 1:1. That is, every one degree you make, you also make
    // one grade/gpa/credit req entry, so the IDs should end up being the same.
    const update_reqIds = await new_degree.update({
      gradeRequirement: new_degree.degreeId,
      gpaRequirement: new_degree.degreeId,
      creditRequirement: new_degree.degreeId,
      courseRequirement: course_req_ids
    })

    // Create this degree's respective grade/credit/gpa requirements. -----------
    // Note: We set the requirementId of each entry to be the new_degree.degreeId.

    const grade = await GradeRequirement.create({
      requirementId: new_degree.degreeId,
      atLeastCredits: degree.gradeRequirement === null
        ? null : degree.gradeRequirement.atLeastCredits,
      minGrade: degree.gradeRequirement === null
        ? null : degree.gradeRequirement.minGrade,
    })

    const credit = await CreditRequirement.create({
      requirementId: new_degree.degreeId,
      minCredit: degree.creditRequirement
    })

    const gpa = await GpaRequirement.create({
      requirementId: new_degree.degreeId,
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