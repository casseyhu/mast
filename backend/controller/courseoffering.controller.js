const database = require('../config/database.js');

const CourseOffering = database.CourseOffering;

// Upload course offerings
exports.upload = (req, res) => {
    // upload course offering
    res.send(req);
}
