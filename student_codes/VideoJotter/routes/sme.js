const express = require('express');
const router = express.Router();
const SME = require('../models/SME');
const User = require('../models/User');
const Category = require('../models/Category');
const fs = require('fs');
const upload = require('../helpers/imageUpload');
const ensureAuthenticated = require('../helpers/auth');

// Shows branch/SME to user
router.get('/listSMES', ensureAuthenticated, (req, res) => {
    SME.findAll({
        where: {
            id: req.user.id
        },
        order: [
            ['name', 'ASC']
        ],
        raw: true
    })
        .then((sme) => {
            console.log(sme);
// pass object to listSMES.handlebar
            res.render('sme/listSMES',{
                sme,
            });
        })
        .catch(err => console.log(err));
});
router.get('/addSME', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: {
            id: req.user.id,
        }
    }).then((user) => {
        res.render('sme/createSME', {user})
    })
});

router.post('/createSME', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let phoneno = req.body.phoneno;
    let website = req.body.website;
    let address = req.body.address;
    let category = req.body.category;
    let operating_hours = req.body.operating_hours;
    let ad_plan = "bronze";
    SME.create({name,
        email,
        phoneno,
        website,
        address,
        category,
        operating_hours,
        ad_plan
    }).then((sme) => {
        res.redirect('/sme/listSMES')
    })
});

router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    SME.findOne({
        where: {
            id: req.params.id
        }
    }).then((sme) => {
        res.render("sme/editSME", {
            sme
        });
    }).catch(err => console.log(err));
});

router.put('/saveEditedSME/:id', (req, res) => {
    SME.update({
        name: req.body.name,
        email: req.body.email,
        phoneno: req.body.phoneno,
        website: req.body.website,
        address: req.body.address,
        category: req.body.category,
        operating_hours: req.body.operating_hours
    }, {
            where: {
            id: req.params.id
        }
        }).then((sme) => {
            res.redirect('../listSMES');
    }).catch(err => console.log(err));
});


module.exports = router;