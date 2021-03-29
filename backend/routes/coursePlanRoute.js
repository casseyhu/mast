
module.exports = function (app) {
  const CoursePlan = require('../controller/coursePlanController.js');

  // Create new course plan
  app.post('/api/courseplan/create', CoursePlan.createPlan);

  // Create all courses from file
  app.post('/api/courseplan/upload', CoursePlan.uploadPlans);

  //find all course plans
  app.get('/api/courseplan', CoursePlan.findAll);

  // Create new course plan item
  app.post('/api/courseplanitem/create', CoursePlan.createItem);

  app.post('/api/courseplanitem/upload', CoursePlan.uploadPlans);

  app.get('/api/courseplanitem/findItem', CoursePlan.findItems);
}