
module.exports = function (app) {
  const Course = require('../controller/courseController.js');

  // Upload course information
  app.post('/api/course/upload', Course.upload);

}