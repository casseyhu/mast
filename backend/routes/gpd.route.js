
module.exports = function(app) {
    const gpd = require('../controller/gpd.controller.js');

    // Get a GPD
    // app.get('/api/gpd/:gpdId', gpd.findById);

    // Verify GPD login
    app.get('/api/gpd/login', gpd.login);

    // Update a GPD
    // app.get('/api/gpd/:gpdId', gpd.update)

    // // Delete a GPD
    // app.get('/api/gpd/:gpdId', gpd.delete)
}