/**
 * Creates the GpaRequirements table in the MySQL database, if it doesn't 
 * exist. Every record represents the GPA requirements (i.e. there exists a 
 * minumum cumulative gpa requirement) for a Degree on a specific track.
 * Columns, translated over in MySQL terms for convenience:
 *      requirementId:          INTEGER AUTOINCREMENT NOT NULL
 *      cumulative:             FLOAT
 *      department:             FLOAT
 *      core:                   FLOAT
 *      PRIMARY KEY (requirementId)
 *      FOREIGN KEY (requirementId) REFERENCES Degrees(gpaRequirement)
 * @param {*} sequelize 
 * @param {*} Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */

module.exports = (sequelize, Sequelize) => {
  const GpaRequirement = sequelize.define('gparequirement', {
    requirementId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cumulative: Sequelize.FLOAT,
    department: Sequelize.FLOAT,
    core: Sequelize.FLOAT,
  }, {
    timestamps: false
  });

  return GpaRequirement;
}
