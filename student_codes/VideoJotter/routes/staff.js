const passport = require('passport');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const alertMessage = require('../helpers/messenger');
var bcrypt = require('bcryptjs');
// SendGrid
const sgMail = require('@sendgrid/mail');
// JWT
const jwt = require('jsonwebtoken');
const ensureAuthenticated = require('../helpers/auth');

// User register URL using HTTP post => /user/register
router.get('/login', (req, res) => {
    res.render('staff/login') // renders views/index.handlebars
});

router.post('/login', (req, res, next) => {
    User.findOne({
        where: {
            email: req.body.email
        }
    }).then(user => {
        if (user) { // If user is found
            let userEmail = user.email; // Store email in temporary variable
            if (user.verified === true) { // Checks if user has been verified
                if (user.group === 'Admin') {
                    passport.authenticate('local', {

                        successRedirect: '/staff', // Route to /video/listVideos URL
                        failureRedirect: '/staff/login', // Route to /login URL
                        failureFlash: true
                        /* Setting the failureFlash option to true instructs Passport to flash an error message using the
                        message given by the strategy's verify callback, if any. When a failure occur passport passes the message
                        object as error */
                    })(req, res, next);
                }
            } else {
                alertMessage(res, 'danger', 'Unauthorised Access', 'fas faexclamation-circle', true);
                alertMessage(res, 'info', 'Please verify your email address', 'fas faexclamation-circle', true);
                res.redirect('login');
            }
        } else {
            alertMessage(res, 'danger', 'Email or password is incorrect', 'fas faexclamation-circle', true);
            res.redirect('login');
        }
    });
});

// User register URL using HTTP post => /user/register
router.get('/createStaff', (req, res) => {
    res.render('staff/createStaff', {
        layout: 'staffMain'
    }) // renders views/index.handlebars
});

router.post('/createStaff', (req, res) => {
    let errors = [];
    let success_msg = ' registered successfully';
    let group = 'Admin';
    // Do exercise 3 here
    // Retrieves fields from register page from request body
    let {
        name,
        email,
        password,
        password2
    } = req.body;

    if (password !== password2) {
        errors.push({
            text: 'Passwords do not match'
        });
    }
    // Checks that password length is more than 4
    if (password.length < 4) {
        errors.push({
            text: 'Password must be at least 4 characters'
        });
    }

    if (errors.length > 0) {
        res.render('staff/createStaff', {
            errors,
            name,
            email,
            password,
            password2,
            layout: 'staffMain'
        });
    } else {
        // If all is well, checks if user is already registered
        User.findOne({
                where: {
                    email: req.body.email
                }
            })
            .then(user => {
                if (user) {
                    // If user is found, that means email has already been
                    // registered
                    res.render('staff/createStaff', {
                        error: user.email + ' already registered',
                        name,
                        email,
                        password,
                        password2,
                        layout: 'staffMain'
                    });
                } else {
                    // Generate JWT token
                    let token;
                    jwt.sign(email, 's3cr3Tk3y', (err, jwtoken) => {
                        if (err) console.log('Error generating Token: ' + err);
                        token = jwtoken;
                    });

                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(req.body.password, salt, function (err, hash) {
                            password = hash
                            // Create new user record
                            User.create({
                                    name,
                                    email,
                                    password,
                                    verified: 1,
                                    group,
                                })
                                .then(user => {
                                    sendEmail(user.id, user.email, token)
                                        .then(msg => {
                                            alertMessage(res, 'success', user.name + ' added.Please login', 'fas fa-sign-in-alt', true);
                                            res.redirect('/staff');
                                        }).catch(err => {
                                            alertMessage(res, 'warning', 'Error sending to ' + user.email, 'fas fa-sign-in-alt', true);
                                            res.redirect('/');
                                        });
                                })
                                .catch(err => console.log(err));
                        });
                    });
                }
            });
    }
});

router.get('/verify/:userId/:token', (req, res, next) => {
    // retrieve from user using id
    User.findOne({
        where: {
            id: req.params.userId
        }
    }).then(user => {
        if (user) { // If user is found
            let userEmail = user.email; // Store email in temporary variable
            if (user.verified === true) { // Checks if user has been verified
                alertMessage(res, 'info', 'User already verified', 'fas faexclamation-circle', true);
                res.redirect('/staff/showLogin');
            } else {
                // Verify JWT token sent via URL
                jwt.verify(req.params.token, 's3cr3Tk3y', (err, authData) => {
                    if (err) {
                        User.update({
                            verified: 1
                        }, {
                            where: {
                                id: user.id
                            }
                        }).then(user => {
                            alertMessage(res, 'success', userEmail + ' verified. Please login', 'fas fa-sign-in-alt', true);
                            res.redirect('/staff/showLogin');
                        });
                    } else {
                        User.update({
                            verified: 1
                        }, {
                            where: {
                                id: user.id
                            }
                        }).then(user => {
                            alertMessage(res, 'success', userEmail + ' verified. Please login', 'fas fa-sign-in-alt', true);
                            res.redirect('/staff/showLogin');
                        });
                    }
                });
            }
        } else {
            alertMessage(res, 'danger', 'Unauthorised Access=', 'fas fa-exclamationcircle', true);
            res.redirect('/');
        }
    });
});

// Dashboard: User Profile
router.get('/showProfile', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: {
            id: req.user.id,
        },
        raw: true,
    }).then((user) => {
        res.render('staff/viewStaff', {
            user,
            layout: 'staffMain'
        });
    })
});

// Shows edit user page
router.get('/manageStaff', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: {
            id: req.user.id
        }

    }).then((user) => {
        if (req.user.id === user.id) {
            // call views/video/editVideo.handlebar to render the edit video page
            res.render('staff/manageStaff', {
                user // passes video object to handlebar
                , layout: 'staffMain'
            });
        } else {
            alertMessage(res, 'danger', 'Access Denied', 'fas fa-exclamation-circle', true);
            req.logout();
            res.redirect('/');
        };
    }).catch(err => console.log(err)); // To catch no video ID
});

// Save edited user
router.put('/saveEditedUser', (req, res) => {
    // Retrieves edited values from req.body
    let errors = [{
        "text": "Password is incorrect"
    }]
    let name = req.body.name;
    let email = req.body.email;
    let phoneNo = req.body.phoneNo;
    let password = req.body.password;
    let photoURL = req.body.photoURL;
    let userId = req.user.id;

    User.findOne({
        where: {
            id: req.user.id
        }
    }).then(user => {
        // Match password
        User.update({
            // Set variables here to save to the videos table
            name,
            email,
            phoneNo,
            password,
            photoURL,
            userId
        }, {
            where: {
                id: req.user.id
            }
        }).then(() => {
            // After saving, redirect to router.get(/listVideos...) to retrieve all updated
            // videos
            res.redirect('http://localhost:5000/staff/showProfile');
        }).catch(err => console.log(err))
    })
})

router.get('/delete', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: {
            id: req.user.id
        },

    }).then((user) => {
        if (user) {
            User.destroy({
                where: {
                    id: req.user.id
                }
            }).then(() => {
                alertMessage(res, 'info', 'User deleted', 'fas fa-trash', true);
                req.logout();
                res.redirect('/');
            });
        } else {
            alertMessage(res, 'danger', 'Unauthorised access to account', 'fas fa-exclamation-circle', true);
            alertMessage(res, 'info', 'Bye-bye!', 'fas fa-power-off', true);
            req.logout();
            res.redirect('/');
        }
    });
});

router.get('/resetPassword', (req, res) => {
    res.render('staff/resetpass', {
        layout: 'staffMain'
    }) // renders views/index.handlebars
});

router.post('/resetPassword', (req, res) => {
    let errors = [];
    let {
        password,
        password2
    } = req.body;

    if (password !== password2) {
        errors.push({
            text: 'Passwords do not match'
        });
    }
    // Checks that password length is more than 4
    if (password.length < 4) {
        errors.push({
            text: 'Password must be at least 4 characters'
        });
    }

    if (errors.length > 0) {
        res.render('staff/resetpass', {
            errors,
            password,
            password2,
            layout: 'staffMain'
        });
    } else {
        // If all is well, checks if user is already registered
        User.findOne({
                where: {
                    id: req.user.id
                }
            })
            .then(user => {
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        res.render('staff/resetpass', {
                            error: 'Please use a different password!',
                            password,
                            password2,
                            layout: 'staffMain'
                        });
                    } else {
                        bcrypt.genSalt(10, function (err, salt) {
                            bcrypt.hash(req.body.password, salt, function (err, hash) {
                                password = hash
                                // Create new user record
                                User.update({
                                        password,
                                    }, {
                                        where: {
                                            id: req.user.id
                                        }
                                    })
                                    .then(() => {
                                        alertMessage(res, 'success', 'Password has been changed. Please login', 'fas fa-sign-in-alt', true);
                                        req.logout();
                                        res.redirect('/');
                                    })
                            })
                        });
                    }
                });
            });
    }
});

router.get('/staff/resetPasswordEmail', (req, res) => {
    res.render('staff/resetpassemail', {
        layout: 'staffMain'
    })
});

router.post('/staff/resetPasswordEmail', (req, res) => {
    let email = req.body.email;
    User.findOne({
            where: {
                email: req.body.email
            }
        })
        .then(user => {
            if (!user) {
                // If user is not found, that means email has not been
                // registered
                res.render('staff/resetpassemail', {
                    error: req.body.email + ' is not registered',
                }, {
                    layout: 'staffMain'
                });
            } else {
                // Generate JWT token
                let token;
                jwt.sign(email, 's3cr3Tk3y', (err, jwtoken) => {
                    if (err) console.log('Error generating Token: ' + err);
                    token = jwtoken;
                })
                sendEmail2(user.id, user.email, token)
                    .then(msg => {
                        alertMessage(res, 'success', 'An email has been sent to ' + user.email, 'fas fa-sign-in-alt', true);
                        res.redirect('/staff/resetPasswordEmail');
                    }).catch(err => {
                        alertMessage(res, 'warning', 'Error sending to' + user.email, 'fas fa-sign-in-alt', true);
                        res.redirect('/');
                    });
            }
        });
});

router.get('/staff/resetpassword/:userId', (req, res) => {
    res.render('staff/resetpass', {
        layout: 'staffMain'
    })
});

router.post('/staff/resetpassword/:userId', (req, res, next) => {
    let errors = [];
    let {
        password,
        password2
    } = req.body;

    if (password !== password2) {
        errors.push({
            text: 'Passwords do not match'
        });
    }
    // Checks that password length is more than 4
    if (password.length < 4) {
        errors.push({
            text: 'Password must be at least 4 characters'
        });
    }

    if (errors.length > 0) {
        res.render('staff/resetpass', {
            errors,
            password,
            password2,
        }, {
            layout: 'staffMain'
        });
    } else {
        // retrieve from user using id
        User.findOne({
            where: {
                id: req.params.userId
            }
        }).then(user => {
            if (user) { // If user is found
                // Verify JWT token sent via URL
                jwt.verify(req.params.token, 's3cr3Tk3y', (err, authData) => {
                    if (err) {
                        // If all is well, checks if user is already registered
                        User.findOne({
                                where: {
                                    id: user.id
                                }
                            })
                            .then(user => {
                                password = req.body.password
                                bcrypt.compare(password, user.password, (err, isMatch) => {
                                    if (err) throw err;
                                    if (isMatch) {
                                        res.render('staff/resetpass', {
                                            error: 'Please use a different password!',
                                            password
                                        }, {
                                            layout: 'staffMain'
                                        });
                                    } else {
                                        bcrypt.genSalt(10, function (err, salt) {
                                            bcrypt.hash(req.body.password, salt, function (err, hash) {
                                                password = hash
                                                // Create new user record
                                                User.update({
                                                        password,
                                                    }, {
                                                        where: {
                                                            id: user.id
                                                        }
                                                    })
                                                    .then(() => {
                                                        alertMessage(res, 'success', 'Password has been changed. Please login', 'fas fa-sign-in-alt', true);
                                                        req.logout();
                                                        res.redirect('/staff/showLogin');
                                                    })
                                            })
                                        });
                                    }
                                });
                            });
                    } else {
                        // If all is well, checks if user is already registered
                        User.findOne({
                                where: {
                                    id: user.id
                                }
                            })
                            .then(user => {
                                password = req.body.password
                                bcrypt.compare(password, user.password, (err, isMatch) => {
                                    if (err) throw err;
                                    if (isMatch) {
                                        res.render('staff/resetpass', {
                                            error: 'Please use a different password!',
                                            password,
                                        }, {
                                            layout: 'staffMain'
                                        });
                                    } else {
                                        bcrypt.genSalt(10, function (err, salt) {
                                            bcrypt.hash(req.body.password, salt, function (err, hash) {
                                                password = hash
                                                // Create new user record
                                                User.update({
                                                        password,
                                                    }, {
                                                        where: {
                                                            id: user.id
                                                        }
                                                    })
                                                    .then(() => {
                                                        alertMessage(res, 'success', 'Password has been changed. Please login', 'fas fa-sign-in-alt', true);
                                                        req.logout();
                                                        res.redirect('/staff/showLogin');
                                                    })
                                            })
                                        });
                                    }
                                });
                            });
                    }
                });
            } else {
                alertMessage(res, 'danger', 'Unauthorised Access', 'fas fa-exclamationcircle', true);
                res.redirect('/');
            }
        });
    }
});

// List videos belonging to current logged in user
router.get('/stafflist', ensureAuthenticated, (req, res) => {
    User.findAll({
            where: {
                group: 'Admin'
            },
            order: [
                ['name', 'ASC']
            ],
            raw: true
        })
        .then((users) => {
            //pass object to listVideos.handlebar
            res.render('staff/stafflist', {
                users: users
            }, {
                layout: 'staffMain'
            });
        })
        .catch(err => console.log(err))
});

function sendEmail(userId, email, token) {
    sgMail.setApiKey('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');

    const message = {
        to: email,
        from: 'zerotwojr@gmail.com',
        subject: 'Verify Video Jotter Account',
        text: 'Video Jotter Email Verification',
        html: `Thank you registering with Video Jotter.<br><br>
        Please <a href="http://localhost:5000/staff/verify/${userId}/${token} ">
        <strong> verify</strong></a> your account.`
    };

    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
            .then(msg => resolve(msg))
            .catch(err => reject(err));
    });
}

function sendEmail2(userId, email, token) {
    sgMail.setApiKey('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');

    const message = {
        to: email,
        from: 'zerotwojr@gmail.com',
        subject: 'Request for Password Change',
        text: 'END. Email Verification',
        html: `You recently requested to reset your password on END.<br><br>
        Please click <a href="http://localhost:5000/staff/resetpassword/${userId} ">
        <strong> here</strong></a> to change password for your account.`
    };

    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
            .then(msg => resolve(msg))
            .catch(err => reject(err));
    });
}

module.exports = router;