"use strict";

var express = require('express');
var router = express.Router();

var User = require('../../model/user');
var CourseBook = require('../../model/courseBook');
var Timetable = require('../../model/timetable');
var auth = require('../../lib/auth');

/**
 * POST
 * id, password
 */
router.post('/login_local', function(req, res, next) {
  auth.local_auth(req.body.id, req.body.password, function(err, user, info) {
    if (err) { return res.status(403).json({message:err.message}); }
    if (!user || !info.token) { return res.status(403).json({message:info.message}); }
    res.json({token: info.token});
  });
});

/**
 * register local user
 * Registerations should be defined in this 'auth', not 'user', because
 * it needs to be accessed without token
 */
router.post('/register_local', function (req, res, next) {
  User.create_local(null, req.body.id, req.body.password, function(err, user) {
    if (err) {
      return res.status(403).json({message:err.message});
    }
    CourseBook.getRecent({lean:true}).then(function(coursebook){
      return Timetable.createTimetable({
        user_id : user._id,
        year : coursebook.year,
        semester : coursebook.semester,
        title : "나의 시간표"});
    }).then(function(timetable){
      var token = user.getCredentialHash();
      return res.json({message:"ok", token: token});
    }).catch(function(err){
      console.log(err);
      var token = user.getCredentialHash();
      return res.json({message:"ok, but no default table", token: token});
    });
  });
});

router.post('/login_fb', function(req, res, next) {
  if (!req.body.fb_token || !req.body.fb_id)
    return res.status(400).json({message: "both fb_id and fb_token required"});

  auth.fb_auth(req.body.fb_id, req.body.fb_token, function(err, user, info) {
    if (err) return res.status(403).json({message:err.message});
    if (!info.fb_id) return res.status(403).json({message:info.message});
    User.get_fb_or_create(info.fb_name, info.fb_id, function(err, user) {
      if (err || !user) {
        console.log(err);
        return res.status(500).json({ message: 'failed to create' });
      }
      var token = user.getCredentialHash();
      res.json({ token: token});
    });
  });
});

module.exports = router;
