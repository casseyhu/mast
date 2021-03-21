module.exports = (sequelize, Sequelize) => {
    const Degree = sequelize.define('degree', {
        degreeId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        dept: Sequelize.STRING,
        track: Sequelize.STRING,
        requirementVersion: Sequelize.INTEGER,
        // gradeRequirement is string of GradeRequirement.requirementId
        gradeRequirement: Sequelize.STRING,
        // gpaRequirement is string of GpaRequirement.requirementId
        gpaRequirement: Sequelize.STRING,
        // creditRequirement is string of CreditRequirement.requirementId
        creditRequirement: Sequelize.STRING,
        courseRequirement: {
        // String of references to CourseRequirement.requirementId (s).
        // ex: "C001`C002`C003`C003`..."
            type: Sequelize.STRING,
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
