const passport = require('passport');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const feedback = require('../models/feedback');
const alertMessage = require('../helpers/messenger');
var bcrypt = require('bcryptjs');
// SendGrid
const sgMail = require('@sendgrid/mail');
// JWT
const jwt = require('jsonwebtoken');
const ensureAuthenticated = require('../helpers/auth');
const dialcodes = require('dialcodes');
const upload = require('../helpers/imageUpload');
const fs = require('fs');
//SMS using Nexmo
const Nexmo = require('nexmo'); 

const nexmo = new Nexmo({
    apiKey: '3f9749ff',
    apiSecret: 'd1hqmEeSIDlB5g1f',
  });

// User register URL using HTTP post => /user/register
router.get('/login', (req, res) => {
	res.render('user/login') // renders views/index.handlebars
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
                if (user.twofactor === 1) {
                    if (user.group === 'Admin') { //Checks if user is admin or customer
                        passport.authenticate('local', {
                            
                            successRedirect: '/staff/', // Route to /staff
                            failureRedirect: '/user/login', // Route to /login URL
                            failureFlash: true
                        /* Setting the failureFlash option to true instructs Passport to flash an error message using the
                        message given by the strategy's verify callback, if any. When a failure occur passport passes the message
                        object as error */
                        })(req, res, next);
                    } else {
                        passport.authenticate('local', {

                            successRedirect: '/', // Route to /
                            failureRedirect: '/user/login', // Route to /login URL
                            failureFlash: true
                        /* Setting the failureFlash option to true instructs Passport to flash an error message using the
                        message given by the strategy's verify callback, if any. When a failure occur passport passes the message
                        object as error */
                        })(req, res, next);
                    }
                } else {
                    if (user.group === 'Admin') {
                        passport.authenticate('local', {
                            
                            successRedirect: '/staff/', // Route to /staff
                            failureRedirect: '/user/login', // Route to /login URL
                            failureFlash: true
                        /* Setting the failureFlash option to true instructs Passport to flash an error message using the
                        message given by the strategy's verify callback, if any. When a failure occur passport passes the message
                        object as error */
                        })(req, res, next);
                    } else {
                        passport.authenticate('local', {

                            successRedirect: '/user/OTP', // Route to /user/OTP URL
                            failureRedirect: '/user/login', // Route to /login URL
                            failureFlash: true
                        /* Setting the failureFlash option to true instructs Passport to flash an error message using the
                        message given by the strategy's verify callback, if any. When a failure occur passport passes the message
                        object as error */
                        })(req, res, next);
                    }
                }
            } else {
                    alertMessage(res, 'danger', 'Unauthorised Access', 'fas faexclamation-circle', true);
                    alertMessage(res, 'info', 'Please verify your email address', 'fas faexclamation-circle', true);
                    res.redirect('login');
            } 
        } else{
            alertMessage(res, 'danger', 'Email or password is incorrect', 'fas faexclamation-circle', true);
            res.redirect('login');
        }
    });
});

// User register URL using HTTP post => /user/register
router.get('/register', (req, res) => {
	res.render('user/register') // renders user/register.handlebars
});

router.post('/register', (req, res) => {
let errors = [];
let success_msg = ' registered successfully';
let group = 'Customer';

// Retrieves fields from register page from request body
let {name, email, password, password2} = req.body;
let photoURL = "/img/profiledefault.png";
// Check if password has at least 1 lowercase,uppercase and number
const fmtPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;


if(password !== password2) {
    errors.push({text: 'Passwords do not match'});
    }
// Checks that password length is more than 4
if(password.length < 4) {
    errors.push({text: 'Password must be at least 4 characters'});
    }

if(!fmtPassword.test(password)) {
    errors.push({text: "Password must contain at least 1 lower, 1 upper, 1 numeric. Minimum size of 8"});
}

if (errors.length > 0) {
    res.render('user/register', {
        errors,
        name,
        email,
        password,
        password2,
    });
} else {
    // If all is well, checks if user is already registered
    User.findOne({ where: {email: req.body.email} })
    .then(user => {
    if (user) {
    // If user is found, that means email has already been
     // registered
        res.render('user/register', {
            error: user.email + ' already registered',
            name,
            email,
            password,
            password2,
        });
    } else {
        // Generate JWT token
        let token;
        jwt.sign(email, 's3cr3Tk3y', (err, jwtoken) => {
        if (err) console.log('Error generating Token: ' + err);
        token = jwtoken;
        });

        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, hash) {
                password = hash
                // Create new user record
                User.create({ 
                    name, 
                    email, 
                    password ,
                    photoURL,
                    verified: 0,
                    group,
                    twofactor: 1,
                    wallet: 0,
                })
                .then(user => {
                    sendEmail(user.id, user.email, token)
                    .then(msg => {
                        alertMessage(res, 'success', user.name + ' added.Please login', 'fas fa-sign-in-alt', true);
                        res.redirect('/showLogin');
                    }).catch(err => {
                        alertMessage(res,'warning','Error sending to ' + user.email, 'fas fa-sign-in-alt', true);
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

// Send OTP
router.get("/OTP", ensureAuthenticated, (req, res) => {
	let user = req.user;
    let country = req.user.country
    if (req.user.phoneNo != undefined) {  // fill out personal information
        let dialingCode = dialcodes.getDialingCode(country); // find country dialing code
		user.phoneNo = dialingCode + req.user.phoneNo;
		
		res.render('user/OTPRegister', {
            user,
            layout : 'test',
		})
	} else {
		alertMessage(res, 'info', 'Please fill out your information.', 'fas fa-exclamation-circle', true);
		res.redirect('http://localhost:5000/user/showProfile');
	}
	
})

router.post("/OTP", ensureAuthenticated, (req, res) => {
	let phoneNumber = req.body.number;
    console.log('Phone number is: ' + phoneNumber);
    //Send SMS
	nexmo.verify.request({number: phoneNumber, brand: 'END.'}, (err, result) => {
	  if(err) {
		res.sendStatus(500);
	  } else {
		let requestId = result.request_id;
		if(result.status == '0') {
		  res.render('user/verify', {requestId: requestId}); // Success! Now, have your user enter the PIN
		} else {
		  res.status(401).send(result.error_text);
		}
	  }
	});
})

router.get("/OTPRegisterVerify", ensureAuthenticated, (req, res) => {
	
	res.render('user/verify', {})
	
})

router.post('/verify', (req, res) => {
	let pin = req.body.pin;
	let requestId = req.body.requestId;
	console.log(pin);
	console.log(requestId);
   //Check pin and request id
	nexmo.verify.check({request_id: requestId, code: pin}, (err, result) => {
	  if(err) {
		// handle the error
		res.send('Error');
		console.log(err);
	  } else {
		if(result && result.status == '0') { // Success!
			let token; 
			jwt.sign(requestId, 's3cr3Tk3y', (err, jwtoken) => {
				if (err) console.log('Error generating Token: ' + err);
					token = jwtoken;
					console.log("Generating: " + token);
					res.redirect(`http://localhost:5000/`);
			});
        User.update({twofactor: 0}, {
            where: {id: req.user.id}
        })
		} else {
		  // handle the error - e.g. wrong PIN
		//   console.log(result);
		//   console.log(result.status);
		  console.log("Wrong PIN");
          alertMessage(res, 'info', 'Wrong PIN', 'fas fa-exclamation-circle', true);
          req.logout();
		}
	  }
	});
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
                res.redirect('/showLogin');
            } else {
                // Verify JWT token sent via URL
                jwt.verify(req.params.token, 's3cr3Tk3y', (err, authData) => {
                    if (err) {
                        alertMessage(res, 'danger', 'Unauthorised Access', 'fas faexclamation-circle', true);
                        res.redirect('/');
                    } else {
                        User.update({verified: 1}, {
                            where: {id: user.id}
                        }).then(user => {
                            alertMessage(res, 'success', userEmail + ' verified. Please login', 'fas fa-sign-in-alt', true);
                            res.redirect('/showLogin');
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
    feedback.findAll({
        where: {
            feedback1: req.user.name,
        },
        raw: true, 
    }).then((feedback) => {
        User.findOne({
            where: {
                id: req.user.id,
            },
        raw: true,
    }).then((user) => {
            res.render('user/viewProfile', {
                user,
                feedback,
            });
        })
    });
})

// Shows edit user page
router.get('/edit/:id', ensureAuthenticated , (req, res) => {
    User.findOne({
        where: {
            id: req.user.id
        }

    }).then((user) => {
        if (req.user.id === user.id){
            // call views/video/editVideo.handlebar to render the edit video page
        res.render('user/manage', {
            user // passes video object to handlebar
        });
    } else {
        alertMessage(res, 'danger', 'Access Denied', 'fas fa-exclamation-circle', true);
        req.logout();
        res.redirect('/');
    };
    }).catch(err => console.log(err)); // To catch no video ID
});



// Save edited user
router.put('/saveEditedUser/:id', (req, res) => {
    // Retrieves edited values from req.body
    let errors = [{"text":"Password is incorrect"}]
    let name = req.body.name;
    let photoURL = req.body.photoURL;
	let address = req.body.address;
	let country = req.body.countrySelect;
	let unitNo = req.body.unitNo;
	let postalCode = req.body.postalCode;
	let phoneNo = req.body.phoneNo;
    let gender = req.body.gender.toString();
	let dob = req.body.dobUk;
    let userId = req.user.id;

    User.findOne({ where: {
        id: req.user.id
        } 
            }) .then(user => {
                // Match password
                        User.update({
                            // Set variables here to save to the videos table
                            name,
                            photoURL,
                            address,
                            country,
                            unitNo,
                            postalCode,
                            phoneNo,
                            gender,
                            dob,
                        }, {
                        where: {
                            id: req.user.id
                        }
                        }).then(() => {
                        res.redirect('http://localhost:5000/user/showProfile');
                        }).catch(err => console.log(err))
                    }) 
                });

// Upload poster
router.post('/upload', ensureAuthenticated, (req, res) => {
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
});

// deletes the user
router.get('/delete', ensureAuthenticated, (req,res) =>{
    User.findOne({
        where: {
            id: req.user.id
        },
        
    }).then((user) =>{
        if (user){
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
	res.render('user/resetpass') // renders user/resetpass.handlebars
});

router.post('/resetPassword', (req, res) => {
    let errors = [];
    let {password, password2} = req.body;
    const fmtPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
    
    if(password !== password2) {
        errors.push({text: 'Passwords do not match'});
        }
    // Checks that password length is more than 4
    if(password.length < 4) {
        errors.push({text: 'Password must be at least 4 characters'});
        }
    
    if(!fmtPassword.test(password)) {
        errors.push({text: "Password must contain at least 1 lower, 1 upper, 1 numeric. Minimum size of 8"});
    }

    if (errors.length > 0) {
        res.render('user/resetpass', {
            errors,
            password,
            password2,
        });
    } else {
        // If all is well, checks if user is already registered
        User.findOne({ where: {id: req.user.id} })
        .then(user => {
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if(err) throw err;
                if(isMatch) {
                    res.render('user/resetpass', {
                        error: 'Please use a different password!',
                        password,
                        password2,
                    });
                } else {
                    bcrypt.genSalt(10, function(err, salt) {
                        bcrypt.hash(req.body.password, salt, function(err, hash) {
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
                                res.redirect('/showLogin');
                                })
                            })
                        });
                }   
            });
        });
    }
});

router.get('/resetPasswordEmail', (req, res) => {
	res.render('user/resetpassemail')
});

router.post('/resetPasswordEmail', (req, res) => {
    let email = req.body.email;
	User.findOne({ where: {email: req.body.email} })
    .then(user => {
    if (!user) {
    // If user is not found, that means email has not been
     // registered
        res.render('user/resetpassemail', {
            error: req.body.email + ' is not registered',
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
                res.redirect('/user/resetPasswordEmail');
                }).catch(err => {
                    alertMessage(res,'warning','Error sending to' + user.email, 'fas fa-sign-in-alt', true);
                    res.redirect('/');
                });
        }
    });
});

router.get('/resetpassword/:userId', (req, res) => {
	res.render('user/resetpass')
});

router.post('/resetpassword/:userId', (req, res, next) => {
    let errors = [];
    let {password, password2} = req.body;
    const fmtPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

    if(password !== password2) {
        errors.push({text: 'Passwords do not match'});
        }
    // Checks that password length is more than 4
    if(password.length < 4) {
        errors.push({text: 'Password must be at least 4 characters'});
        }
    if(!fmtPassword.test(password)) {
        errors.push({text: "Password must contain at least 1 lower, 1 upper, 1 numeric. Minimum size of 8"});
    }  

    if (errors.length > 0) {
        res.render('user/resetpass', {
            errors,
            password,
            password2,
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
                    User.findOne({ where: {id: user.id} })
                    .then(user => {
                        password = req.body.password
                        bcrypt.compare(password, user.password, (err, isMatch) => {
                            if(err) throw err;
                            if(isMatch) {
                                res.render('user/resetpass', {
                                    error: 'Please use a different password!',
                                    password
                                });
                            } else {
                                bcrypt.genSalt(10, function(err, salt) {
                                    bcrypt.hash(req.body.password, salt, function(err, hash) {
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
                                            res.redirect('/showLogin');
                                            })
                                        })
                                    });
                            }   
                        });
                    });
                } else {
                    // If all is well, checks if user is already registered
                    User.findOne({ where: {id: user.id} })
                    .then(user => {
                        password = req.body.password
                        bcrypt.compare(password, user.password, (err, isMatch) => {
                            if(err) throw err;
                            if(isMatch) {
                                res.render('user/resetpass', {
                                    error: 'Please use a different password!',
                                    password,
                                });
                            } else {
                                bcrypt.genSalt(10, function(err, salt) {
                                    bcrypt.hash(req.body.password, salt, function(err, hash) {
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
                                            res.redirect('/showLogin');
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

function sendEmail(userId, email, token){
    sgMail.setApiKey('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');

    const message = {
        to: email,
        from: 'adirafiqinxiv@gmail.com',
        subject: 'Verify END. Account',
        text: 'END. Email Verification',
        html: `Thank you registering with END.<br><br>
        Please <a href="http://localhost:5000/user/verify/${userId}/${token} ">
        <strong> verify</strong></a> your account.`
        };

    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
        .then(msg => resolve(msg))
        .catch(err => reject(err));
    });
}

function sendEmail2(userId, email, token){
    sgMail.setApiKey('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');
    
    const message = {
        to: email,
        from: 'adirafiqinxiv@gmail.com',
        subject: 'Request for Password Change',
        text: 'END. Email Verification',
        html: `You recently requested to reset your password on END.<br><br>
        Please click <a href="http://localhost:5000/user/resetpassword/${userId} ">
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