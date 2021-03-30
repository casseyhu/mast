
module.exports = function (app) {
  const Degree = require('../controller/degreeController.js');

  // Upload degree
  app.post('/api/degree/upload', Degree.upload);

  // Find a degree
  app.get('/api/degree', Degree.findOne);

  // Find a degree
  app.get('/api/requirements', Degree.findRequirements);

  // Get all degrees
  app.get('/api/degrees', Degree.findAll);

}