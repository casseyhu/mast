module.exports = (sequelize, type) => {
    return sequelize.define('courseplanitems', {
        studentId: {
            type: type.INTEGER,
            primaryKey: true,
        },
        coursePlanId: {
            type: type.INTEGER,
            primaryKey: true,
        },
        semester:{
            type:type.STRING,
            primaryKey: true,
        },
        year:{
            type: type.INTEGER,
            primaryKey: true,
        },
        section:{
            type: type.STRING,
            allowNull:true,
        }
        grade:{
            type: type.STRING,
            allowNull: true,
        }
    }, {
        timestamps: false
    })
}