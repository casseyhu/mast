const Sequelize = require('sequelize') 

// Creating new Object of Sequelize 
const sequelize = new Sequelize( 
    'mast', 
    'root', 
    process.env.DB_PASSWORD, { 
        dialect: 'mysql',         
        host: 'localhost'
    }
); 

const database = {};

database.Sequelize = Sequelize;
database.sequelize = sequelize;

// All models and tables
database.GPD = require('../models/gpd.js')(sequelize, Sequelize);
database.Student = require('../models/student.js')(sequelize, Sequelize);
database.Course = require('../models/course.js')(sequelize, Sequelize);
database.CourseOffering = require('../models/courseoffering.js')(sequelize, Sequelize);
database.CoursePlan = require('../models/courseplan.js')(sequelize, Sequelize);
database.CoursePlanItem = require('../models/courseplanitem.js')(sequelize, Sequelize);
database.CourseOffering = require('../models/courseoffering.js')(sequelize, Sequelize);

database.Degree = require('../models/degree.js')(sequelize, Sequelize);
database.GradeRequirement = require('../models/graderequirement.js')(sequelize, Sequelize);
database.GpaRequirement = require('../models/gparequirement.js')(sequelize, Sequelize);
database.CreditRequirement = require('../models/creditrequirement.js')(sequelize, Sequelize);
database.CourseRequirement = require('../models/courserequirement.js')(sequelize, Sequelize);

module.exports = database;