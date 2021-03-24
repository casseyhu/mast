const jwt = require('jsonwebtoken');
const database = require('../config/database.js');

const Gpd = database.Gpd;

// Find a GPD 
// exports.findById = (req, res) => {
//     GPD.findById(req.params.gpdId).then(gpd => {
//         res.send(gpd);
//     }).catch(err => {
//         res.status(500).send("Error: " + err);
//     })
// }

// Verify a GPD for login
exports.login = (req, res) => {
  Gpd.findOne({where:{email: req.query.email, password: req.query.password}})
    .then(gpd => {
      let userData = {
        type: 'gpd',
        id: gpd.facultyId
      }
      let token = jwt.sign(userData, process.env.JWT_KEY, {
        algorithm: process.env.JWT_ALGO,
        expiresIn: 600 // Expires in 10 minutes.
      });
      res.send(token);
    }).catch(err => {
      res.status(500).send("Invalid login credentials");
    })
}

