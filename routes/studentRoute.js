
module.exports = function (app) {
  const Student = require('../controller/studentController.js')

  // Verify student login
  app.get('/api/student/login', Student.login)

  // Upload all students from CSV file
  app.post('/api/student/upload', Student.upload)

  // Create a Student from Add Student 
  app.post('/api/student/create', Student.create)

  // Update student's field based on id
  app.post('/api/student/update', Student.update)

  // Adds a course to student's course plan
  app.post('/api/student/addCourse', Student.addCourse)

  // Get all students by filtered conditions
  app.get('/api/student/filter', Student.filter)

  // Get student requirement states
  app.get('/api/student/requirementStates', Student.getStates)

  // Check if student has grades for a semester + year
  app.get('/api/student/checkGradedSem', Student.checkGradedSem)

  // Checks if specific course exists in course plan at sem + year
  app.get('/api/student/checkCourse', Student.checkCourse)

  // Check if student has satisfied prereqs for a course 
  app.get('/api/student/checkPrerequisites', Student.checkPrerequisites)

  // Get a Student
  app.get('/api/student/:sbuId', Student.findById)

  // Get all students
  app.get('/api/student', Student.findAll)

  // Delete all students
  app.post('/api/student/deleteAll', Student.deleteAll)

}