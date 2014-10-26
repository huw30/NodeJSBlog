var mongodb = require('mongodb').Db;
var settings = require('../settings');

//don't forget to close db.

//Set up Comment Object
function Comment(day, title, comment) {
  this.title = title; //post's title
  this.day = day, //post's day
  this.comment = comment;
}

Comment.prototype.save = function(callback) {
  var comment = this.comment,
      title = this.title,
      day = this.day;
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
        "title": title,
        "time.day": day,
      },{
        $push: {"comments": comment}
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

module.exports = Comment;

