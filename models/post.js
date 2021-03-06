var mongodb = require('mongodb').Db;
var moment = require('moment');
var markdown = require('markdown').markdown;
var vow = require('vow');
var settings = require('../settings');

//don't forget to close db.

//Set up Post Object
function Post(post) {
  this.name = post.name;
  this.title = post.title;
  this.content = post.content;
  this.tags = post.tags;
  this.avatar = post.avatar;
}

Post.prototype.save = function(callback) {
  var date = moment.utc().toDate();
  var time = {
    date: date,
    year: moment(date).year(),
    month: moment(date).format('YYYY-MM'),
    day: moment(date).format('YYYY-MM-DD'),
    minute: moment.utc().format('YYYY-MM-DD HH:mm')
  };
  var post = {
    name: this.name,
    avatar: this.avatar,
    title: this.title,
    content: this.content,
    time: time,
    tags: this.tags,
    comments:[],
    viewsCount: 0
  };

  mongodb.connect(settings.url, function(err, db) {
    if (err) {
      callback(err);
    }
    db.collection('posts',function(err, collection) {
      if (err) {
        db.close();
        return callback(err);
      }
      collection.insert(post, {
        safe: true
      }, function(err, post) {
        db.close();
        if (err) {
          return callback(err);
        }
        callback(null, post[0]);
      });
    });
  });
};

Post.getTen = function(name, page, callback) {
  mongodb.connect(settings.url, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection) {
      if (err) {
        db.close();
        return callback(err);
      }

      var query = {};
      if (name) {
        query.name = name;
      }
      //get 
      collection.count(query, function(err, totalPosts) {
        collection.find(query, {
          skip: (page-1)*10,
          limit: 10
        }).sort({
          time: -1
        }).toArray(function(err, posts) {
          db.close();
          if (err) {
            return callback(err);
          }
          posts.forEach(function(post) {
            post.content = markdown.toHTML(post.content);
            if(post.comments.length > 0) {
              post.comments.forEach(function(comment) {
                comment.content = markdown.toHTML(comment.content);
              });
            }
          });
          callback(null, posts, totalPosts);
        });
      });
    });
  });
};

Post.getOne = function(name, title, day, isMd, callback) {
  mongodb.connect(settings.url, function(err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function(err, collection) {
      if (err) {
        return callback(err);
      }
      collection.findOne({
        "name": name,
        "title": title,
        "time.day": day
      }, function(err, post) {
        if (err) {
          db.close();
          return callback(err);
        }

        if (post) {
          collection.update({
            "name": name,
            "time.day": day,
            "title": title
          }, {
            $inc: {"viewsCount": 1}
          }, function(err) {
            db.close();
            if (err) {
              return callback(err);
            }
          });
        }
        if (!isMd && post) { //check whether need markdown or html
          post.content = markdown.toHTML(post.content);
        }
        if( post && post.comments.length > 0) {
          post.comments.forEach(function(comment) {
            comment.content = markdown.toHTML(comment.content);
          });
        }
        callback(null, post);
      });
    });
  });
};

Post.update = function(name, title, newTitle, day, tags, content, callback) {
  mongodb.connect(settings.url, function(err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts',function(err, collection) {
      if (err) {
        db.close();
        return callback(err);
      }
      collection.update({
        "name" : name,
        "title" : title,
        "time.day" : day,
      }, {
        $set: {
          title: newTitle,
          content: content,
          tags: tags
        }
      }, function(err) {
        db.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

Post.remove = function(name, title, day, callback) {
  mongodb.connect(settings.url, function(err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection) {
      if (err) {
        return callback(err);
      }
      collection.remove({
        "name": name,
        "title": title,
        "time.day": day
      }, {
         w : 1
      }, function(err) {
        db.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

Post.getTags = function(callback) {
  mongodb.connect(settings.url, function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        db.close();
        return callback(err);
      }
      collection.distinct("tags", function (err, tags) {
        db.close();
        if (err) {
          return callback(err);
        }
        callback(null, tags);
      });
    });
  });
};

Post.getArticlesForTag = function(tag) {
  var deferred = vow.defer();

  mongodb.connect(settings.url, function (err, db) {
    if (err) {
      deferred.reject(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        db.close();
        deferred.reject(err);
      }
      collection.find({
        "tags" : tag
      }).sort({
        time: -1
      }).toArray(function (err, posts) {
        db.close();
        if (err) {
          deferred.reject(err);
        }
        deferred.resolve(posts);
      });
    });
  });
  return deferred.promise();
};

Post.search = function(searchText) {
  var deferred = vow.defer();
  var pattern = new RegExp("^.*" + searchText + ".*$", "i");
  mongodb.connect(settings.url, function (err, db) {
    if (err) {
      db.close();
      deferred.reject(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        db.close();
        deferred.reject(err);
      }
      collection.find({
        "title" : pattern
      }).sort({
        time: -1
      }).toArray(function (err, posts) {
        db.close();
        if (err) {
          deferred.reject(err);
        }
        deferred.resolve(posts);
      });
    });
  });
  return deferred.promise();
};

module.exports = Post;

