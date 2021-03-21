module.exports = (sequelize, Sequelize) => {
    const GpaRequirement = sequelize.define('gparequirement', {
        requirementId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        strReqId: {
            type: Sequelize.STRING,
            set() {
                this.setDataValue('strReqId', 'G'+requiremntId);
            },
        },
        cumulative: Sequelize.FLOAT,
        department: Sequelize.FLOAT,
        core: Sequelize.FLOAT,
    }, {
        timestamps: false
    });

    return GpaRequirement;
}
