const Sequelize = require('sequelize')

let sequelize;
// Creating new Object of Sequelize 
if (process.env.NODE_ENV === 'production') {
  sequelize = new Sequelize( 
    'cashu', 
    'cashu', 
    process.env.SBU_DB_PASSWORD, { 
      dialect: 'mysql',         
      host: 'mysql3.cs.stonybrook.edu',
      logging: false
    }
  ); 
} else {
  sequelize = new Sequelize(
    'mast',
    'root',
    process.env.DB_PASSWORD, {
    dialect: 'mysql',
    host: 'localhost',
    logging: false
  }
  );
}


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// console.log(__dirname)
// All models and tables
db.Gpd = require('../models/gpd.js')(sequelize, Sequelize);
db.Student = require('../models/student.js')(sequelize, Sequelize);
db.Course = require('../models/course.js')(sequelize, Sequelize);
db.CourseOffering = require('../models/courseOffering.js')(sequelize, Sequelize);
db.CoursePlan = require('../models/coursePlan.js')(sequelize, Sequelize);
db.CoursePlanItem = require('../models/coursePlanItem.js')(sequelize, Sequelize);
db.CourseOffering = require('../models/courseOffering.js')(sequelize, Sequelize);

db.Degree = require('../models/degree.js')(sequelize, Sequelize);
db.GradeRequirement = require('../models/gradeRequirement.js')(sequelize, Sequelize);
db.GpaRequirement = require('../models/gpaRequirement.js')(sequelize, Sequelize);
db.CreditRequirement = require('../models/creditRequirement.js')(sequelize, Sequelize);
db.CourseRequirement = require('../models/courseRequirement.js')(sequelize, Sequelize);
db.RequirementState = require('../models/requirementState.js')(sequelize, Sequelize);


db.CoursePlan.hasMany(db.CoursePlanItem, { foreignKey: 'coursePlanId' })
db.CoursePlanItem.belongsTo(db.CoursePlan, { foreignKey: 'coursePlanId' })

// db.Degree.hasOne(db.GradeRequirement, {foreignKey: 'gradeRequirement'})
// db.GradeRequirement.belongsTo(db.Degree, {foreignKey: 'requirementId'})



db.Degree.hasOne(db.GradeRequirement, {
  sourceKey: 'gradeRequirement', 
  foreignKey: 'requirementId',
})
db.Degree.hasOne(db.GpaRequirement, {
  sourceKey: 'gpaRequirement', 
  foreignKey: 'requirementId',
})
db.Degree.hasOne(db.CreditRequirement, {
  sourceKey: 'creditRequirement', 
  foreignKey: 'requirementId',
})
db.GradeRequirement.belongsTo(db.Degree, {
  targetKey: 'gradeRequirement',
   foreignKey: 'requirementId',
  })
db.GpaRequirement.belongsTo(db.Degree, {
  targetKey: 'gpaRequirement', 
  foreignKey: 'requirementId',
})
db.CreditRequirement.belongsTo(db.Degree, {
  targetKey: 'creditRequirement', 
  foreignKey: 'requirementId',
})



// db.Degree.hasOne(db.GradeRequirement, {sourceKey: 'gradeRequirement', foreignKey: 'requirementId'})
// db.Degree.hasOne(db.GpaRequirement, {sourceKey: 'gpaRequirement', foreignKey: 'requirementId'})
// db.Degree.hasOne(db.CreditRequirement, {sourceKey: 'creditRequirement', foreignKey: 'requirementId'})


// db.Degree.hasOne(db.GpaRequirement, {foreignKey: 'gpaRequirement'})
// db.Degree.hasOne(db.CreditRequirement, {foreignKey: 'creditRequirement'})

// db.GradeRequirement.belongsTo(db.Degree)


module.exports = db;