module.exports = (sequelize, type) => {
    return sequelize.define('courseplan', {
        coursePlanId: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        studentId: {
            type: type.INTEGER,
            allowNull: false
        },
        coursePlanState: type.BOOLEAN,
    }, {
        timestamps: false
    })
}