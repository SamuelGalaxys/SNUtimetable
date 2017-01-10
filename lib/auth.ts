import request = require('request');
import {UserModel, UserDocument} from '../model/user';
import errcode = require('./errcode');

export function local_auth (id: string, password: string, done: (err, user: UserDocument, info)=>void) {
  UserModel.get_local(id, function(err, user) {
    if(err) return done(err, null, null);
    if(!user) return done(null, null, { errcode: errcode.WRONG_ID, message: 'wrong id' });
    user.verify_password(password, function(err, is_match) {
      if(!is_match) return done(null, null, { errcode: errcode.WRONG_PASSWORD, message: 'wrong password' });
      var token = user.getCredentialHash();
      return done(null, user, {token: token});
    });
  });
}

export function fb_auth (fb_id: string, fb_token: string, done: (err, _, info)=>void) {
  if (process.env.NODE_ENV == 'mocha') {
    if (fb_token == 'correct' && fb_id == "1234") return done(null, null, {fb_name: "John", fb_id: "1234"});
    if (fb_token == 'correct2' && fb_id == "12345") return done(null, null, {fb_name: "Smith", fb_id: "12345"});
    return done(null, null, { errcode: errcode.WRONG_FB_TOKEN, message: 'incorrect token'});
  }
  request({
      url: "https://graph.facebook.com/me",
      method: "GET",
      json: true,
      qs: {access_token: fb_token}
  }, function (err, res, body){
    if (err || res.statusCode != 200 || !body || !body.id || fb_id !== body.id) {
      return done(err, null, { errcode:errcode.WRONG_FB_TOKEN, message: 'incorrect token'});
    } else {
      return done(null, null, {fb_name: body.name, fb_id: body.id});
    }
  });
}
