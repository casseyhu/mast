module.exports = (sequelize, type) => {
    return sequelize.define('student', {
        sbuId: {
            type: type.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        firstName: type.STRING,
        lastName: type.STRING,
        email: type.STRING,
        password: type.STRING,
        gpa: type.FLOAT,
        entrySem: type.STRING,
        entryYear: type.INTEGER,
        entrySemYear: type.INTEGER,
        gradSem: type.STRING,
        gradYear: type.INTEGER,
        degreeId: type.INTEGER,
        graduated: type.BOOLEAN,
        comments: type.STRING
    }, {
        timestamps: false
    })
}