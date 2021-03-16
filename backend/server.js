
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GPD, Student, Course } = require('./sequelize')
const upload = require('./upload')
require('dotenv').config();

// const session = require('express-session');


const app = express();

app.use(express.json());
app.use(cors());
// app.use(session({
// 	secret: process.env.SESSION_PASSWORD,
// 	resave: true,
// 	saveUninitialized: true
// }));
app.use(bodyParser.urlencoded({extended:true}));



// Create GPD
app.post('/gpd/add', (req, res) => {
	console.log(req.body)
	GPD.create(req.body)
	.then(gpd => res.send(gpd))
})

// get all authors
app.get('/gpd', (req, res) => {
	GPD.findAll().then(gpd =>
	res.send(gpd))
})







// app.post('/upload', upload);

// app.use('/login', [ require('./routes/userlogin') ]);


app.listen(process.env.PORT || 3001, () => {
    console.log(`Listening on port ${process.env.PORT || 3001}`);
})