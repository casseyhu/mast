
module.exports = function (app) {
  const gpd = require('../controller/gpdController.js')

  // Verify GPD login
  app.get('/api/gpd/login', gpd.login)
}