/**
 * Creates the CoursePlanItems table in the MySQL database, if it doesn't exist.
 * Every record represents a Course in a CoursePlan and its respective information (i.e 
 * the specific Course (ex: CSE523) and what semester, year, section that it's being taken in 
 * in the CoursePlan).
 * Columns, translated over in MySQL terms for convenience:
 *      coursePlanId:       INTEGER NOT NULL
 *      courseId:           VARCHAR(255) NOT NULL
 *      semester:           VARCHAR(255) NOT NULL
 *      year:               INTEGER NOT NULL
 *      section:            VARCHAR(255)
 *      grade:              VARCHAR(255)
 *      PRIMARY KEY (coursePlanId, courseId, semester, year)
 *      FOREIGN KEY (coursePlanId) references CoursePlan(coursePlanId)
 * @param {*} sequelize 
 * @param {*} Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */

module.exports = (sequelize, Sequelize) => {
    return sequelize.define('courseplanitems', {
        coursePlanId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        courseId: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
        },
        semester: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
        },
        year: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        section: Sequelize.STRING,
        grade: Sequelize.STRING,
    }, {
        timestamps: false
    })
}