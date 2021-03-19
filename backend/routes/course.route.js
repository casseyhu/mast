
module.exports = function(app) {
    const Course = require('../controller/course.controller.js');

    // Upload course information
    app.post('/api/course/upload', Course.upload);

}