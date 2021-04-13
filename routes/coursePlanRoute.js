
module.exports = function (app) {
  const CoursePlan = require('../controller/coursePlanController.js');

  // Upload student course plans from CSV file
  app.post('/api/courseplan/upload', CoursePlan.uploadPlans);

  app.get('/api/courseplanitem/findItems', CoursePlan.findItems);

  app.get('/api/courseplan/findAll', CoursePlan.findAll);

  app.get('/api/courseplan/filterCompleteValid', CoursePlan.filterCV);

  app.get('/api/courseplanitem/count', CoursePlan.count);

  app.post('/api/courseplan/deleteAll', CoursePlan.deleteAll);

}