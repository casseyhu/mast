const Sequelize = require('sequelize') 
const GPDModel = require('./models/gpd')
const StudentModel = require('./models/student')
const CourseModel = require('./models/course')
const CoursePlanModel = require('./models/courseplan')
const CoursePlanItemModel = require('./models/courseplanitem')
const CourseOfferingModel = require('./models/student')
require('dotenv').config();

// Creating new Object of Sequelize 
const sequelize = new Sequelize( 
    'mast', 
    'root', 
    process.env.DB_PASSWORD, { 
        dialect: 'mysql',         
        host: 'localhost'
    }
); 


const GPD = GPDModel(sequelize, Sequelize)
const Student = StudentModel(sequelize, Sequelize)
const Course = CourseModel(sequelize, Sequelize)
const CoursePlan = CoursePlanModel(sequelize, Sequelize)
const CoursePlanItem = CoursePlanItemModel(sequelize, Sequelize)
const CourseOffering = CourseOfferingModel(sequelize, Sequelize)

try {
	sequelize.authenticate();
	console.log('Connection has been established successfully');
} catch (error) {
	console.error('Unable to connect to the database:', error);
}

sequelize.sync({ force: false })
    .then(() => {
    console.log(`Database & tables created here!`)
})

module.exports = {
    GPD, 
    Student,
    Course,
    CoursePlan,
    CoursePlanItem,
    CourseOffering
}