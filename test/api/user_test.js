/**
 * test/api/user_test.js
 * These tests are for routes/api/user.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */
"use strict";

var assert = require('assert');

module.exports = function(app, db, request) {
  it('Log-in succeeds', function(done) {
    request.post('/api/auth/login_local')
      .send({id:"snutt", password:"abc1234"})
      .expect(200)
      .end(function(err, res){
        if (err) console.log(res);
        done(err);
      });
  });

  describe('Log-in fails when', function() {
    it('user does not exist', function(done) {
      request.post('/api/auth/login_local')
        .send({id:"FakeSnutt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'wrong id');
          done(err);
        });
    });
    it('wrong password', function(done) {
      request.post('/api/auth/login_local')
        .send({id:"snutt", password:"abc12345"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'wrong password');
          done(err);
        });
    });
  });

  it('Register succeeds', function(done) {
    request.post('/api/auth/register_local')
      .send({id:"snutt2", password:"abc1234*"})
      .expect(200)
      .end(function(err, res){
        assert.equal(res.body.message, 'ok');
        done(err);
      });
  });

  describe('Register fails when', function() {
    it('No ID', function(done) {
      request.post('/api/auth/register_local')
        .send({password:"IDontNeedID"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Duplicate ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"snutt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'same id already exists');
          done(err);
        });
    });

    it('Weird ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"snutt##*", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Too short ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"tt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Too long ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"ThisIsVeryLongIdYouKnowThatThisIsFreakingLongManVeryLong", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('No password', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"IDontNeedPw"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password too short', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"idiot", password:"a1111"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password too long', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"dumb", password:"abcdefghijklmnopqrst1"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password only digits', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"numb", password:"111111"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password only letters', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"numbnumb", password:"abcdef"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password with whitespace', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"hacker", password:"sql injection"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });
  });
};
