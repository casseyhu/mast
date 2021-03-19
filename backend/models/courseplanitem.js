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