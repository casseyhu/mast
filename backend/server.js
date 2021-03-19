
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const database = require('./config/database.js');
// const session = require('express-session');

const app = express();

app.use(bodyParser.json())

app.use(cors())
// app.use(session({
// 	secret: process.env.SESSION_PASSWORD,
// 	resave: true,
// 	saveUninitialized: true
// }));
// app.use(bodyParser.urlencoded({extended:true}));


database.sequelize.sync({force: false}).then(() => {
	console.log("Synced database");
})

require('./routes/gpd.route.js')(app);
require('./routes/course.route.js')(app);
require('./routes/courseoffering.route.js')(app);


app.listen(process.env.PORT || 8080, () => {
    console.log(`Listening on port ${process.env.PORT || 8080}`);
})