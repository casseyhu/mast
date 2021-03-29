
module.exports = function (app) {
  const CoursePlan = require('../controller/coursePlanController.js');

  // Create new course plan
  app.post('/api/courseplan/create', CoursePlan.createPlan);

  // Create all courses from file
  app.post('/api/courseplan/upload', CoursePlan.upload);

  // Create new course plan item
  app.post('/api/courseplanitem/create', CoursePlan.createItem);
}