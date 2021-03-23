/**
 * Creates the CourseOfferings table in the MySQL database, if it doesn't exist.
 * Every record contains information about when a specific course is offered.
 * Columns, translated over in MySQL terms for convenience:
 *      courseOfferingId:       INTEGER AUTOINCREMENT NOT NULL  
 *      identifier:             VARCHAR(255)
 *      semester:               VARCHAR(255)
 *      year:                   INTEGER
 *      section:                VARCHAR(255)
 *      days:                   VARCHAR(255)
 *      startTime:              TIME
 *      endTime:                TIME
 *      PRIMARY KEY (courseOfferingId)
 * @param {*} sequelize 
 * @param {*} Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */
module.exports = (sequelize, Sequelize) => {
    const CourseOffering =  sequelize.define('courseoffering', {
        courseOfferingId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        identifier: Sequelize.STRING,
        semester: Sequelize.STRING,
        year: Sequelize.INTEGER,
        section: Sequelize.STRING,
        days: Sequelize.STRING,
        startTime: Sequelize.TIME,
        endTime: Sequelize.TIME,
    }, {
        timestamps: false
    });

    return CourseOffering;
}