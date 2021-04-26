const Sequelize = require('sequelize')
const cls = require('cls-hooked')
const namespace = cls.createNamespace('cse416mast')
Sequelize.useCLS(namespace)

let sequelize
// Creating new Object of Sequelize 
if (process.env.NODE_ENV === 'production') {
  console.log('Running on SBU server.')
  sequelize = new Sequelize(
    'cashu',
    'cashu',
    process.env.SBU_DB_PASSWORD, {
      dialect: 'mysql',
      host: 'mysql3.cs.stonybrook.edu',
      logging: false
    }
  )
} else {
  sequelize = new Sequelize(
    'mast',
    'root',
    process.env.DB_PASSWORD, {
      dialect: 'mysql',
      host: 'localhost',
      logging: false
    }
  )
}


const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

// console.log(__dirname)
// All models and tables
db.Gpd = require('../models/gpd.js')(sequelize, Sequelize)
db.Student = require('../models/student.js')(sequelize, Sequelize)
db.Course = require('../models/course.js')(sequelize, Sequelize)
db.CourseOffering = require('../models/courseOffering.js')(sequelize, Sequelize)
db.CoursePlan = require('../models/coursePlan.js')(sequelize, Sequelize)
db.CoursePlanItem = require('../models/coursePlanItem.js')(sequelize, Sequelize)
db.CourseOffering = require('../models/courseOffering.js')(sequelize, Sequelize)

db.GradeRequirement = require('../models/gradeRequirement.js')(sequelize, Sequelize)
db.GpaRequirement = require('../models/gpaRequirement.js')(sequelize, Sequelize)
db.CreditRequirement = require('../models/creditRequirement.js')(sequelize, Sequelize)
db.CourseRequirement = require('../models/courseRequirement.js')(sequelize, Sequelize)
db.RequirementState = require('../models/requirementState.js')(sequelize, Sequelize)
db.Degree = require('../models/degree.js')(sequelize, Sequelize)


db.CoursePlan.hasMany(db.CoursePlanItem, { foreignKey: 'coursePlanId' })
db.CoursePlanItem.belongsTo(db.CoursePlan, { foreignKey: 'coursePlanId' })

module.exports = db