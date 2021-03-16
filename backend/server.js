
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const upload = require('./upload')
require('dotenv').config();
const connection = require('./config/database');
const session = require('express-session');

// // Include Sequelize module 
// const Sequelize = require('sequelize') 
  
// // Creating new Object of Sequelize 
// const sequelize = new Sequelize( 
//     'DATABASE_NAME', 
//     'DATABASE_USER_NAME', 
//     'DATABASE_PASSWORD', { 
//         dialect: 'mysql',         
//         host: 'localhost'
//     } 
// ); 
  
// // Exporting the sequelize object.  
// // We can use it in another file 
// // for creating models 
// module.exports = sequelize 

const app = express();

app.use(express.json());
app.use(cors());
app.use(session({
	secret: process.env.SESSION_PASSWORD,
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended:true}));

connection.connect(err => {
    if (err) return err
});

app.post('/upload', upload);

// app.use('/login', [ require('./routes/userlogin') ]);


app.listen(process.env.PORT || 3001, () => {
    console.log(`Listening on port ${process.env.PORT || 3001}`);
})