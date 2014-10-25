/*
  routes index
*/
var crypto = require('crypto');
var fs = require('fs');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var moment = require('moment');

module.exports = function(app) {
  app.get('/', function(req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.getTen(null, page, function(err, posts, total) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: 'Home',
        posts: posts,
        page: page,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
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
    var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
    var newPost = new Post({
      name: currentUser.name,
      title: req.body.title,
      content: req.body.content,
      tags: tags
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

  app.get('/tags', checkNotLogin);
  app.get('/tags', function (req, res) {
    Post.getTags(function (err, tags) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('tags', {
        title: 'Tags',
        tags: tags,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags', checkNotLogin);
  app.get('/tags/:tag', function (req, res) {
    Post.getArticlesForTag(req.params.tag)
    .then(function(posts) {
      res.render('tag', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    })
    .fail(function(err) {
      req.flash('error',err); 
      return res.redirect('/');
    });
  });

  app.get('/search', checkNotLogin);
  app.get('/search', function (req, res) {
    Post.search(req.query.search)
    .then(function(posts) {
      res.render('search', {
        title: 'Search For:' + req.query.search,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    })
    .fail(function(err) {
      req.flash('error',err); 
      return res.redirect('/');
    });
  });
  

  app.get('/logout', checkNotLogin);
  app.get('/logout', function(req, res) {
    req.session.user = null;
    req.flash('success', 'Logout successful!');
    res.redirect('/');
  });

  app.get('/upload', checkNotLogin);
  app.get('/upload', function(req, res) {
    res.render('upload', {
      title: 'Upload Images',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', checkNotLogin);
  app.post('/upload', function(req, res) {
    for(var i in req.files) {
      if(req.files[i].size != 0) {
        var path = './public/images/' + req.files[i].name;
        fs.renameSync(req.files[i].path, path);
      } else {
        fs.unlinkSync(req.files[i].path);
      }
      req.flash('success', 'Upload successfully!');
      res.redirect('/upload');
    }
  });

  app.get('/u/:name', function(req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    User.get(req.params.name, function(err, user) {
      if (!user) {
        req.flash('error', 'User not exits!');
        return res.redirect('back');
      }
      Post.getTen(user.name, page, function(err, posts, total) {
        if (err) {
          posts = [];
          total = [];
        }
        res.render('user', {
          title: 'User ' + user.name,
          posts: posts,
          page: page,
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });
  });

  app.get('/u/:name/:title/:day', checkNotLogin);
  app.get('/u/:name/:title/:day', function(req, res) {
    Post.getOne(req.params.name, req.params.title, req.params.day, false, function(err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('article', {
        title: post.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/u/:name/:title/:day', checkNotLogin);
  app.post('/u/:name/:title/:day', function(req, res) {
    var date = new Date(),
        time = moment(date).format('YYYY-MM-DD HH:mm');
    var comment = {
      name: req.body.name,
      title: req.body.title,
      content: req.body.content,
      time: time
    }
    var newComment = new Comment(req.body.day, req.body.title, comment);
    newComment.save(function(err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', 'Comment successfully!');
      res.redirect('back');
    });
  });


  app.get('/edit/:name/:title/:day', checkNotLogin);
  app.get('/edit/:name/:title/:day', function(req, res) {
    var currentUser = req.session.user;
    Post.getOne(currentUser.name, req.params.title, req.params.day, true,function(err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      res.render('edit', {
        title: post.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/edit/:name/:title/:day', checkNotLogin);
  app.post('/edit/:name/:title/:day', function(req, res) {
    var currentUser = req.session.user;
    var title = req.params.title;
    var newTitle = req.body.title;
    var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
    Post.update(currentUser.name, title, newTitle, req.params.day, tags, req.body.content, function(err) {
      var returnUrl = "/u/" + currentUser.name + "/" + title + "/" + req.params.day;
      if (err) {
        req.flash('error', err); 
        return res.redirect(returnUrl); //redirect to article page
      }
      returnUrl = "/u/" + currentUser.name + "/" + newTitle + "/" + req.params.day;
      req.flash('success', 'Update successfully!');
      res.redirect(returnUrl);
    });
  });

  app.get('/remove/:name/:title/:day', checkNotLogin);
  app.get('/remove/:name/:title/:day', function(req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.title, req.params.day, function(err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect(back); //redirect to article page
      }
      req.flash('success', 'Remove successfully!');
      res.redirect('/');
    });
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