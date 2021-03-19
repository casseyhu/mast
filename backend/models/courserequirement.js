module.exports = (sequelize, Sequelize) => {
    const CourseRequirement = sequelize.define('courserequirement', {
        requirementId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: Sequelize.INTEGER,
        courseLower: Sequelize.INTEGER,
        courseUpper: Sequelize.INTEGER,
        creditLower: Sequelize.INTEGER,
        creditUpper: Sequelize.INTEGER,
        courses: {
            type: Sequelize.STRING,
            get() {
                return this.getDataValue('courses').split('`')
            },
            set(val) {
                this.setDataValue('courses',val.join('`'));
            },
        },
    }, {
        timestamps: false
    });

    return CourseRequirement;
}
