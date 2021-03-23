/**
 * Creates the CreditRequirements table in the MySQL database, if it doesn't 
 * exist. Every record represents the minimum number of credits requirement 
 * for a Degree on a specific track. 
 * Columns, translated over in MySQL terms for convenience:
 *      requirementId:          INTEGER AUTOINCREMENT NOT NULL
 *      minCredit:              INTEGER
 *      PRIMARY KEY (requirementId)
 *      FOREIGN KEY (requirementId) REFERENCES Degrees(creditRequirement)
 * @param {*} sequelize 
 * @param {*} Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */

module.exports = (sequelize, Sequelize) => {
  const CreditRequirement = sequelize.define('creditrequirement', {
    requirementId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    minCredit: Sequelize.INTEGER,
  }, {
    timestamps: false
  });

  return CreditRequirement;
}
