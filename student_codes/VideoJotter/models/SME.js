const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const SME = db.define('smes', {
    name: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    phoneno: {
        type: Sequelize.STRING
    },
    website: {
        type: Sequelize.STRING
    },
    address: {
        type: Sequelize.STRING
    },
    category: {
        type: Sequelize.STRING
    },
    operating_hours: {
        type: Sequelize.STRING
    },
    ad_plan: {
        type: Sequelize.STRING
    },

});

module.exports = SME;