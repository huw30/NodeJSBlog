var mongodb = require('./db');
var moment = require('moment');
var markdown = require('markdown').markdown;

//don't forget to close db.

//Set up User Object
function Post(post) {
  this.name = post.name;
  this.title = post.title;
  this.content = post.content;
}

Post.prototype.save = function(callback) {
  var date = new Date();
  var time = {
    date: date,
    year: moment(date).year(),
    month: moment(date).format('YYYY-MM'),
    day: moment(date).format('YYYY-MM-DD'),
    minute: moment(date).format('YYYY-MM-DD HH:mm')
  };
  var post = {
    name: this.name,
    title: this.title,
    content: this.content,
    time: time
  };

  mongodb.open(function(err, db) {
    if (err) {
      callback(err);
    }
    db.collection('posts',function(err, collection) {
      if (err) {
        mongodb.close();
        callback(err);
      }
      collection.insert(post, {
        safe: true
      }, function(err, post) {
        mongodb.close();
        if (err) {
          callback(err);
        }
        console.log(post);
        callback(null, post[0]);
      });
    });
  });
};

Post.getAll = function(name, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      callback(err);
    }
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        callback(err);
      }

      var query = {};
      if (name) {
        query.name = name;
      }
      collection.find(query).sort({
        time: -1
      }).toArray(function(err, docs) {
        mongodb.close();
        if (err) {
          callback(err);
        }
        docs.forEach(function(doc) {
          doc.content = markdown.toHTML(doc.content);
        });
        callback(null, docs);
      });
    });
  });
};

Post.getOne = function(name, title, day, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      callback(err);
    }

    db.collection('posts', function(err, collection) {
      if (err) {
        callback(err);
      }
      collection.findOne({
        "name": name,
        "title": title,
        "time.day": day
      }, function(err, post) {
        mongodb.close();
        if (err) {
          callback(err);
        }
        post.content = markdown.toHTML(post.content);
        callback(null, post);
      });
    });
  });
};

module.exports = Post;

