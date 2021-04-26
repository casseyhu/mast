/**
 * Creates the Courses table in the MySQL database, if it doesn't exist.
 * Every record contains information about a course scraped from the PDFs 
 * uploaded by the GPD.
 * Columns, translated over in MySQL terms for convenience:
 *      courseId:           VARCHAR(255) NOT NULL
 *      department:         VARCHAR(255)
 *      courseNum:          INTEGER
 *      semestersOffered:   VARCHAR(255)
 *      name:               VARCHAR(255)
 *      description:        LONGTEXT
 *      credits:            INTEGER
 *      prereqs:            VARCHAR(255)
 *      repeat:             TINYINT
 *      PRIMARY KEY (courseId)
 * @param {Object} sequelize 
 * @param Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */
module.exports = (sequelize, Sequelize) => {
  const Course = sequelize.define('course', {
    courseId: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    semester: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    year: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    department: Sequelize.STRING,
    courseNum: Sequelize.INTEGER,
    semestersOffered: {
      type: Sequelize.STRING,
      get() {
        return this.getDataValue('semestersOffered').split('`')
      },
      set(val) {
        this.setDataValue('semestersOffered', val.join('`'))
      }
    },
    name: Sequelize.STRING,
    description: Sequelize.TEXT('long'),
    minCredits: Sequelize.INTEGER,
    maxCredits: Sequelize.INTEGER,
    prereqs: {
      type: Sequelize.STRING,
      get() {
        return this.getDataValue('prereqs').split('`')
      },
      set(val) {
        this.setDataValue('prereqs', val.join('`'))
      }
    },
    repeat: Sequelize.BOOLEAN
  }, {
    timestamps: false
  })

  return Course
}