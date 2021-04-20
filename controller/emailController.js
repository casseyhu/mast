const nodemailer = require('nodemailer')

/**
 * Sends emails to specified students. 
 * The subject and the body of the email can be specified.
 * @param {*} req Contains a FormData containing the email address of students, 
 * the subject of the email, and the body of the email.
 * @param {*} res
 */
exports.send = (req, res) => {
  // Set up the sender's email account
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    ssl: true,
    auth: {
      user: 'mastgrassjelly@gmail.com',
      pass: 'cse416@stoller'
    }
  })
  // Set the receiver and the content of the email
  const mail = {
    from: 'mastgrassjelly@gmail.com',
    to: req.body.params.email,
    subject: req.body.params.subject,
    html: req.body.params.text + '<br /><img src=\'cid:wolfie.gif\'/>',
    attachments: [{
      filename: 'wolfie.gif',
      path: './client/public/images/wolfie.gif',
      cid: 'wolfie.gif'
    }]
  }
  // Send email to students
  transporter.sendMail(mail, (err, data) => {
    if (err) {
      console.log(err)
      res.status(500).send('Failed to send email')
    }
    else
      res.status(200).send('Successfully sent email')
  })
}
