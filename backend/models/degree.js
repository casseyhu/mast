module.exports = (sequelize, Sequelize) => {
    const Degree = sequelize.define('degree', {
        degreeId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
        },
        dept: Sequelize.STRING,
        track: Sequelize.STRING,
        requirementVersion: Sequelize.INTEGER,
        gradeRequirement: Sequelize.INTEGER,
        gpaRequirement: Sequelize.INTEGER,
        creditRequirement: Sequelize.INTEGER,
        courseRequirement: {
            type: Sequelize.INTEGER,
            get() {
                return this.getDataValue('courseRequirement').split('`')
            },
            set(val) {
                this.setDataValue('courseRequirement',val.join('`'));
            },
        },
    }, {
        timestamps: false
    });

    return Degree;
}
