const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const Pharmacy = require('./models/pharmacy');
const Product = require('./models/Product');
const InventoryProduct = require('./models/InventoryProduct');
const ProductAndMedi = require('./models/productandmedi');
const Inventory = require('./models/Inventory');
const OrderItem = require('./models/SalesOrderItem');
const Order = require('./models/SalesOrder');
const profile = require('./models/profile');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const moment = require('moment');
const MONGODB_URI = "mongodb://GiteshMedi:shastri1@ds263590.mlab.com:63590/medicento";
mongoose.connect(MONGODB_URI);
mongoose.Promise = global.Promise;

app.use(require('express-session')({
    secret: "Gitesh Secret Page",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));
app.locals.moment = moment;

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.get('/history', isLoggedIn , (req, res, next) => {
    Order.find({}).populate('pharmacy_id').exec((err, orders) => {
        res.render('history', {orders: orders});
    });
    });

app.get('/inventory', isLoggedIn, (req, res, next) => {
    ProductAndMedi.find({}).populate('product_id').populate('inventory_product_id').exec((err, pros) => {
        res.render('inventory', {pros: pros});
    });
});

app.get('/addRetailer', isLoggedIn, (req, res, next) => {
    res.render('addRetailer');
});

app.get('/addDistributor', isLoggedIn , (req, res, next) => {
    res.render('addDistrbutor');
});

app.get('/resetPass', isLoggedIn, (req, res, next) => {
    res.render('resetPass');
});

app.get('/contact', isLoggedIn, (req, res, next) => {
    res.render('contact');
});

app.get('/addSalesPerson', isLoggedIn, (req, res, next) => {
    res.render('addSalesPerson');
});

app.get('/setting', isLoggedIn, (req, res, next) => {
    res.render('setting');
});

//User Routes for login,logout,signup and profile

app.get('/profile', isLoggedIn, (req, res, next) => {
    res.render('profile');
});

app.get('/login', (req, res, next) => {
    res.render('profile-login');
});

app.post('/login', passport.authenticate("local", { successRedirect: "/" , failureRedirect: "/login"}), (req, res) => {
});

app.get('/signup', (req, res, next) => {
    res.render('pages-sign-up');
});

app.post('/signup', (req, res) => {
    const newUser = new User({
        username: req.body.nick,
        useremail: req.body.email,
    });
    User.register(newUser, req.body.pass, function (err, user) {
        if (err) {
            console.log(err);
            return res.render('pages-sign-up');
        }
        res.redirect('/profile');
    });
    });

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/forgot-password', (req, res, next) => {
    res.render('pages-forgot-password');
});

app.use('/', (req, res, next) => {
    orders = [];
    Order.find({}).populate('pharmacy_id').exec((err, orders) => {
        orders = orders.slice(-6);
        User.count({}, (err, c) => {
            Order.count({ status: 'completed' }, (err, com) => {
                Order.find({ status: 'active' }).populate('pharmacy_id').exec((err, pendingOrders) => {
                    res.render('index', { count: c, orders, pendingOrders, order_completed: com, order_pending: pendingOrders.length});
                });
            });
        });
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

module.exports = app;
