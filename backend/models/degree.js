/**
 * Creates the Degrees table in the MySQL database, if it doesn't exist.
 * Every record represents a degree on a specific track (i.e.: CSE on Advanced 
 * Project).
 * Columns, translated over in MySQL terms for convenience:
 *      degreeId:           INTEGER AUTOINCREMENT NOT NULL
 *      dept:               VARCHAR(255)
 *      track:              VARCHAR(255)
 *      requirementId:      INTEGER
 *      gradeRequirement:   INTEGER
 *      gpaRequirement:     INTEGER
 *      creditRequirement:  INTEGER
 *      courseRequirement:  LONGTEXT
 *      PRIMARY KEY (degreeId) 
 *      FOREIGN KEY (gradeRequirement)  REFERENCES  GradeRequirements(requirementId)
 *      FOREIGN KEY (creditRequirement) REFERENCES  CreditRequirements(requirementId)
 * @param {Object} sequelize 
 * @param Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */


module.exports = (sequelize, Sequelize) => {
  const Degree = sequelize.define('degree', {
    degreeId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      onDelete:'CASCADE'
    },
    dept: Sequelize.STRING,
    track: Sequelize.STRING,
    requirementVersion: Sequelize.INTEGER,
    gradeRequirement: {
      type: Sequelize.INTEGER,
      set(value) {
        // console.log("Setting the degree gradeRequirement with value: ", value)
        this.setDataValue('gradeRequirement', value)
      }, 
      unique: true
    },
    gpaRequirement: {
      type: Sequelize.INTEGER,
      set(value) {
        // console.log("Setting the degree gpaRequirement with value: ", value)
        this.setDataValue('gpaRequirement', value)
      }, 
      unique: true
    },
    creditRequirement: {
      type: Sequelize.INTEGER,
      set(value) {
        // console.log("Setting the degree creditRequirement with value: ", value)
        this.setDataValue('creditRequirement', value)
      }, 
      unique: true
    },
    courseRequirement: {
      // String of references to CourseRequirement.requirementId (s).
      // ex: "C001`C002`C003`C003`..."
      type: Sequelize.STRING,
      get() {
        return this.getDataValue('courseRequirement').split('`')
      },
      set(val) {
        this.setDataValue('courseRequirement', val.join('`'));
      },
    },
  }, {
    timestamps: false,
  });


  
  // Degree.associate = models => {
  //   Degree.hasOne(models.GradeRequirement, {
  //     sourceKey: 'gradeRequirement',
  //     foreignKey: 'requirementId'
  //   })
  //   Degree.hasOne(models.GpaRequirement, {
  //     sourceKey: 'gpaRequirement',
  //     foreignKey: 'requirementId'
  //   })
  //   Degree.hasOne(models.CreditRequirement, {
  //     sourceKey: 'creditRequirement',
  //     foreignKey: 'requirementId'
  //   })
    
  // }



  return Degree;
}

// .then(() => {
//   sequelize.addConstraint('degree', [''])
// })
// {
//   type: Sequelize.INTEGER,
//   references: {
//     model: {
//       tableName: 'GradeRequirement',
//       schema: 'mast'
//     },
//     key: 'requirementId'
//   },
//   allowNull:false
// },