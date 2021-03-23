
module.exports = function (app) {
  const CoursePlan = require('../controller/coursePlanController.js');

  // Create new course plan
  app.post('/api/courseplan/create', CoursePlan.createPlan);

  // Create new course plan item
  app.post('/api/courseplanitem/create', CoursePlan.createItem);
}