const express = require('express');
const router = express.Router();
const User = require('../models/User');
const alertMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/auth');
const SME = require('../models/SME');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const feedback = require('../models/feedback');

/*router.get('/', (req, res) => {
    const title = 'Video Jotters';
    res.render('index', {title: title}) // renders views/index.handlebars
});*/
router.get('/', (req, res) => {
    SME.findAll({
        where: {
            id: 1
        },
        order: [
            ['name', 'ASC']
        ],
        raw: true
    })
        .then((sme) => {
            console.log(sme);
// pass object to listSMES.handlebar
            res.render('index',{
                sme,
            });
        })
        .catch(err => console.log(err));
});

router.get('/home', ensureAuthenticated, (req, res) => {
    SME.findAll({
        where: {
            id: 1
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
				layout: 'staffMain' ,
                sme,
            });
        })
        .catch(err => console.log(err));
});

router.get('/staff', ensureAuthenticated, (req, res) => {
	User.findOne({
        where: {
            id: req.user.id
		}
	}).then((user) => {
		if (user.group === 'Customer') {
			alertMessage(res, 'danger','Unauthorised access', 'fas fa-exclamation-circle', true);
			req.logout();
			res.redirect('/');
		} else {
			const title = 'Video Jotters';
			res.render('index', {title: title, layout: 'staffMain'}) // renders views/index.handlebars
		}
	});
});

router.get('/showLogin', (req, res) => {
	res.redirect('user/login') // renders views/index.handlebars
});

router.get('/showRegister', (req, res) => {
	res.render('user/register') // renders views/index.handlebars
});

router.get('/about', (req, res) => {
	const author = 'Denzel Washington';

	alertMessage(res, 'success','This is an important message', 'fas fa-sign-in-alt', true);
	alertMessage(res, 'danger','Unauthorised access', 'fas fa-exclamation-circle', false);
	
	let success_msg = 'Success message';
	let error_msg = 'Error message using error_msg';
	var errors = [{"text": "First error message"}, {"text": "Second error message"}, {"text": "Third error message"}]
	
	res.render('about', {
		author: author,
		success_msg : success_msg,
		error_msg : error_msg,
		errors : errors
	}) // renders views/index.handlebars
});


// Logout User
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});


// Product/sme onwards

router.get('/showSME/:id', (req, res) => {
	SME.findOne({
		where: {
			id: req.params.id
		}
	}).then((sme) => {
		Category.findAll({
			where: {
				sme_id: req.params.id
			}
		}).then((category) => {
			Product.findAll({
				where: {
					sme_id: req.params.id

				}
			}).then((product) => {
				res.render('viewsme', {
					sme, product, category
				});
			})

		})
	})

});


/* router.get('/showCategory/:id/:cat', (req, res) => {
	SME.findOne({
		where: {
			id: req.params.id
		}
	}).then((sme) => {
		Category.findOne({
			where: {
				sme_id: req.params.id,
				id: req.params.cat
			}
		}).then((s_category) => {
			User.findOne({
				where: {
					id: req.params.id
				}
			}).then((user) => {
				Product.findAll({
					where: {
						sme_id: req.params.id,
						category: req.params.cat,
						product_type: user.org_type
					}
				}).then((product) => {
					Category.findAll({
						where: {
							sme_id: req.params.id
						}
					}).then((category) => {
						res.render('viewcategory', {
							sme, product, s_category, category
						});
			})

				})
			})

		})
	})
}); */

router.get('/viewProduct/:sme/:id/:cat', (req, res) => {
	SME.findOne({
		where: {
			id: req.params.sme
		}
	}).then((sme) => {
		Product.findAll({
			where: {
				sme_id: req.params.sme
			},
			limit: 3,
		}).then((ads) => {
			Product.findOne({
				where: {
					id: req.params.id
				},
			}).then((product) => {
				Category.findOne({
					where: {
						id: req.params.cat
					}
				}).then((category) => {
					Review.findAndCountAll({
						where: {
							sme_id: req.params.sme,
							product_id: req.params.id,
							category: req.params.cat
						}
					}).then((review) => {
						Review.sum('rating', {
							where: {
								sme_id: req.params.sme,
								product_id: req.params.id,
								category: req.params.cat
							}
						}).then((sum) => {
								let overall_rating = sum / review.count;
								Review.findAll({
									where: {
										sme_id: req.params.sme,
										product_id: req.params.id,
										category: req.params.cat
									},
									limit: 3,
								}).then((reviews) => {
									res.render('productpage', {product: product, category, ads, sme, review: reviews, overall_rating: overall_rating});
								})

							}).catch(err => console.log(err));

					})
				})
			})
		})

	})

});

router.post('/viewProduct/:sme/:id/:cat', (req, res) => {
	SME.findOne({
		where: {
			id: req.params.sme
		}
	}).then((sme) => {
		Product.findAll({
			where: {
				sme_id: req.params.sme
			},
			limit: 3,
		}).then((ads) => {
			Product.findOne({
				where: {
					id: req.params.id
				},
			}).then((product) => {
				Category.findOne({
					where:{
						id: req.params.cat
					}
				}).then((category) => {
					Review.findAndCountAll({
						where: {
							sme_id: req.params.sme,
							product_id: req.params.id,
							category: req.params.cat
						}
					}).then((review) => {
						review.sum('rating').then((sum) => {
							review.count().then((count) => {
								let overall_rating = sum/count;
								res.render('productpage', {product: product, category, ads, sme, review});
							})

						})

					}).catch(err => console.log(err));
				})
			})
		})
	})

});

router.post('/submitReview/:sme/:id/:cat', (req, res) => {
	Product.findOne({
		where: {
			sme_id: req.params.sme,
			id: req.params.id,
			category: req.params.cat
		}
	}).then((product) => {
		let user_id = req.user.id;
		let username = req.user.name;
		let user_photo = req.user.photoURL;
		let sme_id = req.params.sme;
		let category = req.params.cat;
		let product_id = product.id;
		let product_name = product.name;
		let title = req.body.title;
		let rating = req.body.rating;
		let comment = req.body.input;
		Review.create({
			user_id,
			username,
			user_photo,
			sme_id,
			category,
			product_id,
			product_name,
			title,
			rating,
			comment
		}).then((review) => {
			res.redirect('/viewProduct/' + req.params.sme + '/' + req.params.id + '/' + req.params.cat)
		})
	})
});

//marketplace end

router.get('/feedback', (req, res) => {
    res.render('feedback/feedback', { // pass object to listVideos.handlebar
        videos: 'List of videos',
    });
});


router.post('/feedback', (req, res) => {
    let feedback1 = req.body.feedback1;
    let feedback2 = req.body.feedback2;
    let feedback3 = req.body.feedback3;
    let feedback4 = req.body.feedback4;
    let feedback5 = req.body.feedback5;
    let userId = req.user.id;

    // Multi-value components return array of strings or undefined
    feedback.create({
        feedback1,
        feedback2,
        feedback3,
        feedback4,
        feedback5,
        userId,
    }) .then(feedback => {
        alertMessage(res, 'success',  'Your response has been submitted ', true);
        res.redirect('/');
    })
    .catch(err => console.log(err))
});

router.get('/feedbackstaff',ensureAuthenticated, (req, res) => {
    feedback.findAll({
        raw: true
    })
    .then((feedback) => {
        res.render('feedback/feedbackstaff',{
            layout: 'staffMain',
            feedback
        });
    })
    .catch(err => console.log(err))
});

router.get('/delete/:id', ensureAuthenticated, (req,res) =>{
    feedback.findOne({
        where: {
            id: req.params.id
        },
        
    }).then((feedback) =>{
        if (feedback){
            feedback.destroy({
                where: {
                    id: req.user.id
                }
            }).then(() => {
                alertMessage(res, 'info', 'Feedback deleted', 'fas fa-trash', true);
                res.redirect('/user/showProfile');
            });
        } else {
            alertMessage(res, 'danger', 'Unauthorised access to account', 'fas fa-exclamation-circle', true);
            alertMessage(res, 'info', 'Bye-bye!', 'fas fa-power-off', true);
            req.logout();
            res.redirect('/');
        }
    });
});

router.get('/edit/:id', ensureAuthenticated , (req, res) => {
    feedback.findOne({
        where: {
            id: req.params.id
        }

    }).then((feedback) => {
            // call views/video/editVideo.handlebar to render the edit video page
        res.render('feedback/feedbackedit', {
            feedback // passes video object to handlebar
        });
});

})


router.put('/saveEditedfeedback/:id', (req, res) => {
    let feedback1 = req.body.feedback1;
    let feedback2 = req.body.feedback2;
    let feedback3 = req.body.feedback3;
    let feedback4 = req.body.feedback4;
    let feedback5 = req.body.feedback5;
    let userId = req.user.id;
	feedback.findOne({
		where:{
			id:req.params.id
		}
	}).then((feedback) => {
    // Multi-value components return array of strings or undefined
    feedback.update({
        feedback1,
        feedback2,
        feedback3,
        feedback4,
        feedback5,
		userId,
		
    }) .then(feedback => {
        alertMessage(res, 'success',  'Your edit has been submitted ', true);
        res.redirect('/');
    })
	.catch(err => console.log(err))
	})
});

router.get('/success', (req, res) => {
	res.render('success');
});

module.exports = router;
