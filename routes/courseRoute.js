
module.exports = function (app) {
  const Course = require('../controller/courseController.js')

  // Upload course information
  app.post('/api/course/upload', Course.upload)

  app.get('/api/course/findOne', Course.findOne)

  app.get('/api/course/deptCourses', Course.getDeptCourses)

  app.get('/api/course/findSections', Course.findSections)
  
  app.get('/api/course', Course.findAll)

}