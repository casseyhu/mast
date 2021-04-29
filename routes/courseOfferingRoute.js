
module.exports = function (app) {
  const CourseOffering = require('../controller/courseOfferingController.js')

  // Upload course offering information
  app.post('/api/courseoffering/upload', CourseOffering.upload)

  // Finds all the course offerings for a given course
  app.get('/api/courseoffering/findOne', CourseOffering.findOne)

}