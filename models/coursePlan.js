/**
 * Creates the CoursePlans table in the MySQL database, if it doesn't exist.
 * Every record represents a course plan for a student. 
 * Columns, translated over in MySQL terms for convenience:
 *      coursePlanId:       INTEGER AUTOINCREMENT NOT NULL
 *      studentId:          INTEGER NOT NULL
 *      coursePlanState:    TINYINT
 *      PRIMARY KEY (coursePlanId)
 * @param {Object} sequelize 
 * @param Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */
module.exports = (sequelize, Sequelize) => {
  const CoursePlan = sequelize.define('courseplan', {
    coursePlanId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    studentId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    coursePlanState: Sequelize.INTEGER(4),
  }, {
    timestamps: false
  })

  return CoursePlan;
}