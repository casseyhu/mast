
module.exports = function(app) {
    const Student = require('../controller/student.controller.js');

    // Create a Student
    app.post('/api/student/create', Student.create);

    // Get a Student
    app.get('/api/student/:sbuId', Student.findById);

    // Get all students
    app.get('/api/student', Student.findAll);

    // Delete a student
    app.delete('/api/student/:gpdId', Student.delete)
}