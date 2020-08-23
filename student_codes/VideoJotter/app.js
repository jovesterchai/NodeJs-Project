/*
* 'require' is similar to import used in Java and Python. It brings in the libraries required to be used
* in this JS file.
* */
const passport = require('passport');
// Bring in database connection
const vidjotDB = require('./config/DBConnection');
// Connects to MySQL database, to set up database with new tables set (true)
vidjotDB.setUpDB(false); 
// Passport Config
const authenticate = require('./config/passport');
authenticate.localStrategy(passport);
const express = require('express');
const session = require('express-session');
// Library to use MySQL to store session objects
const MySQLStore = require('express-mysql-session');
const db = require('./config/db'); // db.js config file
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const FlashMessenger = require('flash-messenger');

// Paypal
const paypal = require('paypal-rest-sdk');


/*
* Loads routes file main.js in routes directory. The main.js determines which function
* will be called based on the HTTP request and URL.
*/
const mainRoute = require('./routes/main');
const userRoute = require('./routes/user');
const videoRoute = require('./routes/video');
const smeRoute = require('./routes/sme');
const shopRoute = require('./routes/shop');
const staffRoute = require('./routes/staff');


// Bring in Handlebars Helpers here
// Copy and paste this statement only!!
const {formatDate, radioCheck, genderCheck} = require('./helpers/hbs');
const {replaceCommas} = require('./helpers/replaceCommas');
const { setFlagsFromString } = require('v8');

/*
* Creates an Express server - Express is a web application framework for creating web applications
* in Node JS.
*/
const app = express();

// Handlebars Middleware
/*
* 1. Handlebars is a front-end web templating engine that helps to create dynamic web pages using variables
* from Node JS.
*
* 2. Node JS will look at Handlebars files under the views directory
*
* 3. 'defaultLayout' specifies the main.handlebars file under views/layouts as the main template
*
* */
app.engine('handlebars', exphbs({
	helpers: {
			formatDate: formatDate,
			replaceCommas: replaceCommas,
			genderCheck: genderCheck,
			radioCheck: radioCheck,
	},
	defaultLayout: 'main', // Specify default template views/layout/main.handlebar 
	stafflayout : 'staffMain',
	test: 'test'
}));
app.set('view engine', 'handlebars');

// Body parser middleware to parse HTTP body in order to read HTTP data
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

// Creates static folder for publicly accessible HTML, CSS and Javascript files
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware to use other HTTP methods such as PUT and DELETE
app.use(methodOverride('_method'));

// Enables session to be stored using browser's Cookie ID
app.use(cookieParser());

// To store session information. By default it is stored as a cookie on browser
app.use(session({
	key: 'vidjot_session',
	secret: 'tojiv',
	store: new MySQLStore({
		host: db.host,
		port: 3306,
		user: db.username,
		password: db.password,
		database: db.database,
		clearExpired: true,
		// How frequently expired sessions will be cleared; milliseconds:
		checkExpirationInterval: 900000,
		// The maximum age of a valid session; milliseconds:
		expiration: 900000,
	}),
	resave: false,
	saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(FlashMessenger.middleware);

// Place to define global variables - not used in practical 1
app.use(function (req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	res.locals.video = req.video || null;
	next();
});

// Use Routes
/*
* Defines that any root URL with '/' that Node JS receives request from, for eg. http://localhost:5000/, will be handled by
* mainRoute which was defined earlier to point to routes/main.js
* */
app.use('/', mainRoute); // mainRoute is declared to point to routes/main.js
// This route maps the root URL to any path defined in main.js
app.use('/user', userRoute);
app.use('/video', videoRoute);
app.use('/sme', smeRoute);
app.use('/shop', shopRoute);
app.use('/staff', staffRoute);

// Paypal

// For paypal payment account use :
// Email : sb-7i4747t2935838@personal.example.com
// Password : nY6]^<FG

paypal.configure({
	'mode': 'sandbox', //sandbox or live
	'client_id': 'AZzuX81Tmn54RbMq5kir8XrNJG8nHeJWTBd6TPIRm_5vhZcIQCg74iSuQOvZu-K31l2ruTlF8gWhrWxk',
	'client_secret': 'EKHYXtNHo03sFtsb_tIQli07GGgrjkh5faYfG94e8NKT-dWlXcah61a9LMwQDcm8qs535CnJ0N50qwhN'
  });

app.post('/pay', (req, res) => {
	const create_payment_json = {
		"intent": "sale",
		"payer": {
			"payment_method": "paypal"
		},
		"redirect_urls": {
			"return_url": "http://localhost:5000/success",
			"cancel_url": "http://localhost:5000/cancel"
		},
		"transactions": [{
			"item_list": {
				"items": [{
					"name": "Jerry Thompson's Service",
					"sku": "001",
					"price": "25.00",
					"currency": "USD",
					"quantity": 1
				}]
			},
			"amount": {
				"currency": "USD",
				"total": "25.00"
			},
			"description": "I can cook for you!"
			}]
};

paypal.payment.create(create_payment_json, function (error, payment) {
	if (error) {
		throw error;
	} else {
		for(let i = 0;i < payment.links.length;i++){
			if(payment.links[i].rel === 'approval_url'){
			res.redirect(payment.links[i].href);
			}
		}
	}
});

});

app.get('/success', (req, res) => {
	const payerId = req.query.PayerID;
	const paymentId = req.query.paymentId;

	const execute_payment_json = {
	 	"payer_id": payerId,
	 	"transactions": [{
	 		"amount": {
	 			"currency": "USD",
	 			"total": "25.00"
	 		}
		}]
	};

	paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
		if (error) {
			console.log(error.response);
			throw error;
		} else {
			console.log(JSON.stringify(payment));
			res.redirect('/success');
		}
});
});

app.get('/cancel', (req, res) =>
	res.send('Cancelled'));


/*
* Creates a unknown port 5000 for express server since we don't want our app to clash with well known
* ports such as 80 or 8080.
* */
const port = 5000;

// Starts the server and listen to port 5000
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});