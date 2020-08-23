const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Products = require('../models/Product');
const alertMessage = require('../helpers/messenger');
const fs = require('fs');
const upload = require('../helpers/imageUpload');
const ensureAuthenticated = require('../helpers/auth');
const multer = require('multer');

router.get('/showCategorys/:id', (req, res) => {
    Category.findAll({
        where: {
            sme_id: 1
        },
        order: [
            ['name', 'ASC']
        ],
        raw: true
    }).then((category) => {
        console.log(category);
        res.render('shop/categoryusers', {
            category,
        });
    }).catch(err => console.log(err));
});

router.get('/showCarousel/:id', ensureAuthenticated, (req, res) => {
    Category.findAll({
        where: {
            sme_id: 1
        },
        order: [
            ['name', 'ASC']
        ],
        raw: true
    }).then((category) => {
        console.log(category);
        res.render('shop/carousel', {
            category,
            layout: 'staffMain'
        });
    }).catch(err => console.log(err));
});

router.post('/addCategory', (req, res) => {
    console.log(req.body.catname);
    let name = req.body.catname;
    let sme_id = 1;
    Category.create({
            name,
            sme_id,
        }).then((category) => {
            res.redirect('./showCarousel/' + sme_id);
        })
        .catch((err) => console.log(err))
});

router.get('/delete/:id', (req, res) => {
    Category.findOne({
        where: {
            id: req.params.id,
            sme_id: 1
        },
    }).then((category) => {
        Category.destroy({
            where: {
                id: req.params.id,
                sme_id: 1
            }
        }).then((category) => {
            alertMessage(res, 'info', 'Category deleted', 'far fa-trash-alt', true);
            res.redirect('../showCarousel/' + req.user.id);
        })
    })
});

router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    Category.findOne({
        where: {
            id: req.params.id
        }
    }).then((category) => {
        res.render("shop/editCategory", {
            category
        });
    }).catch(err => console.log(err));
});

router.put('/saveEditedCat/:id', (req, res) => {
    Category.update({
        name: req.body.name
    }, {
        where: {
            id: req.params.id
        }
    }).then((category) => {
        res.redirect('../showCarousel/' + req.user.id);
    }).catch(err => console.log(err));
});

router.get('/listProducts/:id', ensureAuthenticated, (req, res) => {
    Category.findOne({
        where: {
            id: req.params.id
        },
    }).then((category) => {
        Products.findAll({
            where: {
                category: req.params.id,
                sme_id: 1,
            },
            order: [
                ['name', 'ASC']
            ],
            raw: true
        }).then((product) => {
            console.log(product);
            res.render('shop/listProducts', {
                product,
                category,
                layout: "staffMain",
            });
        })
    }).catch(err => console.log(err));

});

router.get('/deleteProd/:id/:cat', ensureAuthenticated, (req, res) => {
    Category.findOne({
        where: {
            id: req.params.cat,
            sme_id: 1
        }
    }).then((category) => {
        Products.findOne({
            where: {
                id: req.params.id,
                sme_id: 1
            },
        }).then((product) => {
            Products.destroy({
                where: {
                    id: req.params.id,
                    sme_id: 1
                }
            }).then((product) => {
                res.redirect('/shop/listProducts/' + req.params.cat);
            })
        })

    })
});

router.get('/editProduct/:id', ensureAuthenticated, (req, res) => {
    Products.findOne({
        where: {
            id: req.params.id
        }
    }).then((product) => {
        res.render("shop/editProduct", {
            product,
            layout: "staffMain",
        });
    }).catch(err => console.log(err));
});

router.put('/saveEditedProduct/:id/:cat', (req, res) => {
    Products.update({
        sme_id: 1,
        name: req.body.name,
        category: req.params.cat,
        description: req.body.description,
        publishDate: new Date(),
        cost_price: req.body.cost_price,
        selling_price: req.body.selling_price,
        supplier: req.body.supplier,
        delivery_fee: req.body.delivery_fee,
        images: req.body.posterURL,
        tags: req.body.tags,
        in_stock: req.body.in_stock
    }, {
        where: {
            id: req.params.id
        }
    }).then((product) => {
        res.redirect('/shop/listProducts/' + req.params.cat);
    }).catch(err => console.log(err));
});

router.get('/addCategory', ensureAuthenticated, (req, res) => {
    let name = req.body.catname;
    let sme_id = 1;

    Category.create({
            name,
            sme_id
        }).then((category) => {
            res.redirect('./showCarousel/' + sme_id);
        })
        .catch(err => console.log(err))
});

router.get('/addProduct/:id', ensureAuthenticated, (req, res) => {
    let sme_id = 1;
    Category.findOne({
        where: {
            id: req.params.id,
            sme_id: req.user.id
        }
    }).then((category) => {
        res.render('sme/createproduct', {
            category,
            layout: "staffMain",
        });
    });

});
/*
router.post('/upload', (req, res) => {
    // Creates user id directory for upload if not exist
    if (!fs.existsSync('./public/uploads/' + req.user.id)){
    fs.mkdirSync('./public/uploads/' + req.user.id);
    }

    upload(req, res, (err) => {
    if (err) {
    res.json({file: '/img/no-image.jpg', err: err});
    } else {
    if (req.file === undefined) {
    res.json({file: '/img/no-image.jpg', err: err});
    } else {
    res.json({file: `/uploads/${req.user.id}/${req.file.filename}`});
    }
    }
    });
}); */

router.post('/createProduct/:id', (req, res) => {

    Category.findOne({
        where: {
            id: req.params.id,
            sme_id: req.user.id
        }
    }).then((ccategory) => {
        console.log(req.query.category);
        console.log(req.files);
        let post = req.body;
        let sme_id = 1;
        let name = post.name;
        let product_type = req.user.org_type;
        let category = req.params.id;
        let description = post.description;
        let publishDate = new Date();
        let cost_price = post.costprice;
        let selling_price = post.selling_price;
        let supplier = post.supplier;
        let delivery_fee = post.delivery_fee;
        let images = post.posterURL;
        let tags = post.tags;
        let in_stock = post.in_stock;


        Products.create({
            sme_id,
            name,
            product_type,
            category,
            description,
            publishDate,
            cost_price,
            selling_price,
            supplier,
            delivery_fee,
            images,
            tags,
            in_stock,
        }).then((product) => {

            res.redirect('../listProducts/' + req.params.id);
        })
    }).catch(err => console.log(err));
});

// Upload poster
router.post('/upload', ensureAuthenticated, (req, res) => {
    // Creates user id directory for upload if not exist
    if (!fs.existsSync('./public/uploads/' + req.user.id)) {
        fs.mkdirSync('./public/uploads/' + req.user.id);
    }


    upload(req, res, (err) => {
        if (err) {
            res.json({file: '/img/no-image.jpg', err: err });
        } else {
            if (req.file === undefined) {
                res.json({file: '/img/no-image.jpg',err: err});
            } else {
                res.json({file: `/uploads/${req.user.id}/${req.file.filename}`});
            }
        }
    });
});
module.exports = router;