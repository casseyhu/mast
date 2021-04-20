
module.exports = function (app) {
  const CoursePlan = require('../controller/coursePlanController.js')
  const Suggest = require('../controller/suggestController.js')

  // Upload student course plans from CSV file
  app.post('/api/courseplan/upload', CoursePlan.uploadPlans)

  app.get('/api/courseplanitem/findItems', CoursePlan.findItems)

  app.get('/api/courseplanitem/count', CoursePlan.count)

  app.get('/api/suggest', Suggest.suggest)

  app.get('/api/smartsuggest', Suggest.smartSuggest)
}