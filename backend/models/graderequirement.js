module.exports = (sequelize, Sequelize) => {
    const GradeRequirement = sequelize.define('graderequirement', {
        requirementId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        atLeastCredits: Sequelize.INTEGER,
        minGrade: Sequelize.FLOAT,
    }, {
        timestamps: false
    });

    return GradeRequirement;
}
