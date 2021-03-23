module.exports = (sequelize, Sequelize) => {
    const RequirementState = sequelize.define('requirementstate', {
        sbuID: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        requirementId: {
            type: Sequelize.STRING,
            primaryKey: true,
        },
        state: {
            type: Sequelize.STRING,
            defaultValue: 'unsatisfied'
        }
    }, {
        timestamps: false
    });

    return RequirementState;
}
