const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const database = require('../config/database.js');
const Op = database.Sequelize.Op;



const Student = database.Student;
const Degree = database.Degree;

const { IncomingForm } = require('formidable');
const fs = require('fs');
const Papa = require('papaparse');

// Create a Student from Add Student 
exports.create = (req, res) => {
  const student = req.body.params
  if(emptyFields(student)) {
    let err_msg = "Error in adding student. Please check that all necessary student information are filled out."
    res.status(500).send(err_msg);
  }
  const semDict = {
    "Fall": "08",
    "Spring": "02",
    "Winter": "01",
    "Summer": "05"
  }
  let query = Degree.findOne({
    where: {
      dept: student.dept,
      track: student.track,
      requirementVersion:  Number(student.degreeYear+semDict[student.degreeSem]),
    }
  }).then((degree) => {
    // No degree + track + requirement version was found in the DB. 
    if(degree.degreeId === null) {
      res.status(500).send("Invalid requirement version.")
      return
    } 

    // Hash the password for the student. (first init + last init + sbuid)
    let first = student.firstName.charAt(0).toLowerCase() 
    let last = student.lastName.charAt(0).toLowerCase() 
    let password = first+last+student.sbuId
    let salt = bcrypt.genSaltSync(10);
    let hash_password = bcrypt.hashSync(password, salt);

    // Check for valid graduation date. If EntryDate == GradDate, it's valid for now.
    let grad_date = Number(student.gradYear+semDict[student.gradSem])
    let entry_date = Number(student.entryYear+semDict[student.entrySem])
    if (grad_date < entry_date) {
      res.status(500).send("Graduation date cannot be earlier than entry date.");
      return
    }

    // Check for proper 9-digit SBUID
    if (student.sbuId.length !== 9) {
      res.status(500).send("SBUID must be a 9-digit string of numbers 0-9.");
      return
    }

    // Checks for valid GPA: On 0-4.0 scale, only (0-9) + '.'. 
    if (student.gpa !== "") {
      const regex = /^(?:\d{0,1})?(?:\.\d{1,2})?$/;
      console.log("Checking gpa")
      if (regex.test(student.gpa)) {
        console.log("Passed regex")
        if (Number(student.gpa) > 4.0 || Number(student.gpa) < 0) {
          res.status(500).send("GPA must be on a 4.0 scale.");
          return
        }
      } else {
        console.log("Failed (has chatacters not 0-9 and '.')")
        res.status(500).send("GPA must be a valid number (i.e. 2, 3.4, ...).");
        return
      }
    }

    // Tries to create the student with all fields. 
    Student.create({
      sbuId: student.sbuId,
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      password: hash_password,
      gpa: (student.gpa === "") ? null : Number(student.gpa),
      entrySem: student.entrySem,
      entryYear: Number(student.entryYear),
      entrySemYear: Number(student.entryYear.concat(semDict[student.entrySem])),
      gradSem: student.gradSem,
      gradYear: Number(student.gradYear),
      department: student.dept,
      degreeId: degree.degreeId,
      graduated: 0,
      gpdComments: student.gpdComments,
      studentComments: student.studentComments
    }).then(() => {
      res.status(200).send("Successfully added new student.");
    }).catch(err => {
      err_msg = "Error in adding student. Please check student information type (i.e. SBUID must be numbers 0-9)."
      if (err.parent.code !== undefined && err.parent.code === "ER_DUP_ENTRY") {
        err_msg = "Student with ID: " + student.sbuId + " exists already."
      }
      res.status(500).send(err_msg);
    })
  }).catch((err) => {
    let err_msg =  "Error in adding student. Please check student information type (i.e. SBUID must be numbers 0-9)."
    res.status(500).send(err_msg);
  });
}

// Checks if any of the AddStudent fields were empty. All fields, except for
// GPA, GPD comments, Student comments CANNOT be empty. 
function emptyFields(student){
  for (let fields of Object.keys(student)) {
    if(fields === "studentComments"  
      || fields === "gpdComments" 
      || fields === "gpa"){
      continue
    }
    if(student[fields] === ""){
      return true
    }
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
      const f_in = fs.readFileSync(file.path, 'utf-8')
      let isValid = true;
      Papa.parse(f_in, {
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
            isValid = false
            console.log('invalid csv')
            res.status(500).send("Cannot parse CSV file - headers do not match specifications")
            return
          }
          uploadStudents(results)
        }
      })
      if (isValid)
        res.status(200).send("Success")
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
        id: student.sbuId
      }
      let token = jwt.sign(userData, process.env.JWT_KEY, {
        algorithm: process.env.JWT_ALGO,
        expiresIn: 1200 // Expires in 20 minutes
      });
      res.send(token);
    }).catch(err => {
      res.status(500).send("Invalid login credentials");
    })
}

// Find a Student 
exports.findById = (req, res) => {
  Student.findById(req.params.sbuId).then(student => {
    res.send(student);
  }).catch(err => {
    res.status(500).send("Error: " + err);
  })
}

exports.filter = (req, res) => {
  Student.findAll({
    where: {
      firstName: { [Op.like]: req.query.firstName },
      lastName: { [Op.like]: req.query.lastName },
      sbuId: { [Op.like]: req.query.sbuId},
      entrySem: { [Op.like]: req.query.entrySem },
      entryYear: { [Op.like]: req.query.entryYear },
      department: { [Op.like]: req.query.degree },
      gradSem: { [Op.like]: req.query.gradSem },
      gradYear: { [Op.like]: req.query.gradYear },
      graduated: { [Op.like]: req.query.graduated }
    }
  }).then(students => {
    res.send(students);
  }).catch(err => {
    res.status(500).send("Error: " + err);
  })
}

// Find all Students 
exports.findAll = (req, res) => {
  Student.findAll().then(students => {
    res.send(students);
  }).catch(err => {
    res.status(500).send("Error: " + err);
  })
}

// Delete a Student
exports.delete = (req, res) => {
  Student.destroy({ where: { sbuId: req.params.sbuId } }).then(() => {
    res.status(200).send("Student deleted!");
  }).catch(err => {
    res.status(500).send("Error: " + err);
  })
}

// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/


// Delete all students from database. Used primarly for testing by GPD
exports.deleteAll = (req, res) => {
  Student.drop().then(() => {
    res.status(200).send("Deleted student data.");
    database.sequelize.sync({ force: false }).then(() => {
      console.log("Synced database");
    })
  }).catch(err => {
    console.log("Error" + err)
    res.status(500).send("Error: " + err);
  })
}



async function uploadStudents(csv_file) {
  const degrees = await Degree.findAll()
  let degree_dict = {};
  const currentGradYear = 202101
  for (let i = 0; i < degrees.length; i++) {
    degree_dict[degrees[i].dept + " " + degrees[i].track] = degrees[i].degreeId
  }
  let tot = 0;
  for (let i = 0; i < csv_file.data.length - 1; i++) {
    student_info = csv_file.data[i]
    let sems_dict = { 'Spring': '02', 'Summer': '06', 'Fall': '08', 'Winter': '01' };
    let semYear = Number(student_info.entry_year + sems_dict[student_info.entry_semester])
    let graduated = Number(student_info.graduation_year + sems_dict[student_info.graduation_semester]) <= currentGradYear ? 1 : 0
    const condition = { sbuId: student_info.sbu_id }
    const values = {
      sbuId: student_info.sbu_id,
      firstName: student_info.first_name,
      lastName: student_info.last_name,
      email: student_info.email,
      password: student_info.password,
      gpa: student_info.gpa,
      entrySem: student_info.entry_semester,
      entryYear: student_info.entry_year,
      entrySemYear: semYear,
      gradSem: student_info.graduation_semester,
      gradYear: student_info.graduation_year,
      department: student_info.department,
      degreeId: degree_dict[student_info.department + " " + student_info.track],
      graduated: graduated,
      gpdComments: "",
      studentComments: ""
    }
    tot += 1
    const found = await Student.findOne({ where: condition })
    if (found)
      //console.log(condition)
      await Student.update(values, { where: condition })
    else
      await Student.create(values)
  }
  console.log("Done importing " + tot + " students from csv")
  return true
}