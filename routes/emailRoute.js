module.exports = function (app) {
  const Email = require('../controller/emailController.js')

  // Send email
  app.post('/api/email/send', Email.send)

}