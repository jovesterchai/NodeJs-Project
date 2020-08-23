const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const feedback = db.define('feedback', {
    feedback1: {
        type: Sequelize.STRING
    },
    feedback2: {
        type: Sequelize.STRING
    },
    feedback3: {
        type: Sequelize.INTEGER
    },
    feedback4: {
        type: Sequelize.STRING
    },
    feedback5: {
        type: Sequelize.STRING
    },
});
module.exports = feedback;