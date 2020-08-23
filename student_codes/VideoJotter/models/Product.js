const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Product = db.define('product', {
    sme_id: {
        type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING
    },

    category: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING(3000)
    },
    publishDate: {
        type: Sequelize.DATE
    },
    cost_price: {
        type: Sequelize.STRING
    },
    selling_price: {
        type: Sequelize.STRING
    },
    supplier: {
        type: Sequelize.STRING
    },
    delivery_fee: {
        type: Sequelize.STRING
    },
    images: {
        type: Sequelize.STRING
    },
    tags: {
        type: Sequelize.STRING
    },
    in_stock: {
        type: Sequelize.INTEGER
    },
    // might not add in
    total_sold: {
        type: Sequelize.INTEGER
    },
    // Specially for services only
    service_date: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    reminded: {
        type: Sequelize.BOOLEAN
    },
});

module.exports = Product;