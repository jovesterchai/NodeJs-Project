const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const User = db.define('user', {
    name: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    verified: {
        type: Sequelize.BOOLEAN
    },
    group: {
        type: Sequelize.STRING
    },
    photoURL: {
        type: Sequelize.STRING
    },
    gender: {
        type: Sequelize.STRING
    },
    phoneNo: {
        type: Sequelize.STRING
    },
    dob: {
        type: Sequelize.STRING
    },
    address: {
        type: Sequelize.STRING
    },
    country: {
        type: Sequelize.STRING
    },
    unitNo: {
        type: Sequelize.STRING
    },
    postalCode: {
        type: Sequelize.STRING
    },
    wallet: {
        type: Sequelize.INTEGER
    },
    twofactor: {
        type: Sequelize.INTEGER
    },
});
module.exports = User;