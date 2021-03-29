
module.exports = function (app) {
  const Degree = require('../controller/degreeController.js');

  // Upload degree
  app.post('/api/degree/upload', Degree.upload);

  // Get all degrees
  app.get('/api/degree', Degree.findAll);

  // // Create new grade requirement object
  // app.post('/api/degree/gradereq/create', Degree.createGrade);

  // // Create new gpa requirement object
  // app.post('/api/degree/gpareq/create', Degree.createGpa);

  // // Create new credit requirement object
  // app.post('/api/degree/creditreq/create', Degree.createCredit);

  // // Create new course requirement object
  // app.post('/api/degree/coursereq/create', Degree.createCourse);
}