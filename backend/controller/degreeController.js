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
        createDegrees(json_file).then(result => {
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


function degreeExists(degree) {
  // try {
  let query = Degree.findAll({
    where: {
      dept: degree.dept,
      track: degree.track,
      requirementVersion: degree.requirementVersion
    }
  })
  // If query.length == 0, no degree was found. Return False
  // If query.length != 0, a degree was found. Return true.
  return (query.length !== 0) 
  // } catch (e) {
  //   return 0
  // }
}


async function createDegrees(json_file) {
  try {
    for (let deg_and_track of Object.keys(json_file)) {
      let degree = json_file[deg_and_track]

      // let query = await Degree.findAll({
      //   where: {
      //     dept: degree.dept,
      //     track: degree.track,
      //     requirementVersion: degree.requirementVersion
      //   }
      // }) 
      // console.log(query)
      if (degreeExists(degree)) {
        // "existing requirements for the degree versions mentioned in the file are overwritten."
        // Update degree

      }
      // if (!degreeExists(degree)) {
      //   return 0
      // }
      requirement_ids = {}
      new_course_ids = []

      // Make the degree record first, since we have to satisfy the foreign key constraints.
      // of the grade/gpa/credit-requirements. Note, we do not set any values for the 
      // grade/gpa/credit requirements yet. They will be null. 
      const new_degree = await Degree.create({
        dept: degree.dept,
        track: degree.track,
        requirementVersion: degree.requirementVersion,
      })


      for (let i = 0; i < degree.courseRequirements.length; i++) {
        course_req = degree.courseRequirements[i]
        req_str = course_req[0].split(':')
        courses_range = req_str[1].slice(1, req_str[1].length - 1).split(',')
        credits_range = req_str[2].slice(1, req_str[2].length - 1).split(',')
        // console.log("Courses range: ", courses_range)
        // console.log("Credits range: ", credits_range)
        // console.log("Courses list: ", course_req.slice(1))
        const course = await CourseRequirement.create({
          type: Number(req_str[0]),
          courseLower: courses_range[0] === "" ? null : Number(courses_range[0]),
          courseUpper: courses_range[1] === "" ? null : Number(courses_range[1]),
          creditLower: credits_range[0] === "" ? null : Number(credits_range[0]),
          creditUpper: credits_range[1] === "" ? null : Number(credits_range[1]),
          courses: course_req.slice(1)
        })
        new_course_ids.push(course.requirementId)
      }

      // console.log("New degree ID is: ", new_degree.degreeId)
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
        courseRequirement: new_course_ids
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

      // const final = await new_degree.update({
      //   courseRequirement: new_course_ids
      // })
    }
  }
  catch (e) {
    console.log(e)
    return 0;
  }
  return 1;
}



// https://stackoverflow.com/questions/2615417/what-happens-when-auto-increment-on-integer-column-reaches-the-max-value-in-data
