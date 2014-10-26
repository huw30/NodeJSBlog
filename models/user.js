var mongodb = require('mongodb').Db;
var crypto = require('crypto');
var settings = require('../settings');

//Set up User Object
function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
}

User.prototype.save = function(callback) {
  var md5 = crypto.createHash('md5'),
    email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
    avatar = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
  var user = {
    name: this.name,
    password: this.password,
    email: this.email,
    avatar: avatar
  };

  mongodb.connect(settings.url, function (err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('users', function (err, collection) {
      if (err) {
        db.close();
        return callback(err);
      }

      collection.insert(user, {
        safe: true
      }, function (err, user) {
        db.close();
        if (err) {
          return callback(err);
        }
        callback(null, user[0]);
      });

    });
  });
};

User.get = function(name, callback) {
  mongodb.connect(settings.url, function (err, db) {
    if (err) {
      console.log(err);
      return callback(err);
    }
    db.collection('users', function(err, collection) {
      if (err) {
        db.close();
        return callback(err);
      }
      collection.findOne({
        name: name
      }, function(err, user) {
        db.close();
        if (err) {
          return calback(err);
        }
        callback(null, user);
      });
    });
  });
};

module.exports = User;

