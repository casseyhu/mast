/**
 * Creates the Students table in the MySQL database, if it doesn't exist.
 * Columns, translated over in MySQL terms for convenience:
 *      sbuId:                  INTEGER NOT NULL 
 *      firstName:              VARCHAR(255) 
 *      lastName:               VARCHAR(255) 
 *      email:                  VARCHAR(255) 
 *      password:               VARCHAR(255) 
 *      gpa:                    FLOAT 
 *      entrySem:               VARCHAR(255) 
 *      entryYear:              INTEGER 
 *      entrySemYear:           INTEGER 
 *      gradSem:                VARCHAR(255) 
 *      gradYear:               INTEGER 
 *      degreeId:               INTEGER 
 *      graduated:              TINYINTEGER
 *      comments:               LONGTEXT
 *      PRIMARY KEY (sbuId)
 * @param {Object} sequelize 
 * @param Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */

module.exports = (sequelize, Sequelize) => {
  const Student = sequelize.define('student', {
    sbuId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
    gpa: Sequelize.FLOAT,
    entrySem: Sequelize.STRING,
    entryYear: Sequelize.INTEGER,
    entrySemYear: Sequelize.INTEGER,
    gradSem: Sequelize.STRING,
    gradYear: Sequelize.INTEGER,
    degreeId: Sequelize.INTEGER,
    graduated: Sequelize.BOOLEAN,
    comments: Sequelize.TEXT('long')
  }, {
    timestamps: false
  })

  return Student;
}