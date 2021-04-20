
module.exports = function (app) {
  const Degree = require('../controller/degreeController.js')

  // Upload degree
  app.post('/api/degree/upload', Degree.upload)

  // Find requirements for a degree
  app.get('/api/requirements', Degree.findRequirements)

  app.get('/api/newStudentRequirements', Degree.newStudentRequirements)

}