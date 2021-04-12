const nodemailer = require('nodemailer')

exports.send = (req, res, next) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    ssl: true,
    auth: {
      user: 'mastgrassjelly@gmail.com',
      pass: 'cse416@stoller'
    }
  })
  const mail = {
    from: 'mastgrassjelly@gmail.com',
    to: req.body.params.email,
    subject: req.body.params.subject,
    html: req.body.params.text + '<br /><img src="cid:doggoontreadmill.gif"/>',
    attachments: [{
      filename: 'doggoontreadmill.gif',
      path: './client/public/images/doggo.gif',
      cid: 'doggoontreadmill.gif'
    }]
  }
  transporter.sendMail(mail, (err, data) => {
    if (err) {
      console.log(err)
      res.status(500).send('Failed to send email')
    }
    else
      res.status(200).send('Successfully sent email')
  })
}
