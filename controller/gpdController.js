const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const database = require('../config/database.js')

const Gpd = database.Gpd

// Find a GPD 
// exports.findById = (req, res) => {
//     GPD.findById(req.params.gpdId).then(gpd => {
//         res.send(gpd);
//     }).catch(err => {
//         res.status(500).send('Error: ' + err);
//     })
// }

// Verify a GPD for login
exports.login = (req, res) => {
  Gpd.findOne({ where: { email: req.query.email } })
    .then(gpd => {
      const isValidPass = bcrypt.compareSync(req.query.password, gpd.password)
      if (!isValidPass)
        throw 'Invalid password'
      let userData = {
        type: 'gpd',
        id: gpd.facultyId,
        userInfo: gpd
      }
      let token = jwt.sign(userData, process.env.JWT_KEY, {
        algorithm: process.env.JWT_ALGO,
        expiresIn: 1200 // Expires in 20 minutes.
      })
      res.send([token, gpd])
    }).catch(err => {
      res.status(500).send('Invalid login credentials')
    })
}



// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/