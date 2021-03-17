module.exports = (sequelize, type) => {
    return sequelize.define('courseplan', {
        studentId: {
            type: type.INTEGER,
            primaryKey: true,
        },
        coursePlanId: {
            type: type.INTEGER,
            autoIncrement: true,
        },
    }, {
        timestamps: false
    })
}