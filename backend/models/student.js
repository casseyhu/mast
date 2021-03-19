module.exports = (sequelize, Sequelize) => {
    return sequelize.define('student', {
        sbuId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        firstName: Sequelize.STRING,
        lastName: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.STRING,
        gpa: Sequelize.FLOAT,
        entrySem: Sequelize.STRING,
        entryYear: Sequelize.INTEGER,
        entrySemYear: Sequelize.INTEGER,
        gradSem: Sequelize.STRING,
        gradYear: Sequelize.INTEGER,
        degreeId: Sequelize.INTEGER,
        graduated: Sequelize.BOOLEAN,
        comments: Sequelize.STRING
    }, {
        timestamps: false
    })
}