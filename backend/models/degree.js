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
 *      FOREIGN KEY (courseRequirement) REFERENCES  CourseRequirements(requirementId)
 * @param {*} sequelize 
 * @param {*} Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */


module.exports = (sequelize, Sequelize) => {
  const Degree = sequelize.define('degree', {
    degreeId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    dept: Sequelize.STRING,
    track: Sequelize.STRING,
    requirementVersion: Sequelize.INTEGER,
    // gradeRequirement is string of GradeRequirement.requirementId
    gradeRequirement: Sequelize.INTEGER,
    // gpaRequirement is string of GpaRequirement.requirementId
    gpaRequirement: Sequelize.INTEGER,
    // creditRequirement is string of CreditRequirement.requirementId
    creditRequirement: Sequelize.INTEGER,
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
    timestamps: false
  });

  return Degree;
}
