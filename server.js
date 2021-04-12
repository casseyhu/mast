
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const database = require('./config/database.js');
const PORT = process.env.PORT || 5000;
const app = express();

app.use(bodyParser.json())

app.use(cors())
app.use(express.static(path.join(__dirname, 'client/build')));

database.sequelize.sync({ force: false }).then(() => {
  console.log("Synced database");
})

require('./routes/gpdRoute.js')(app);
require('./routes/studentRoute.js')(app);
require('./routes/courseRoute.js')(app);
require('./routes/courseOfferingRoute.js')(app);
require('./routes/coursePlanRoute.js')(app);
require('./routes/degreeRoute.js')(app);
require('./routes/emailRoute.js')(app);


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
})