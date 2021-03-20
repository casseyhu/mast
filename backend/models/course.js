
module.exports = (sequelize, Sequelize) => {
    const Course = sequelize.define('course', {
        courseId: {
            type: Sequelize.STRING,
            primaryKey: true,
        },
        department: Sequelize.STRING,
        courseNum: Sequelize.INTEGER,
        semestersOffered: {
            type: Sequelize.STRING,
            get() {
                return this.getDataValue('semestersOffered').split('`')
            },
            set(val) {
                this.setDataValue('semestersOffered',val.join('`'));
            },
        },
        name: Sequelize.STRING,
        description: Sequelize.TEXT('long'),
        credits: Sequelize.INTEGER,
        prereqs: {
            type: Sequelize.STRING,
            get() {
                return this.getDataValue('prereqs').split('`')
            },
            set(val) {
                this.setDataValue('prereqs',val.join('`'));
            },
        },
        repeat: Sequelize.BOOLEAN,
    }, {
        timestamps: false
    });

    return Course;
}