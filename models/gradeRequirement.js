/**
 * Creates the GradeRequirements table in the MySQL database, if it doesn't 
 * exist. Every record represents the grade requirement for a Degree on a 
 * specific track.
 * Columns, translated over in MySQL terms for convenience:
 *      requirementId:          INTEGER AUTOINCREMENT NOT NULL
 *      atLeastCredits:         INTEGER
 *      minGrade:               FLOAT
 *      PRIMARY KEY (requirementId)
 *      FOREIGN KEY (requirementId) REFERENCES Degrees(gradeRequirement)
 * @param {Object} sequelize  
 * @param Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */

 module.exports = (sequelize, Sequelize) => {
    const GradeRequirement = sequelize.define('graderequirement', {
      requirementId: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        // autoIncrement: true,
        references: {
          model: 'degrees',
          key: 'gradeRequirement'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      atLeastCredits: Sequelize.INTEGER,
      minGrade: Sequelize.FLOAT,
    }, {
      timestamps: false
    });
  
    return GradeRequirement;
  }
  