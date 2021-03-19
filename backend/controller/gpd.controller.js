const database = require('../config/database.js');

const GPD = database.GPD;

// Find a GPD 
exports.findById = (req, res) => {
    GPD.findById(req.params.gpdId).then(gpd => {
        res.send(gpd);
    }).catch(err => {
        res.status(500).send("Error: " + err);
    })
}

