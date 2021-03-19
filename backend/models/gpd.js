
module.exports = (sequelize, Sequelize) => {
    const GPD = sequelize.define('gpd', {
        facultyId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
        },
        firstName: Sequelize.STRING,
        lastName: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.STRING,
    }, {
        timestamps: false
    });

    return GPD;
}
