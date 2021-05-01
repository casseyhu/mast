
module.exports = function (app) {
  const CoursePlan = require('../controller/coursePlanController.js')
  const Suggest = require('../controller/suggestController.js')

  // Upload student course plans from CSV file
  app.post('/api/courseplan/upload', CoursePlan.uploadPlans)

  app.get('/api/courseplanitem/findItems', CoursePlan.findItems)

  app.get('/api/courseplanitem/count', CoursePlan.count)

  app.post('/api/courseplanitem/update', CoursePlan.updateItem)

  app.post('/api/courseplanitem/deleteItem', CoursePlan.deleteItem)

  app.get('/api/suggest', Suggest.suggest)

  app.get('/api/smartsuggest', Suggest.smartSuggest)

  app.post('/api/courseplanitem/addsuggestion', CoursePlan.addSuggestion)

  app.post('/api/courseplan/accept', CoursePlan.accept)
}