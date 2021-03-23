/**
 * Creates the RequirementStates table in the MySQL database, if it doesn't exist.
 * Every record represents a specific requirement and it's current state (unsatisfied, pending, 
 * satisfied) respective to the student and the requirement that this state is associated to. 
 * Columns, translated over in MySQL terms for convenience:
 *      sbuID:                  INTEGER NOT NULL
 *      requirementId:          VARCHAR(255)
 *      state:                  VARCHAR(255)
 *      PRIMARY KEY(sbuID, requirementId)
 * @param {*} sequelize 
 * @param {*} Sequelize 
 * @returns A Promise<Model> indicating whether the object was created or not. 
 */
module.exports = (sequelize, Sequelize) => {
    const RequirementState = sequelize.define('requirementstate', {
        sbuID: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        requirementId: {
            type: Sequelize.STRING,
            primaryKey: true,
        },
        state: {
            type: Sequelize.STRING,
            defaultValue: 'unsatisfied'
        }
    }, {
        timestamps: false
    });

    return RequirementState;
}
