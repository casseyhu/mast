module.exports = (sequelize, Sequelize) => {
    const GpaRequirement = sequelize.define('gparequirement', {
        requirementId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        cumulative: Sequelize.FLOAT,
        department: Sequelize.FLOAT,
        core: Sequelize.FLOAT,
    }, { 
        timestamps: false
    });

    return GpaRequirement;
}
