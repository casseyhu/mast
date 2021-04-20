
module.exports = function (app) {
  const CoursePlan = require('../controller/coursePlanController.js')

  // Upload student course plans from CSV file
  app.post('/api/courseplan/upload', CoursePlan.uploadPlans)

  app.get('/api/courseplanitem/findItems', CoursePlan.findItems)

  app.get('/api/courseplan/findAll', CoursePlan.findAll)

  app.get('/api/courseplanitem/count', CoursePlan.count)

}