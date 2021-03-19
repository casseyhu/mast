
module.exports = function(app) {
    const CourseOffering = require('../controller/courseoffering.controller.js');

    // Upload course offering information
    app.post('/api/courseoffering/upload', CourseOffering.upload);

}