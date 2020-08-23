const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Order = db.define('order', {
    boughtDate: {
        type: Sequelize.DATE
    },
    cost: {
        type: Sequelize.STRING
    },
    destination: {
        type: Sequelize.STRING
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    status: {
        type: Sequelize.STRING
    },
    location: {
        type: Sequelize.STRING
    },
    remarks: {
        type: Sequelize.STRING(2000)
    },
});

module.exports = Order;