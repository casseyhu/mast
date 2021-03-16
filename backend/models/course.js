
module.exports = (sequelize, type) => {
    return sequelize.define('course', {
        courseId: {
            type: type.STRING,
            primaryKey: true,
        },
        department: type.STRING,
        courseNum: type.INTEGER,
        semestersOffered: {
            type: type.STRING,
            get() {
                return this.getDataValue('semestersOffered').split('`')
            },
            set(val) {
                this.setDataValue('semestersOffered',val.join('`'));
            },
        },
        name: type.STRING,
        description: type.STRING,
        credits: type.INTEGER,
        prereqs: {
            type: type.STRING,
            get() {
                return this.getDataValue('prereqs').split('`')
            },
            set(val) {
                this.setDataValue('prereqs',val.join('`'));
            },
        },
        repeat: type.BOOLEAN,
    }, {
        timestamps: false
    })
}