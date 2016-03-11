var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var secretKey = require('../../config/secretKey');

var User = require('../../model/user');

/*
 * POST
 * id, password
 */
router.post('/login_local', function(req, res, next) {
  User.findOne({'local.id' : req.body.id },
    function(err, user) {
      if(err) return res.status(500).send('unknown error');
      if(!user) {
        res.status(403).send('Authentication failed. User not found.');
      } else if (user) {
        user.verify_password(req.body.password, function(err, is_match) {
          if(!is_match) res.status(403).send('Authentication failed. Wrong password.');
          else {
            var token = jwt.sign(user, secretKey.jwtSecret, {
              expiresIn : '180d' //FIXME : expire time
            });
            res.json(token);
          }
        })
      }
    }
  );
});




module.exports = router;
