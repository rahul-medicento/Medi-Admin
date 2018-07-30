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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'))
app.locals.moment = moment;

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.get('/history', isLoggedIn , (req, res, next) => {
    Order.find({}).populate('pharmacy_id').populate('order_items').exec((err, orders) => {
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


// -------- Dashboards - routes ---------------------- 

app.get('/sales_dashboard', isLoggedIn, (req, res) => {
    res.render('sales_dashboard');
});

app.get('/area_dashboard', isLoggedIn, (req, res) => {
    res.render('area_dashboard');
});

app.get('/delivery_dashboard', isLoggedIn, (req, res) => {
    res.render('delivery_index');
});

app.get('/pharmacy_dashboard', isLoggedIn, (req, res) => {
    res.render('pharmacy_dashboard');
});

// -------------pharmacy route-----------
app.get('/pharmacy', (req, res) => {
    Order.find({}, (err, orders) => {
        if(err){
            return console.log(err);
        }
        Pharmacy.find({}, (err, pharmacies) => {
            if(err){
                return console.log(err)
            }
            var pharmacy_list = []
            pharmacies.forEach((pharmacy) => {
                var name = pharmacy.pharma_name;
                var id = pharmacy._id;
                var totalAmount = paidAmount = balanceAmount = returnAmount = 0;

                filteredOrders = orders.filter((order) => {
                    return id.equals(order.pharmacy_id)
                });
                // console.log(filteredOrders)
                var totalOrders = filteredOrders.length;
                filteredOrders.forEach((order) => {
                    totalAmount += +order.grand_total;
                });
                pharmacy_list.push({name, id, totalAmount, paidAmount, balanceAmount, returnAmount, totalOrders})
            });
            // console.log(pharmacy_list);
            res.render('pharmacy_list', {pharmacy_list});
        });
    })
});

//----------------index - route ---------------------

app.get('/', (req, res, next) => {
    orders = [];
    Order.find({}).populate('pharmacy_id').exec((err, orders) => {
        orders = orders.slice(-6);
            Order.find({ status: 'Completed' }).populate('pharmacy_id').populate('order_items').exec((err, completedOrders) => {
                Order.find({ status: 'Active' }).populate('pharmacy_id').populate('order_items').exec((err, activeOrders) => {
                    res.render('index', { order_count: orders.length, 
                        orders, activeOrders, completedOrders,
                        order_completed: completedOrders.length, 
                        order_active: activeOrders.length,
                        order_cancel: 0,
                        order_returns: 0,
                        order_sales: 10
                    });
                });
            });
        });
    });

app.post('/', (req, res, next) => {
    Order.findOneAndUpdate({_id: req.body.order_id}, {$set:{status: req.body.status}}, {new: true}, (err, doc) => {
        if(err) {
            console.log(err);
        } else {
            console.log(doc);
        }
        res.redirect('/');
    })
});  
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};





module.exports = app;
