import express = require('express');
var router = express.Router();

import {UserModel} from '../../model/user';
import {CourseBookModel} from '../../model/courseBook';
import {TimetableModel} from '../../model/timetable';
import errcode = require('../../lib/errcode');
import * as log4js from 'log4js';
import * as facebook from '../../lib/facebook';
var logger = log4js.getLogger();

router.post('/request_temp', async function(req, res, next) {
  try {
    let tempUser = await UserModel.createTemp();
    let token = tempUser.getCredentialHash();
    res.json({message:"ok", token: token});
  } catch (err) {
    logger.error(err);
    res.status(500).json({errcode: errcode.SERVER_FAULT, message:"server fault"});
    return;
  }
});

/**
 * POST
 * id, password
 */
router.post('/login_local', async function(req, res, next) {
  try {
    let user = await UserModel.getByLocalId(req.body.id);
    if (!user) return res.status(403).json({errcode: errcode.WRONG_ID, message: "wrong id"});
    let passwordMatch = await user.verifyPassword(req.body.password);
    if (!passwordMatch) return res.status(403).json({errcode: errcode.WRONG_PASSWORD, message: "wrong password"});
    res.json({token: user.getCredentialHash()});
  } catch (err) {
    logger.error(err);
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"server fault"});
  }
});

/**
 * register local user
 * Registerations should be defined in this 'auth', not 'user', because
 * it needs to be accessed without token
 */
router.post('/register_local', async function (req, res, next) {
  try {
    let user = await UserModel.createLocal(req.body.id, req.body.password);
    await user.setUserInfo(req.body.email);
    res.json({message: "ok", token: user.getCredentialHash()});
  } catch (err) {
    if (err == errcode.INVALID_ID)
      return res.status(403).json({errcode:err, message:"invalid id"});
    if (err == errcode.DUPLICATE_ID)
      return res.status(403).json({errcode:err, message:"duplicate id"});
    if (err == errcode.INVALID_PASSWORD)
      return res.status(403).json({errcode:err, message:"invalid password"});
    logger.error(err);
    return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"server fault"});
  }
});

router.post('/login_fb', async function(req, res, next) {
  if (!req.body.fb_token || !req.body.fb_id)
    return res.status(400).json({errcode:errcode.NO_FB_ID_OR_TOKEN, message: "both fb_id and fb_token required"});

  try {
    let fbInfo = await facebook.getFbInfo(req.body.fb_id, req.body.fb_token);
    let user = await UserModel.getFbOrCreate(fbInfo.fbName, fbInfo.fbId);
    res.json({token: user.getCredentialHash()});
  } catch (err) {
    if (err == errcode.WRONG_FB_TOKEN)
      return res.status(403).json({ errcode:errcode.WRONG_FB_TOKEN, message: "wrong fb token"});
    logger.error(err);
    return res.status(500).json({ errcode:errcode.SERVER_FAULT, message: 'failed to create' });
  }
});

export = router;
