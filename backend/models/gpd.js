module.exports = (sequelize, type) => {
    return sequelize.define('gpd', {
        facultyId: {
            type: type.INTEGER,
            primaryKey: true,
        },
        firstName: type.STRING,
        lastName: type.STRING,
        email: type.STRING,
        password: type.STRING,
    }, {
        timestamps: false
    })
}