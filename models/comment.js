var mongodb = require('./db');

//don't forget to close db.

//Set up Comment Object
function Comment(name, day, title, comment) {
  this.name = name; //post's user's name
  this.title = post.title; //post's title
  this.day = day, //post's day
  this.comment = comment;
}

Comment.prototype.save = function(callback) {
  var comment = {
    name: this.name,
    title: this.title,
    day: this.day,
    comment: this.comment
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
      collection.update({
        "name": comment.name,
        "title": comment.title,
        "time.day": comment.day,
      },{
        $push: {"comments": comment}
      }, function(err) {
        mongodb.close();
        if (err) {
          callback(err);
        }
        callback(null);
      });
    });
  });
};

module.exports = Comment;

