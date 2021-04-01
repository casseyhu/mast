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
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false
    },
    password: Sequelize.STRING,
    gpa: Sequelize.FLOAT,
    entrySem: {
      type: Sequelize.STRING,
      allowNull: false
    },
    entryYear: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    entrySemYear: Sequelize.INTEGER,
    gradSem: {
      type: Sequelize.STRING,
      allowNull: false
    },
    gradYear: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    department: {
      type: Sequelize.STRING,
      allowNull: false
    },
    degreeId: Sequelize.INTEGER,
    graduated: Sequelize.BOOLEAN,
    studentComments: Sequelize.TEXT('long'),
    gpdComments: Sequelize.TEXT('long')
  }, {
    timestamps: false
  })

  return Student;
}