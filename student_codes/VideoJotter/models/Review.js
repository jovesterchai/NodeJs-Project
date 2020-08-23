const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Review = db.define('reviews', {
    user_id: {
        type: Sequelize.STRING
    },
    username: {
        type: Sequelize.STRING
    },
    user_photo: {
        type: Sequelize.STRING
    },
    sme_id: {
        type: Sequelize.STRING
    },
    category: {
        type: Sequelize.STRING
    },
    product_id: {
        type: Sequelize.STRING
    },
    product_name: {
        type: Sequelize.STRING
    },
    title: {
        type: Sequelize.STRING
    },
    rating: {
        type: Sequelize.INTEGER(1)
    },
    comment: {
        type: Sequelize.STRING
    }
});
module.exports = Review;