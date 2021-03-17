module.exports = (sequelize, type) => {
    return sequelize.define('courseplanitems', {
        studentId: {
            type: type.INTEGER,
            primaryKey: true,
        },
        coursePlanId: {
            type: type.INTEGER,
            primaryKey: true,
        },
        year:{
            type: type.INTEGER,
            primaryKey: true,
        },
        section: type.INTEGER,
        grade: type.STRING,
    }, {
        timestamps: false
    })
}