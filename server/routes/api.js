const router = require('express').Router();
const User = require('../models/userSchema');
const jwtHandler = require('./../auth/token');
const utils = require('./../utils/utils');
const jwt = require('jsonwebtoken');
// router is express router
// get is someone asking info for server (Server job if some-one mde get request to this page)
// post is some one giving info to server for posting in database maybe (server job if someone made post request to this page)
router.post('/verifyuser', (req, res) => { //some one made post request with some data as req
    console.log(req.body);
    User.findOne({ username: req.body.username }).then(function (result) {
        //result can be either true--existing in database
        // or false-- not in database
        if (result) //runs for true
            req.check('username', 'User already exists').not().equals(result.username);
        req.check('fname', 'First Name missing').notEmpty();
        req.check('lname', 'Last Name missing').notEmpty();
        req.check('email', 'Not a valid email').isEmail();
        req.check('password', 'Password cannot be empty').notEmpty();
        req.check('password', 'Passwords don\'t match').equals(req.body.rpassword);
        req.check('phoneno', 'Phoneno is invalid').isMobilePhone(["en-IN"]);
       User.findOne({email: req.body.email}).then(result => {
            if(result){
                req.check('email', 'Email already in use').not().equals(result.email);
            }
            const errors = req.validationErrors();
            let response;
            if (errors) {
                response = {
                    success: false,
                    errors,
                    //errors:eroors but ES6 no need to mention
                }
                res.send(response);
            }
            else {
                response = {
                    success: true,
                    errors: null
                }
                // this is similar to User.create({object});
                User.saveUser(req.body, function (result) {
                    res.send(response);
                });
            }
        });
    });
});

router.post('/updateuser', (req, res) => {
        req.check('fname', 'First Name missing').notEmpty();
        req.check('lname', 'Last Name missing').notEmpty();
        req.check('email', 'Not a valid email').isEmail();
        req.check('password', 'Password cannot be empty').notEmpty();
        req.check('phoneno', 'Phone number is invalid').isMobilePhone(["en-IN"]);
        User.findOne({email: req.body.email}).then(result => {
           /* if(result.username!==req.body.username){
                req.check('email', 'Email already in use').not().equals(result.email);
            }*/
            const errors = req.validationErrors();
            let response;
            if (errors) {
                response = {
                    success: false,
                    errors,
                }
                res.send(response);
            }
            else {
                response = {
                    success: true,
                    errors: null
                }
                User.findOneAndUpdate({username:req.body.username},{fname:req.body.fname,lname:req.body.lname,email:req.body.email,password:req.body.password,phoneno:req.body.phoneno,roomno:req.body.roomno}).then(function (result) {
                    /*console.log(response);*/
                    res.send(response);
                });
            }
        });
});

router.get("/trial",function(req,res){
    res.send({message:"Connected"});
});


router.post('/login', (req, res) => {
    User.findOne({ username: req.body.username }).then(result => {
        let err = false;
        let success = true;
        let cleanUser;
        if(result) {
            if(result.password !== req.body.password) {
                err = true;
                success = false;
            }
            cleanUser = utils.getCleanUser(result);
        }
        else {
            err = true;
            success = false;
        }
        
        const response = {
            success: success,
            error: err,
            msg: 'Invalid username or password',
            user: cleanUser,
            token: null
        };// this is send to caller
        if(err === false) {
            let token = jwtHandler.generateToken(result);
            response.token = token;
            console.log(token);
        }
        res.send(response);
    });
});

router.get('/authorize', (req, res) => {
    let token = req.query.token;
    jwt.verify(token, process.env.JWT_SECRET, function (err, user) {
        if(err) throw err;
        User.findOne({ username: user.username }).then(result => {
            let response;
            if(result) {
                user = utils.getCleanUser(user);
                response = {
                    user,
                    success: true
                }
            }
            else {
                response = {
                    user: null,
                    success: false
                }
            }
            res.json(response);
        });
    });
});

const Product = require('./../models/productSchema');

router.post('/additem', (req, res) => {
    const product = new Product({
        ...req.body.formData
        //spreading array ...arr
    });// Product schema for creating new product element
    product.save().then(() => {
        Product.find({}).then(result => {
            res.send(result);
        });
    });
});
// owner is a attributr in productschema
//same router for that edit page send res(result); 
router.get('/getitems', (req, res) => {
    Product.find({owner: req.query.username}).then(result => {
        res.send(result);// sed complete Product object data
    });
});

router.post('/updateitemstatus', (req, res) => {
    Product.findOneAndUpdate({ _id: req.body.id }, { status: req.body.status }).then(result => {
        res.send('ok');
    });
});

module.exports = router;