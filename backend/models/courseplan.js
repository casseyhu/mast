module.exports = (sequelize, Sequelize) => {
    return sequelize.define('courseplan', {
        coursePlanId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        studentId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        coursePlanState: Sequelize.BOOLEAN,
    }, {
        timestamps: false
    })
}