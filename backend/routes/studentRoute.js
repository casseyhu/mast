
module.exports = function (app) {
  const Student = require('../controller/studentController.js');

  // Create a Student
  app.post('/api/student/create', Student.create);
  
  // Create all students from file
  app.post('/api/student/upload', Student.upload);

  // Verify student login
  app.get('/api/student/login', Student.login);

  // Get a Student
  app.get('/api/student/:sbuId', Student.findById);

  // Get all students
  app.get('/api/student', Student.findAll);

  // Delete a student
  app.delete('/api/student/:sbuId', Student.delete)

  // Delete all students
  app.post('/api/student/deleteall', Student.deleteAll)
} 