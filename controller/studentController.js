const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { IncomingForm } = require('formidable');
const fs = require('fs');
const Papa = require('papaparse');

const database = require('../config/database.js');
const Op = database.Sequelize.Op;

const Student = database.Student;
const Degree = database.Degree;
const CoursePlan = database.CoursePlan;

// Create a Student from Add Student 
exports.create = (req, res) => {
  const student = req.body.params
  if (emptyFields(student)) {
    let errMsg = "Error in adding student. Please check that all necessary student information are filled out."
    res.status(500).send(errMsg);
    return
  }
  const semDict = {
    "Fall": "08",
    "Spring": "02",
    "Winter": "01",
    "Summer": "05"
  }
  Degree.findOne({
    where: {
      dept: student.dept,
      track: student.track,
      requirementVersion: Number(student.degreeYear + semDict[student.degreeSem]),
    }
  }).then((degree) => {
    if (!degree) {
      // No degree + track + requirement version was found in the DB. 
      res.status(500).send("Degree requirement version does not exist.")
      return
    }
    // Hash the password for the student. (first init + last init + sbuid)
    let first = student.firstName.charAt(0).toLowerCase()
    let last = student.lastName.charAt(0).toLowerCase()
    let password = first + last + student.sbuId
    let salt = bcrypt.genSaltSync(10);
    let hashPassword = bcrypt.hashSync(password, salt);

    // Check for valid graduation date. If EntryDate == GradDate, it's valid for now.
    let gradDate = Number(student.gradYear + semDict[student.gradSem])
    let entryDate = Number(student.entryYear + semDict[student.entrySem])
    let degreeVersion = Number(student.degreeYear + semDict[student.degreeSem])
    if (gradDate < entryDate) {
      res.status(500).send("Graduation date cannot be earlier than entry date.");
      return
    }
    if (degreeVersion < entryDate) {
      res.status(500).send("Degree version cannot be earlier than entry date.");
      return
    }
    if (degreeVersion > gradDate) {
      res.status(500).send("Degree version cannot be later than graduation date.");
      return
    }

      // Check for proper 9-digit SBUID
      let regex = /^\d{9}$/;
      console.log(student.sbuId)
      if (!regex.test(student.sbuId)) {
        res.status(500).send("SBUID must be a 9-digit string of numbers 0-9.");
        return
      }

      // Check for proper .edu email address
      regex = /^\w+@\w+\.edu$/;
      console.log(student.email)
      if (!regex.test(student.email)) {
        res.status(500).send("Student must have a valid .edu email.");
        return
      }

      // TODO: get number of degree requirements and set initial state of each requirement to unsatisfied


    // Tries to create the student with all fields. 
    Student
      .create({
        sbuId: student.sbuId,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        password: hashPassword,
        gpa: null,
        entrySem: student.entrySem,
        entryYear: Number(student.entryYear),
        entrySemYear: Number(student.entryYear.concat(semDict[student.entrySem])),
        gradSem: student.gradSem,
        gradYear: Number(student.gradYear),
        department: student.dept,
        track: student.track,
        // set # unsatisfied, pending, satisfied
        satisfied: 0,
        unsatisfied: 0,
        pending: 0,
        degreeId: degree.degreeId,
        graduated: 0,
        gpdComments: student.gpdComments,
        studentComments: student.studentComments
      })
      .then(() => {
        CoursePlan
          .create({
            studentId: student.sbuId,
            coursePlanState: 0
          })
          .then(coursePlan => {
            res.status(200).send("Successfully added new student.");
          })
          .catch(err => {
            res.status(200).send("Error creating student course plan.");
          })
      }).catch(err => {
        errMsg = "Error in adding student. Please check student information type (i.e. SBUID must be numbers 0-9)."
        if (err.parent.code !== undefined && err.parent.code === "ER_DUP_ENTRY") {
          errMsg = "Student with ID: " + student.sbuId + " exists already."
        }
        res.status(500).send(errMsg);
      })
  })
    .catch((err) => {
      errMsg = "Error in adding student. Please check student information type (i.e. SBUID must be numbers 0-9)."
      res.status(500).send(errMsg);
      return
    });
}

// Checks if any of the AddStudent fields were empty. All fields, except for
// GPA, GPD comments, Student comments CANNOT be empty. 
function emptyFields(student) {
  for (let fields of Object.keys(student)) {
    if (fields === "studentComments"
      || fields === "gpdComments"
      || fields === "gpa"
      || fields === "graduated") {
      continue
    }
    if (student[fields] === "")
      return true
  }
  return false
}

// Create Students from uploading file
exports.upload = (req, res) => {
  let form = new IncomingForm();
  form.parse(req).on('file', (field, file) => {
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel')
      res.status(500).send('File must be *.csv')
    else {
      const fileIn = fs.readFileSync(file.path, 'utf-8')
      Papa.parse(fileIn, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          var header = results.meta['fields']
          if (header[0] !== 'sbu_id'
            || header[1] !== 'first_name'
            || header[2] !== 'last_name'
            || header[3] !== 'email'
            || header[4] !== 'department'
            || header[5] !== 'track'
            || header[6] !== 'entry_semester'
            || header[7] !== 'entry_year'
            || header[8] !== 'requirement_version_semester'
            || header[9] !== 'requirement_version_year'
            || header[10] !== 'graduation_semester'
            || header[11] !== 'graduation_year'
            || header[12] !== 'password') {
            console.log('invalid csv')
            res.status(500).send("Cannot parse CSV file - headers do not match specifications")
            return
          }
          else
            uploadStudents(results, res)
        }
      })
    }
  })
}


// Verify a student for login
exports.login = (req, res) => {
  Student.findOne({ where: { email: req.query.email } })
    .then(student => {
      const isValidPass = bcrypt.compareSync(req.query.password, student.password);
      if (!isValidPass)
        throw "Invalid password"
      let userData = {
        type: 'student',
        id: student.sbuId,
        userInfo: student
      }
      let token = jwt.sign(userData, process.env.JWT_KEY, {
        algorithm: process.env.JWT_ALGO,
        expiresIn: 1200 // Expires in 20 minutes
      });
      res.send([token, student]);
    }).catch(err => {
      res.status(500).send("Invalid login credentials");
    })
}

// Find a Student 
exports.findById = (req, res) => {
  Student.findByPk(req.params.sbuId).then(student => {
    console.log(student)
    res.send(student);
  }).catch(err => {
    res.status(500).send("Error: " + err);
  })
}

// Filter all students by filters
exports.filter = (req, res) => {
  Student
    .findAll({
      where: {
        firstName: { [Op.like]: req.query.firstName },
        lastName: { [Op.like]: req.query.lastName },
        sbuId: { [Op.like]: req.query.sbuId },
        entrySem: { [Op.like]: req.query.entrySem },
        entryYear: { [Op.like]: req.query.entryYear },
        department: { [Op.like]: req.query.degree },
        gradSem: { [Op.like]: req.query.gradSem },
        gradYear: { [Op.like]: req.query.gradYear },
        graduated: { [Op.like]: req.query.graduated }
      }
    })
    .then(students => {
      res.send(students);
    })
    .catch(err => {
      res.status(500).send("Error: " + err);
    })
}

// Find all Students 
exports.findAll = (req, res) => {
  Student
    .findAll()
    .then(students => {
      res.send(students);
    })
    .catch(err => {
      res.status(500).send("Error: " + err);
    })
}

// Delete a Student
exports.delete = (req, res) => {
  Student
    .destroy({ where: { sbuId: req.params.sbuId } })
    .then(() => {
      res.status(200).send("Student deleted!");
    })
    .catch(err => {
      res.status(500).send("Error: " + err);
    })
}

// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/


// Delete all students from database. Used primarly for testing by GPD
exports.deleteAll = (req, res) => {
  Student
    .drop()
    .then(() => {
      res.status(200).send("Deleted student data.");
      database.sequelize.sync({ force: false }).then(() => {
        console.log("Synced database");
      })
    })
    .catch(err => {
      console.log("Error" + err)
      res.status(500).send("Error: " + err);
    })
}



async function uploadStudents(csvFile, res) {
  const degrees = await Degree.findAll()
  let degreeDict = {};
  const currentGradYear = 202101
  for (let i = 0; i < degrees.length; i++) {
    degreeDict[degrees[i].dept + " " + degrees[i].track] = degrees[i].degreeId
  }
  let tot = 0;
  for (let i = 0; i < csvFile.data.length ; i++) {
    studentInfo = csvFile.data[i]
    let semsDict = { 'Spring': '02', 'Summer': '06', 'Fall': '08', 'Winter': '01' };
    let semYear = Number(studentInfo.entry_year + semsDict[studentInfo.entry_semester])
    let graduated = Number(studentInfo.graduation_year + semsDict[studentInfo.graduation_semester]) <= currentGradYear ? 1 : 0
    let condition = { sbuId: studentInfo.sbu_id }
    let values = {
      sbuId: studentInfo.sbu_id,
      firstName: studentInfo.first_name,
      lastName: studentInfo.last_name,
      email: studentInfo.email,
      password: studentInfo.password,
      gpa: studentInfo.gpa,
      entrySem: studentInfo.entry_semester,
      entryYear: studentInfo.entry_year,
      entrySemYear: semYear,
      gradSem: studentInfo.graduation_semester,
      gradYear: studentInfo.graduation_year,
      department: studentInfo.department,
      track: studentInfo.track,
      satisfied: 0,
      unsatisfied: 0,
      pending: 0,
      degreeId: degreeDict[studentInfo.department + " " + studentInfo.track],
      graduated: graduated,
      gpdComments: "",
      studentComments: ""
    }
    tot += 1
    let found = await Student.findOne({ where: condition })
    if (found)
      await Student.update(values, { where: condition })
    else
      await Student.create(values)

    condition = { studentId: studentInfo.sbu_id }
    found = await CoursePlan.findOne({ where: condition })
    if (!found)
      await CoursePlan.create({
        studentId: studentInfo.sbu_id,
        coursePlanState: 0
      })
  }
  console.log("Done importing " + tot + " students from csv")
  res.status(200).send("Success")
}