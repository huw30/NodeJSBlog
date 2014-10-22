/*
  routes index
*/
var crypto = require('crypto');
var User = require('../models/user.js');

module.exports = function(app) {
  app.get('/', function(req, res) {
    res.render('index', {title : 'Home'});
  });
  app.get('/login', function(req, res) {
    res.render('login',{title: 'Login'});
  });
  app.post('/login', function(req, res) {
  });
  app.get('/register', function(req, res) {
    res.render('register',{title: 'Register'});
  });
  app.post('/register', function(req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];

    if (password_re != password) {
      req.flash('error', 'The two password is not the same!');
      return res.redirect('/register');
    }
    var md5 = crypto.createHash('md5');
    password = md5.update(req.body.password).digest('hex');

    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });

    //Check if user name exists

    User.get(newUser.name, function(err, user) {
      if (err) {
        req.flash('error', 'User name already exists!');
        return res.redirect('/register');
      }

      newUser.save(function(err, user) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/register');
        }
        req.session.user = user;
        req.flash('success', 'Register successful!');
        res.redirect('/');
      });
    });
  });
  app.get('/post', function(req, res) {
    res.render('post',{title: 'Post'});
  });
  app.post('/post', function(req, res) {
  });
  app.get('/logout', function(req, res) {
  });
};