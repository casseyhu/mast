module.exports = (sequelize, type) => {
    return sequelize.define('courseoffering', {
        courseOfferingId: {
            type: type.STRING,
            primaryKey: true,
            autoIncrement: true,
        },
        identifier: type.STRING,
        semester: type.STRING,
        year: type.INTEGER,
        section: type.INTEGER,
        days: type.STRING,
        startTime: {
            type: DataTypes.TIME,
            set (timeStart) { 
                this.setDataValue('startTime', timeStart)
            }
        },
        endTime: {
            type: DataTypes.TIME,
            set (timeEnd) { 
                this.setDataValue('endTime', timeEnd)
            }
        },
    }, {
        timestamps: false
    })
}