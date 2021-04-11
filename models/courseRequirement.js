/**
 * Creates the CourseRequirements table in the MySQL database, if it doesn't 
 * exist. Every record represents the list of courses required to fulfill a 
 * course requirement in a Degree on a specific track. 
 * Columns, translated over in MySQL terms for convenience:
 *      requirementId:      INTEGER AUTOINCREMENT NOT NULL
 *      type:               INTEGER
 *      courseLower:        INTEGER
 *      courseUpper:        INTEGER
 *      creditLower:        INTEGER
 *      creditUpper:        INTEGER
 *      courses:            LONGTEXT
 *      PRIMARY KEY (requirementId)
 * @param {Object} sequelize 
 * @param Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */

module.exports = (sequelize, Sequelize) => {
  const CourseRequirement = sequelize.define('courserequirement', {
    requirementId: {
      type: Sequelize.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    type: Sequelize.INTEGER,
    courseLower: Sequelize.INTEGER,
    courseUpper: Sequelize.INTEGER,
    creditLower: Sequelize.INTEGER,
    creditUpper: Sequelize.INTEGER,
    courses: {
      type: Sequelize.TEXT('long'),
      get() {
        return this.getDataValue('courses').split('`')
      },
      set(val) {
        this.setDataValue('courses', val.join('`'))
      }
    }
  }, {
    timestamps: false
  })

  return CourseRequirement
}
