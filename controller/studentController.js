const { IncomingForm } = require('formidable')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Papa = require('papaparse')

const { SEMDICT, TRACKS, currSem, currYear, SEMTONUM } = require('./constants')
const { updateOrCreate, findRequirements, findCoursePlanItems, checkPrereq, titleCase } = require('./shared')

const coursePlanController = require('./coursePlanController')
const database = require('../config/database.js')
const Op = database.Sequelize.Op

const Student = database.Student
const CoursePlan = database.CoursePlan
const CoursePlanItem = database.CoursePlanItem

const Degree = database.Degree
const RequirementState = database.RequirementState


/**
 * Create a student to the database based on the fields that were given.
 * @param {*} req Contains information (i.e. name, id, degree, ...) about the student.
 * @param {*} res 
 */
exports.create = (req, res) => {
  const student = req.body.params
  if (emptyFields(student)) {
    let errMsg = 'Error in adding student. Please check that all necessary student information are filled out.'
    res.status(500).send(errMsg)
    return
  }
  let requirementVersion = Number(student.degreeYear + SEMDICT[student.degreeSem])
  Degree
    .findOne({
      where: {
        dept: student.dept.toUpperCase(),
        track: titleCase(student.track),
        requirementVersion: requirementVersion
      }
    })
    .then(degree => {
      if (!degree) {
        // No degree + track + requirement version was found in the DB. 
        res.status(500).send('Degree requirement version does not exist.')
        return
      }
      addStudent(student, degree, res)
    })
    .catch(err => res.status(500).send('Error getting degree'))
}


/**
 * Update a currently existing student's information in the database.
 * @param {*} req Contains information (i.e. name, id, degree,...) about the student.
 * @param {*} res 
 */
exports.update = async (req, res) => {
  const student = req.body.params
  if (emptyFields(student)) {
    console.log('Fields are empty')
    let errMsg = 'Error in updating student. Please check that all necessary student information are filled out.'
    res.status(500).send(errMsg)
    return
  }
  let requirementVersion = Number(student.degreeYear + SEMDICT[student.degreeSem])
  try {
    const degree = await Degree.findOne({
      where: {
        dept: student.dept,
        track: titleCase(student.track),
        requirementVersion: requirementVersion
      }
    })
    if (!degree) {
      // No degree + track + requirement version was found in the DB. 
      res.status(500).send('Degree requirement version does not exist.')
      return
    }
    if (!checkFields(student, res))
      return

    // Update student information based on student id
    const value = {
      sbuId: student.sbuId,
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      gpa: student.gpa,
      entrySem: student.entrySem,
      entryYear: Number(student.entryYear),
      entrySemYear: Number(student.entryYear.concat(SEMDICT[student.entrySem])),
      gradSem: student.gradSem,
      gradYear: Number(student.gradYear),
      department: student.dept.toUpperCase(),
      track: titleCase(student.track),
      requirementVersion: requirementVersion,
      degreeId: degree.degreeId,
      graduated: student.graduated === 'True',
      gpdComments: student.gpdComments,
      studentComments: student.studentComments
    }
    // Update the student
    await Student.update(value, {
      where: {
        sbuId: student.sbuId
      }
    })
    // Recalculate completion
    await RequirementState.destroy({ where: { sbuId: student.sbuId } })
    let coursePlan = await CoursePlan.findOne({ where: { studentId: student.sbuId } })
    let studentsPlanId = {}
    studentsPlanId[student.sbuId] = coursePlan.coursePlanId
    await coursePlanController.changeCompletion(studentsPlanId, student.dept, null)
    const updatedStudent = await Student.findOne({
      where: {
        sbuId: student.sbuId
      }
    })
    res.status(200).send(updatedStudent)
  } catch (err) {
    console.log(err)
    errMsg = 'Error in updating student. Please check student information type (i.e. SBUID must be numbers 0-9).'
    if (err.parent && err.parent.code !== undefined && err.parent.code === 'ER_DUP_ENTRY')
      errMsg = 'Student with ID: ' + student.sbuId + ' exists already.'
    res.status(500).send(errMsg)
    return
  }
}


/**
 * Checks if any required field for a student are empty.
 * @param {*} student contains all information about the student.
 * @returns {Boolean} returns true if any of the required fields are empty, else return false.
 */
function emptyFields(student) {
  for (let field of Object.keys(student)) {
    if (field === 'studentComments' || field === 'gpdComments' ||
      field === 'gpa' || field === 'graduated' || field === 'degreeSem' ||
      field === 'degreeYear' || field === 'updatedAt')
      continue
    if (student[field] === '')
      return true
  }
  return false
}


/**
 * Uploads students' profiles which contains their information in a CSV file. 
 * @param {*} req Contains a FormData that has a department field, which is used to 
 * upload students' profiles for that specified department.
 * @param {*} res 
 */
exports.upload = (req, res) => {
  let form = new IncomingForm()
  let dept = ''
  form
    .parse(req)
    .on('field', (name, field) => {
      if (name === 'dept')
        dept = field
    })
    .on('file', (field, file) => {
      if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
        res.status(500).send('File must be *.csv')
        return
      }
      const fileIn = fs.readFileSync(file.path, 'utf-8')
      Papa.parse(fileIn, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          var header = results.meta['fields']
          if (header[0] !== 'sbu_id' || header[1] !== 'first_name' ||
            header[2] !== 'last_name' || header[3] !== 'email' ||
            header[4] !== 'department' || header[5] !== 'track' ||
            header[6] !== 'entry_semester' || header[7] !== 'entry_year' ||
            header[8] !== 'requirement_version_semester' ||
            header[9] !== 'requirement_version_year' || header[12] !== 'password' ||
            header[10] !== 'graduation_semester' || header[11] !== 'graduation_year') {
            console.log('invalid csv')
            res.status(500).send('Cannot parse CSV file - headers do not match specifications')
            return
          }
          let students = results.data.filter(student => student.department.toUpperCase() === dept)
          uploadStudents(students, res)
        }
      })
    })
}


/**
 * Handles the login transaction for students.
 * @param {*} req Contains information (i.e email, password), which is used to find
 * a result that matches from the database.
 * @param {*} res 
 */
exports.login = (req, res) => {
  Student
    .findOne({ where: { email: req.query.email } })
    .then(student => {
      const isValidPass = bcrypt.compareSync(req.query.password, student.password)
      if (!isValidPass)
        throw 'Invalid'
      let userData = {
        type: 'student',
        id: student.sbuId,
        userInfo: student
      }
      let token = jwt.sign(userData, process.env.JWT_KEY, {
        algorithm: process.env.JWT_ALGO,
        expiresIn: 1200 // Expires in 20 minutes
      })
      res.status(200).send([token, student])
    })
    .catch(err => res.status(500).send('Invalid login credentials'))
}


/**
 * Attempts to find a student from the database based on the student's id.
 * @param {*} req Contains information (i.e student's id) to find a student in 
 * the database.
 * @param {*} res 
 */
exports.findById = (req, res) => {
  Student
    .findByPk(req.params.sbuId)
    .then(student => res.status(200).send(student))
    .catch(err => res.status(500).send('Error: ' + err))
}


/**
 * Filters the students in the database based on conditions (name or student's id) that are partial or complete.
 * @param {*} req Contains partial or complete information of the name or student id, which is used to match
 * for all results that starts with those conditions in any order.
 * @param {*} res 
 */
exports.filter = (req, res) => {
  let info = req.query.nameId.replace(/\s+/g, ' ').trim().split(' ')
  let filters = null
  if (info.length == 1)
    filters = {
      [Op.or]: [
        { firstName: { [Op.like]: info[0] + '%' } },
        { lastName: { [Op.like]: info[0] + '%' } },
        { sbuId: { [Op.like]: info[0] + '%' } }
      ]
    }
  else if (info.length == 2)
    filters = {
      [Op.or]: [
        { [Op.and]: [{ firstName: { [Op.like]: info[0] + '%' } }, { lastName: { [Op.like]: info[1] + '%' } }] },
        { [Op.and]: [{ lastName: { [Op.like]: info[0] + '%' } }, { firstName: { [Op.like]: info[1] + '%' } }] },
        { [Op.and]: [{ firstName: { [Op.like]: info[0] + '%' } }, { sbuId: { [Op.like]: info[1] + '%' } }] },
        { [Op.and]: [{ sbuId: { [Op.like]: info[0] + '%' } }, { firstName: { [Op.like]: info[1] + '%' } }] },
        { [Op.and]: [{ lastName: { [Op.like]: info[0] + '%' } }, { sbuId: { [Op.like]: info[1] + '%' } }] },
        { [Op.and]: [{ sbuId: { [Op.like]: info[0] + '%' } }, { lastName: { [Op.like]: info[1] + '%' } }] }
      ]
    }
  else
    filters = {
      [Op.or]: [
        { [Op.and]: [{ firstName: { [Op.like]: info[0] + '%' } }, { lastName: { [Op.like]: info[1] + '%' } }, { sbuId: { [Op.like]: info[2] + '%' } }] },
        { [Op.and]: [{ firstName: { [Op.like]: info[0] + '%' } }, { sbuId: { [Op.like]: info[1] + '%' } }, { lastName: { [Op.like]: info[2] + '%' } }] },
        { [Op.and]: [{ lastName: { [Op.like]: info[0] + '%' } }, { firstName: { [Op.like]: info[1] + '%' } }, { sbuId: { [Op.like]: info[2] + '%' } }] },
        { [Op.and]: [{ lastName: { [Op.like]: info[0] + '%' } }, { sbuId: { [Op.like]: info[1] + '%' } }, { firstName: { [Op.like]: info[2] + '%' } }] },
        { [Op.and]: [{ sbuId: { [Op.like]: info[0] + '%' } }, { firstName: { [Op.like]: info[1] + '%' } }, { lastName: { [Op.like]: info[2] + '%' } }] },
        { [Op.and]: [{ sbuId: { [Op.like]: info[0] + '%' } }, { lastName: { [Op.like]: info[1] + '%' } }, { firstName: { [Op.like]: info[1] + '%' } }] }
      ]
    }
  Student
    .findAll({
      where: {
        [Op.and]: filters,
        department: { [Op.like]: req.query.department },
        entrySem: { [Op.like]: req.query.entrySem },
        entryYear: { [Op.like]: req.query.entryYear },
        track: { [Op.like]: req.query.track },
        gradSem: { [Op.like]: req.query.gradSem },
        gradYear: { [Op.like]: req.query.gradYear },
        graduated: { [Op.like]: req.query.graduated }
      }
    })
    .then(students => {
      // Filter these `students` by CP Completeness and CP Validity, if the query was given. 
      if (req.query.complete === '%' && req.query.valid === '%') {
        // If complete && valid queries were not given (user didn't apply this filter)...
        res.send(students)
      }
      else {
        console.log('Completeness or filter query was provided. Filtering...')
        console.log('Complete: ', req.query.complete, ' Valid: ', req.query.valid)
        // ... Else, query the CoursePlans for the `filteredStudents` based on the which
        // conditions were set (valid, complete, or valid&&complete). 
        let complete = -1
        if (req.query.complete !== '%')
          complete = req.query.complete === '1%' ? 1 : 0
        let valid = -1
        if (req.query.valid !== '%')
          valid = req.query.valid === '1%' ? 1 : 0
        // Now, filter the `students` on `complete` and/or `valid'
        let studentIds = students.map(student => student.sbuId)
        let condition = {}
        if (valid !== -1 && complete !== -1)
          condition = {
            [Op.and]: [
              { studentId: studentIds },
              { coursePlanComplete: complete },
              { coursePlanValid: valid }
            ]
          }
        else if (complete !== -1)
          condition = {
            [Op.and]: [
              { studentId: studentIds },
              { coursePlanComplete: complete }
            ]
          }
        else if (valid !== -1)
          condition = {
            [Op.and]: [
              { studentId: studentIds },
              { coursePlanValid: valid }
            ]
          }
        CoursePlan
          .findAll({ where: condition })
          .then(coursePlans => {
            // After filtering the already-filtered students by [completeness and valid]...
            // Only return the students who matched the completeness/valid queries. 
            let filteredStudentIds = coursePlans.map(coursePlan => coursePlan.studentId)
            students = students.filter(student => filteredStudentIds.includes(student.sbuId))
            console.log('C/V Filtered students: ', students.length)
            res.status(200).send(students)
          })
          .catch(err => {
            console.log(err)
            res.status(200).send(students)
          })
      }
    })
    .catch(err => {
      // If an error happens when filtering, we return 'Error: ' + err. This will crash
      // the program when we get back to the Browse.jsx and it tries to show the 
      // 'filtered students'
      res.status(500).send('Error: ' + err)
    })
}


/**
 * Finds all students that are in the department.
 * @param {*} req Contains information (i.e department), which is used to find all
 * all students from the department in the database.
 * @param {*} res 
 */
exports.findAll = (req, res) => {
  Student
    .findAll({
      where: {
        department: req.query.department
      }
    })
    .then(students => res.status(200).send(students))
    .catch(err => res.status(500).send('Error: ' + err))
}


/**
 * Delete all students from the database as well as all information that exist about the students
 * (i.e CoursePlan, CoursePlanItem, RequirementStates).
 * @param {*} req
 * @param {*} res 
 */
exports.deleteAll = async (req, res) => {
  try {
    await Student.drop()
    await CoursePlanItem.drop()
    await CoursePlan.drop()
    await RequirementState.drop()
    await database.sequelize.sync({
      force: false
    })
    console.log('Synced database')
    res.status(200).send('Deleted student data')
  } catch (err) {
    await database.sequelize.sync({
      force: false
    })
    console.log('Delete student data error' + err)
    res.status(500).send('Error: ' + err)
  }
}


/**
 * Get the requirement state of the student based on their student id.
 * @param {*} req Contains information (i.e student's id), which is used to find all
 * requirement states based on the student's id.
 * @param {*} res 
 */
exports.getStates = (req, res) => {
  RequirementState
    .findAll({
      where: {
        sbuID: req.query.sbuId
      }
    })
    .then(reqStates => res.status(200).send(reqStates))
    .catch(err => res.status(500).send('Error ' + err))
}


/**
 * Checks if a student has satisfied the prerequisites to a course.
 * @param {*} req Contains information (sbuId, course, ...) which is used to find
 * the student's course plan items and for the course's prerequisites.
 * @param {*} res 
 */
exports.checkPrerequisites = async (req, res) => {
  // Get student's course plan, and get their taken and current courses.
  try {
    console.log(req.query)
    let cpItems = await findCoursePlanItems(req.query.sbuId)
    const takenAndCurrent = cpItems.filter(course => (
      (course.year < currYear) ||
      ((course.year === currYear) && (SEMTONUM[course.semester] <= SEMTONUM[currSem]))
    ))
    const takenAndCurrentCourses = new Set(takenAndCurrent.map(course => course.courseId))
    let unsatisfiedPrereqs = checkPrereq(JSON.parse(req.query.course), takenAndCurrentCourses, true)
    res.status(200).send(unsatisfiedPrereqs)
  } catch(err) {
    console.log(err)
    res.status(500).send('Error in checking prerequisites for add course.')
  }
}


/**
 * Adds a course to a student's course plan items. 
 * @param {*} req Contains information (i.e student's id), which is used to find the
 * course plan for the student, to add the new course to. 
 * @param {*} res 
 * @returns 
 */
exports.addCourse = async (req, res) => {
  let query = req.body.params
  // Find student's courseplanId by getting their coursePlan first.
  let coursePlan = await CoursePlan.findOne({
    where: {
      studentId: query.sbuId
    }
  })
  // Insert the course into the student's courseplanitems. 
  let insert = await CoursePlanItem.create({
    coursePlanId: coursePlan.coursePlanId,
    courseId: query.course.courseId,
    semester: query.semester,
    year: query.year,
    section: null,
    grade: null,
    // Since null section, assume no conflicts, so validity = 1.
    // Status = 0 bc not taken yet. 
    validity: true,
    status: true
  })
  console.log(insert)
  if (insert) {
    // Send the courseplan items back to the front end.
    let cpItems = await findCoursePlanItems(query.sbuId)
    // console.log(cpItems)
    res.status(200).send(cpItems)
  }
  else 
    res.status(500).send('Unable to add course to course plan.')
}


/**
 * Helper function to uploading students' profiles based on a given department.
 * @param {Array<Object>} students List of all students in a given department from the CSV.
 * @param {*} res 
 */
async function uploadStudents(students, res) {
  const degrees = await Degree.findAll()
  let degreeDict = {}
  const monthsDict = {
    '01': 'Winter',
    '02': 'Spring',
    '05': 'Summer',
    '08': 'Fall'
  }
  const currentGradYear = 202101
  for (let i = 0; i < degrees.length; i++) {
    let requirementVersion = degrees[i].requirementVersion.toString()
    let requirementSem = monthsDict[requirementVersion.substring(4, 6)]
    let requirementYear = requirementVersion.substring(0, 4)
    degreeDict[degrees[i].dept + ' ' + degrees[i].track + ' ' + requirementSem + ' ' + requirementYear] = degrees[i].degreeId
  }
  let tot = 0
  for (let i = 0; i < students.length; i++) {
    studentInfo = students[i]
    let semYear = Number(studentInfo.entry_year + SEMDICT[studentInfo.entry_semester])
    let graduated = Number(studentInfo.graduation_year + SEMDICT[studentInfo.graduation_semester]) <= currentGradYear ? 1 : 0
    let requirementVersion = Number(studentInfo.requirement_version_year + SEMDICT[studentInfo.requirement_version_semester])
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
      department: studentInfo.department.toUpperCase(),
      track: titleCase(studentInfo.track),
      requirementVersion: requirementVersion,
      satisfied: 0,
      unsatisfied: 0,
      pending: 0,
      degreeId: degreeDict[studentInfo.department.toUpperCase() + ' ' + titleCase(studentInfo.track) + ' '
        + studentInfo.requirement_version_semester + ' ' + studentInfo.requirement_version_year],
      graduated: graduated,
      gpdComments: '',
      studentComments: ''
    }
    if (!checkFields(values, null)) {
      console.log("invalid stuednt")
      continue
    }
    tot += 1
    await updateOrCreate(Student, { sbuId: studentInfo.sbu_id }, values, true, true)
    values = {
      studentId: studentInfo.sbu_id,
      coursePlanComplete: false,
      coursePlanValid: false
    }
    await updateOrCreate(CoursePlan, { studentId: studentInfo.sbu_id }, values, false, true)
  }
  console.log('Done importing ' + tot + ' students from csv')
  res.status(200).send('Success')
}


/**
 * Checks to make sure all the fields that were entered are valid entries.
 * @param {Object} student contains all necessary information about the student.
 * @param {*} res
 * @returns {Boolean} returns true if all conditions are satisfied, else return false.
 */
function checkFields(student, res) {
  // Check for valid graduation date. If EntryDate == GradDate, it's valid for now.
  let gradDate = Number(student.gradYear + SEMDICT[student.gradSem])
  let entryDate = Number(student.entryYear + SEMDICT[student.entrySem])
  let degreeVersion = Number(student.degreeYear + SEMDICT[student.degreeSem])
  if (gradDate < entryDate) {
    if (res) res.status(500).send('Graduation date cannot be earlier than entry date.')
    return false
  }
  if (degreeVersion < entryDate) {
    if (res) res.status(500).send('Degree version cannot be earlier than entry date.')
    return false
  }
  if (degreeVersion > gradDate) {
    if (res) res.status(500).send('Degree version cannot be later than graduation date.')
    return false
  }
  // Check for proper 9-digit SBUID
  let regex = /^\d{9}$/
  if (!regex.test(student.sbuId.toString())) {
    if (res) res.status(500).send('SBUID must be a 9-digit string of numbers 0-9.')
    return false
  }
  // Check for proper .edu email address
  regex = /^\w+@\w+\.edu$/
  if (!regex.test(student.email)) {
    if (res) res.status(500).send('Student must have a valid .edu email.')
    return false
  }
  // Check valid track for degree
  if (!TRACKS[student.department].includes(student.track)) {
    if (res) res.status(500).send('Invalid degree track.')
    return false
  }
  return true
}


/**
 * Attempts to add/create the student to the database.
 * @param {Object} student Information about the student to be added to the database
 * if all criterias are met.
 * @param {Object} degree Used to find requirements for the degree
 * @param {*} res 
 */
async function addStudent(student, degree, res) {
  if (!checkFields(student, res))
    return
  // Hash the password for the student. (first init + last init + sbuid)
  let password = student.firstName.charAt(0).toLowerCase() + student.lastName.charAt(0).toLowerCase() + student.sbuId
  let salt = bcrypt.genSaltSync(10)
  let hashPassword = bcrypt.hashSync(password, salt)

  // Get number of degree requirements and set initial state of each requirement to unsatisfied
  let requiredRequirements = []
  const [gradeReq, gpaReq, creditReq, courseReq] = await findRequirements(degree)
  if (gradeReq)
    requiredRequirements.push('GR' + gradeReq.requirementId)
  if (gpaReq)
    requiredRequirements.push('G' + gpaReq.requirementId)
  if (creditReq)
    requiredRequirements.push('CR' + creditReq.requirementId)
  for (let req of courseReq)
    if (req.type !== 0)
      requiredRequirements.push('C' + req.requirementId)

  // Tries to create the student with all fields. 
  let addedStudent = await Student.create({
    sbuId: student.sbuId,
    email: student.email,
    firstName: student.firstName,
    lastName: student.lastName,
    password: hashPassword,
    gpa: null,
    entrySem: student.entrySem,
    entryYear: Number(student.entryYear),
    entrySemYear: Number(student.entryYear.concat(SEMDICT[student.entrySem])),
    gradSem: student.gradSem,
    gradYear: Number(student.gradYear),
    department: student.dept,
    track: titleCase(student.track),
    requirementVersion: degree.requirementVersion,
    satisfied: 0,
    unsatisfied: requiredRequirements.length,
    pending: 0,
    degreeId: degree.degreeId,
    graduated: 0,
    gpdComments: student.gpdComments,
    studentComments: student.studentComments
  })
  if (!addedStudent) {
    errMsg = 'Error in adding student. Please check student information type (i.e. SBUID must be numbers 0-9).'
    if (err.parent.code !== undefined && err.parent.code === 'ER_DUP_ENTRY')
      errMsg = 'Student with ID: ' + student.sbuId + ' exists already.'
    res.status(500).send(errMsg)
    return
  }
  let studentCoursePlan = await CoursePlan.create({
    studentId: student.sbuId,
    coursePlanComplete: false,
    coursePlanValid: false
  })
  if (!studentCoursePlan) {
    res.status(500).send('Error creating student course plan.')
    return
  }
  for (let req of requiredRequirements) {
    await RequirementState.create({
      sbuID: student.sbuId,
      requirementId: req,
      state: 'unsatisfied',
      metaData: []
    })
  }
  res.status(200).send(addedStudent)
}