

const shared = require('./shared')
const database = require('../config/database.js')
const course = require('../models/course')

const Student = database.Student
const Degree = database.Degree
const Course = database.Course


exports.suggest = async (req, res) => {
  console.log('Regular suggest')
  const student = await Student.findOne({ where: { sbuId: 111623150 } })
  const degree = await Degree.findOne({ where: { degreeId: student.degreeId } })
  let [gradeReq, gpaReq, creditReq, courseReq] = await shared.findRequirements(degree)
  const courses = await Course.findAll({ where: { department: student.department } })
  let credits = {}
  courses.forEach(course => credits[course.courseId] = course.credits)
  console.log(gradeReq)
  console.log(gpaReq)
  console.log(creditReq)
  console.log(courseReq)
  res.status(200).send('good')
}


exports.smartSuggest = (req, res) => {
  console.log('Smart suggest')
  res.status(200).send('good')
}

