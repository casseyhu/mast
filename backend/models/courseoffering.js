module.exports = (sequelize, type) => {
    return sequelize.define('courseoffering', {
        courseOfferingId: {
            type: type.STRING,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        identifier: type.STRING,
        semester: type.STRING,
        year: type.INTEGER,
        section: type.INTEGER,
        days: type.STRING,
        startTime: type.TIME,
        endTime: type.TIME,
    }, {
        timestamps: false
    })
}