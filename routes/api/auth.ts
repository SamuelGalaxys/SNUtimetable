import express = require('express');
var router = express.Router();

import {UserModel, UserDocument} from '../../model/user';
import {CourseBookModel} from '../../model/courseBook';
import {TimetableModel} from '../../model/timetable';
import auth = require('../../lib/auth');
import errcode = require('../../lib/errcode');
import * as log4js from 'log4js';
var logger = log4js.getLogger();

router.post('/request_temp', function(req, res, next) {
  UserModel.create_temp().then(function(user){
    CourseBookModel.getRecent({lean:true}).then(function(coursebook){
      return TimetableModel.createTimetable({
        user_id : user._id,
        year : coursebook.year,
        semester : coursebook.semester,
        title : "나의 시간표"});
    }).then(function(timetable){
      var token = user.getCredentialHash();
      return res.json({message:"ok", token: token});
    }).catch(function(err){
      logger.error(err);
      var token = user.getCredentialHash();
      return res.json({message:"ok, but no default table", token: token});
    });
  }, function(err) {
    res.status(500).json({errcode: errcode.SERVER_FAULT, message:"server fault"});
  });
});

/**
 * POST
 * id, password
 */
router.post('/login_local', function(req, res, next) {
  auth.local_auth(req.body.id, req.body.password, function(err, user, info) {
    if (err) { return res.status(403).json({errcode: err.errcode, message:err.message}); }
    if (!user || !info.token) { 
      logger.error("/login_local: Both user and info.token necessary")
      return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"server fault"});
    }
    res.json({token: info.token});
  });
});

/**
 * register local user
 * Registerations should be defined in this 'auth', not 'user', because
 * it needs to be accessed without token
 */
router.post('/register_local', function (req, res, next) {
  UserModel.create_local(null, req.body.id, req.body.password, async function(err, user) {
    if (err) {
      if (err == errcode.INVALID_ID)
        return res.status(403).json({errcode:err, message:"invalid id"});
      if (err == errcode.DUPLICATE_ID)
        return res.status(403).json({errcode:err, message:"duplicate id"});
      if (err == errcode.INVALID_PASSWORD)
        return res.status(403).json({errcode:err, message:"invalid password"});
      logger.error(err);
      return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"server fault"});
    }
    if (req.body.email) user.email = req.body.email;
    try {
      await user.save();
    } catch (err) {
      logger.error("/register_local : Failed to save user email\n", err);
    }
    CourseBookModel.getRecent({lean:true}).then(function(coursebook){
      return TimetableModel.createTimetable({
        user_id : user._id,
        year : coursebook.year,
        semester : coursebook.semester,
        title : "나의 시간표"});
    }).then(function(timetable){
      var token = user.getCredentialHash();
      return res.json({message:"ok", token: token});
    }).catch(function(err){
      logger.error(err);
      var token = user.getCredentialHash();
      return res.json({message:"ok, but no default table", token: token});
    });
  });
});

router.post('/login_fb', function(req, res, next) {
  if (!req.body.fb_token || !req.body.fb_id)
    return res.status(400).json({errcode:errcode.NO_FB_ID_OR_TOKEN, message: "both fb_id and fb_token required"});

  auth.fb_auth(req.body.fb_id, req.body.fb_token, function(err, user, info) {
    if (err) {
      if (err.errcode) return res.status(403).json({errcode:err.errcode, message:err.message});
      else return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"server fault"});
    }
    if (!info.fb_id) return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"server fault"});
    UserModel.get_fb_or_create(info.fb_name, info.fb_id, function(err, user) {
      if (err || !user) {
        logger.error(err);
        return res.status(500).json({ errcode:errcode.SERVER_FAULT, message: 'failed to create' });
      }
      var token = user.getCredentialHash();
      res.json({ token: token});
    });
  });
});

export = router;
