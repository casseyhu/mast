
module.exports = function (app) {
  const Student = require('../controller/studentController.js');

  // Create a Student from Add Student 
  app.post('/api/student/create', Student.create);

  //Update student's field based on id
  app.post('/api/student/update', Student.update)

  // Upload all students from CSV file
  app.post('/api/student/upload', Student.upload);

  // Verify student login
  app.get('/api/student/login', Student.login);

  // Get all students by filtered conditions
  app.get('/api/student/filter', Student.filter);

  // Get a Student
  app.get('/api/student/:sbuId', Student.findById);

  // Get all students
  app.get('/api/student', Student.findAll);

  // Delete a student
  app.delete('/api/student/:sbuId', Student.delete)

  // Delete all students
  app.post('/api/student/deleteall', Student.deleteAll)
}