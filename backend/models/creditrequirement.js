module.exports = (sequelize, Sequelize) => {
    const CreditRequirement = sequelize.define('creditrequirement', {
        requirementId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        minCredit: Sequelize.INTEGER,
    }, {
        timestamps: false
    });

    return CreditRequirement;
}
