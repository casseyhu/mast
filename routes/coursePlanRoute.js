
module.exports = function (app) {
  const CoursePlan = require('../controller/coursePlanController.js');

  // Create new course plan
  app.post('/api/courseplan/create', CoursePlan.createPlan);

  // Upload student course plans from CSV file
  app.post('/api/courseplan/upload', CoursePlan.uploadPlans);

  app.get('/api/courseplanitem/findItem', CoursePlan.findItems);
}