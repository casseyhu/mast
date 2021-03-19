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