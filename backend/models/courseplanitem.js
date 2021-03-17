module.exports = (sequelize, type) => {
    return sequelize.define('courseplanitems', {
        coursePlanId: {
            type: type.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        courseId: {
            type: type.STRING,
            primaryKey: true,
            allowNull: false
        },
        semester: {
            type:type.STRING,
            primaryKey: true,
            allowNull: false
        },
        year: {
            type: type.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        section: type.STRING,
        grade: type.STRING,
    }, {
        timestamps: false
    })
}