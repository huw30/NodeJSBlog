/*
  routes index
*/
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');

module.exports = function(app) {
  app.get('/', function(req, res) {
    Post.get(null, function(err, posts) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: 'Home',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  
  app.get('/login', checkLogin);
  app.get('/login', function(req, res) {
    res.render('login',{
      title: 'Login',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  
  app.post('/login', checkLogin);
  app.post('/login', function(req, res) {
    var md5 = crypto.createHash('md5'),
    password = md5.update(req.body.password).digest('hex');

    User.get(req.body.name, function(err, user) {
      if (!user) {
        req.flash('error', 'User does not exist!');
        return res.redirect('/login');
      }

      if (user.password != password) {
        req.flash('error', 'Incorrect password');
        return res.redirect('/login');
      }

      req.session.user = user;
      req.flash('success', 'Login successful!');
      res.redirect('/');
    });
  });
  
  app.get('/register', checkLogin);
  app.get('/register', function(req, res) {
    res.render('register',{
      title: 'Register',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  
  app.post('/register', checkLogin);
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
  
  app.get('/post', checkNotLogin);
  app.get('/post', function(req, res) {
    res.render('post',{
      title: 'Post',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/post', checkNotLogin);
  app.post('/post', function(req, res) {
    var currentUser = req.session.user;
    var newPost = new Post({
      name: currentUser.name,
      title: req.body.title,
      content: req.body.content
    });

    newPost.save(function(err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/post');
      }
      req.flash('success', 'Blog is posted!');
      res.redirect('/');
    });
  });
  
  app.get('/logout', checkNotLogin);
  app.get('/logout', function(req, res) {
    req.session.user = null;
    req.flash('success', 'Logout successful!');
    res.redirect('/');
  });
  //check whether the user is logged out
  function checkNotLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', 'Not login!');
      res.redirect('/login');
    }
    next();
  }
  //check whether user is logged in
  function checkLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', 'Already login!');
      res.redirect('back');
    }
    next();
  }
};