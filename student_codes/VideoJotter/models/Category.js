const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Category = db.define('category', {
    name: {
        type: Sequelize.STRING
    },
    sme_id: {
        type: Sequelize.STRING
    },
});
module.exports = Category;