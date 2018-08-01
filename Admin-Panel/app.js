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
var nodeoutlook = require('nodejs-nodemailer-outlook');
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
app.post('/changeS', (req, res, next) => {
    Order.findOneAndUpdate({_id: req.body.order_id}, {$set:{state: req.body.state}}, {new: true}, (err, doc) => {
        if(err) {
            console.log(err);
        } else {
            console.log(doc);
        }
        res.redirect('/');
    })
});

app.get('/:id/mail', (req, res, next) => {
    Order.findOne({ _id:req.params.id}).populate('pharmacy_id').populate('order_items').exec()
    .then((doc) => {
        time = moment(order.created_at).add(5, 'h'); time1 = moment(time).add(30, 'm');
        message = '<h3>From Admin Panel :</h3><h3>Pharmacy Name :'+ doc.pharmacy_id.pharma_name +'</h3><h4>Area Name : Kormangla</h4><h5>Medicine List : </h5>';
        message += '<table border="1"><tr><th>Medicine Name</th><th>Quantity</th><th>Cost</th></tr>';
        for(i =0;i<doc.order_items.length;i++) {
            message += '<tr><td>'+doc.order_items[i].medicento_name+'</td><td>'+doc.order_items[i].quantity+'</td><td>'+doc.order_items[i].total_amount+'</td></tr>'
        }
        nodeoutlook.sendEmail({
            auth: {
                user: "giteshshastri123@outlook.com",
                pass: "shastri@1"
            }, from: 'giteshshastri123@outlook.com',
            to: 'giteshshastri96@gmail.com, arpandebasis@medicento.com, rohit@medicento.com, miniintl@rediffmail.com, giteshmedicento@gmail.com, ',
            subject: 'Order From Medicento On ' + moment(time1).format('LLLL'),
            html: message + '</table><p>Billing Total : ' +doc.grand_total + '</p>',
        });
        console.log(message);
        res.redirect('/');
     })
    .catch((err) => {
        console.log('not sent' + err);
        res.redirect('/');
    });
});

app.post('/:id/delete', (req, res, next) => {
    Order.findOne({ _id:req.params.id}).populate('pharmacy_id').populate('order_items').exec()
    .then((doc) => {
            doc.remove();
            res.redirect('/');
        })
        .catch((err) => {
            console.log(err);
            res.redirect('/');
        });
});

app.get('/', (req, res, next) => {
    Order.find({}).populate('pharmacy_id').exec((err, orders) => {
        Order.find({ status: 'Canceled' }).populate('pharmacy_id').populate('order_items').exec((err, canceldOrders) => {
            Order.find({ status: 'Delivered' }).populate('pharmacy_id').populate('order_items').exec((err, deliverOrders) => {
                Order.find({ status: 'Active' }).populate('pharmacy_id').populate('order_items').exec((err, activeOrders) => {
                    res.render('index', { order_count: orders.length, 
                        orders, activeOrders, canceldOrders,deliverOrders,
                        order_delivered: deliverOrders.length,
                        order_active: activeOrders.length,
                        order_cancel: canceldOrders.length,
                        order_returns: 0,
                        order_sales: 10
                    });
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
