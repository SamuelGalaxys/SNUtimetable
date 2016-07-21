var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var secretKey = require('../../config/secretKey');

var CourseBook = require('../../model/courseBook');

var authRouter = require('./auth');
var timetableRouter = require('./timetable');
var searchQueryRouter = require('./searchQuery');
var tagsRouter = require('./tags');
var notificationRouter = require('./notification');
var apiKey = require('../../config/apiKey');
var User = require('../../model/user');

/**
 * Check API Key
 */
router.use(function(req, res, next) {
  var token = req.headers['x-access-apikey'];
  apiKey.validateKey(token).then(function(){
    next();
  }, function(err) {
    res.status(403).send(err);
  });
});

router.get('/course_books', function(req, res, next) {
  CourseBook.find({},'year semester', {sort : {year : -1, semester : -1 }}, function (err, courseBooks) {
    res.send(200, courseBooks)
  });
});

router.use('/search_query', searchQueryRouter);

router.use('/tags', tagsRouter);

router.get('/app_version', function(req, res, next) {
   //FIXME : check for app_version and return the version
   // Include version info in the api key??
   res.send({version : 0.1});
});

router.use('/auth', authRouter);

/**
 * Token Authenticator
 * Checks if the user is logged in
 * Which means all routers below this need authentication
 * If the user object is modified, you should re-login!!
 */
router.use(function(req, res, next) {
  if(req.user) return next();
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, secretKey.jwtSecret, function(err, decoded) {
      if (err) {
        return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        User.getUserFromCredential(decoded).then(function(user){
          req.user = user;
          next();
        }, function (err) {
          console.log(err);
          return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });
        });
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(401).send({
      success: false,
      message: 'No token provided.'
    });

  }
});

router.use('/tables', timetableRouter);

router.use('/notification', notificationRouter);

module.exports = router;
