/**
 * Creates the GPD table in the MySQL database, if it doesn't exist.
 * Columns, translated over in MySQL terms for convenience:
 *      facultyId:              INTEGER NOT NULL
 *      firstName:              VARCHAR(255)
 *      lastName:               VARCHAR(255)
 *      email:                  VARCHAR(255)
 *      password:               VARCHAR(255)
 *      PRIMARY KEY (facultyId)
 * @param {Object} sequelize 
 * @param Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */

module.exports = (sequelize, Sequelize) => {
  const Gpd = sequelize.define('gpd', {
    facultyId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
  }, {
    timestamps: false
  });

  return Gpd;
}
