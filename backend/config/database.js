const Sequelize = require('sequelize')

// Creating new Object of Sequelize 
const sequelize = new Sequelize(
  'mast',
  'root',
  process.env.DB_PASSWORD, {
  dialect: 'mysql',
  host: 'localhost',
  logging: false
}
);
// const sequelize = new Sequelize( 
//     'cashu', 
//     'cashu', 
//     process.env.SBU_DB_PASSWORD, { 
//         dialect: 'mysql',         
//         host: 'mysql3.cs.stonybrook.edu',
//         logging: false
//     }
// ); 

const database = {};

database.Sequelize = Sequelize;
database.sequelize = sequelize;

// All models and tables
database.GPD = require('../models/gpd.js')(sequelize, Sequelize);
database.Student = require('../models/student.js')(sequelize, Sequelize);
database.Course = require('../models/course.js')(sequelize, Sequelize);
database.CourseOffering 
    = require('../models/courseOffering.js')(sequelize, Sequelize);
database.CoursePlan = require('../models/coursePlan.js')(sequelize, Sequelize);
database.CoursePlanItem 
    = require('../models/coursePlanItem.js')(sequelize, Sequelize);
database.CourseOffering 
    = require('../models/courseOffering.js')(sequelize, Sequelize);

database.Degree = require('../models/degree.js')(sequelize, Sequelize);
database.GradeRequirement 
    = require('../models/gradeRequirement.js')(sequelize, Sequelize);
database.GpaRequirement 
    = require('../models/gpaRequirement.js')(sequelize, Sequelize);
database.CreditRequirement 
    = require('../models/creditRequirement.js')(sequelize, Sequelize);
database.CourseRequirement 
    = require('../models/courseRequirement.js')(sequelize, Sequelize);
database.RequirementState 
    = require('../models/requirementState.js')(sequelize, Sequelize);

module.exports = database;