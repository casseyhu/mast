
module.exports = function (app) {
  const CourseOffering = require('../controller/courseOfferingController.js')

  // Upload course offering information
  app.post('/api/courseoffering/upload', CourseOffering.upload)

}