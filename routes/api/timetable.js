var express = require('express');
var router = express.Router();

var timeJsonToMask = require('../../lib/util').timeJsonToMask;

var Timetable = require('../../model/timetable');
var LectureModel = require('../../model/lecture');
var util = require('../../lib/util');
var Lecture = LectureModel.Lecture;
var UserLecture = LectureModel.UserLecture;

router.get('/', function(req, res, next) { //timetable list
  Timetable.find({'user_id' : req.user._id}).select('year semester title _id updated_at').lean()
  .exec(function(err, timetables) {
    if(err) return res.status(500).send('fetch timetable list failed');
    res.json(timetables);
  });
});

router.get('/:id', function(req, res, next) { //get
  Timetable.findOne({'user_id': req.user._id, '_id' : req.params.id}).lean()
  .exec(function(err, timetable) {
    if(err) return res.status(500).send("find table failed");
    if(!timetable) return res.status(404).send('timetable not found');
    res.json(timetable);
  });
});

router.post('/', function(req, res, next) { //create
  var timetable = new Timetable({
    user_id : req.user._id, 
    year : req.body.year,
    semester : req.body.semester,
    title : req.body.title,
    lecture_list : []
  });
  timetable.checkDuplicate(function (err) {
    if (err) return res.status(403).send('duplicate title');
    timetable.save(function(err, doc) {
      if(err) return res.status(500).send('insert timetable failed');
      res.send(doc._id);
    });
  });

});

/**
 * POST /tables/:id/lecture
 * add a lecture into a timetable
 * param ===================================
 * json object of lecture to add
 */
router.post('/:id/lecture', function(req, res, next) {
  Timetable.findOne({'user_id': req.user_id, '_id' : req.params.id})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      var json = req.body;
      if (json.class_time_json) json.class_time_mask = timeJsonToMask(json.class_time_json);
      else if (json.class_time_mask) delete json.class_time_mask;
      /*
       * Sanitize json using object_del_id.
       * If you don't do it,
       * the existing lecture gets overwritten
       * which is potential security breach.
       */
      util.object_del_id(json);
      var lecture = new UserLecture(json);
      timetable.add_lecture(lecture, function(err){
        if(err) {
          return res.status(403).send("insert lecture failed");
        }
        res.json(lecture);
      });
    })
});

/**
 * POST /tables/:id/lectures
 * add lectures into a timetable
 * param ===================================
 * lectures : array of lectures to add
 */
/*
router.post('/:id/lectures', function(req, res, next) {
  Timetable.findOne({'user_id': req.user_id, '_id' : req.params.id})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      var lectures = [];
      var lectures_raw = req.body['lectures'];
      for (var lecture_raw in lectures_raw) {
        lecture_raw.class_time_mask = timeJsonToMask(lecture_raw.class_time_json);
        var lecture = new Lecture(lecture_raw);
        lectures.push(lecture);
      }
      timetable.add_lectures(lectures, function(err){
        if(err) return res.status(500).send("insert lecture failed");
        res.send("ok");
      });
  })
});
*/

/**
 * PUT /tables/:table_id/lecture/:lecture_id
 * update a lecture of a timetable
 * param ===================================
 * json object of lecture to update
 */

// TODO : duplicate timetable query fix
router.put('/:table_id/lecture/:lecture_id', function(req, res, next) {
  var lecture_raw = req.body;
  if(!lecture_raw || Object.keys(lecture_raw).length < 1) return res.status(400).send("empty body");

  if (!req.params["lecture_id"])
    return res.status(400).send("need lecture_id");

  Timetable.findOne({'user_id': req.user_id, '_id' : req.params["table_id"]})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      if (lecture_raw.class_time_json)
        lecture_raw.class_time_mask = timeJsonToMask(lecture_raw.class_time_json);
      timetable.update_lecture(req.params["lecture_id"], lecture_raw, function(err, doc) {
        if(err) {
          if (err.message == "modifying identities forbidden")
            return res.status(403).send(err.message);
          if (err.message == "lecture not found")
            return res.status(404).send(err.message);
          console.log(err);
          return res.status(500).send("update lecture failed");
        }
        res.json(doc);
      });
    })
});

/**
 * DELETE /tables/:table_id/lecture/:lecture_id
 * delete a lecture from a timetable
 */
router.delete('/:table_id/lecture/:lecture_id', function(req, res, next) {
  Timetable.findOneAndUpdate(
    {'user_id': req.user_id, '_id' : req.params["table_id"]},
    { $pull: {lecture_list : {_id: req.params["lecture_id"]} } })
    .exec(function (err, doc) {
      if (err) {
        console.log(err);
        return res.status(500).send("delete lecture failed");
      }
      if (!doc) return res.status(404).send("timetable not found");
      if (!doc.lecture_list.id(req.params["lecture_id"]))
        return res.status(404).send("lecture not found");
      res.send("ok");
    });
});

/**
 * DELETE /tables/:id
 * delete a timetable
 */
router.delete('/:id', function(req, res, next) { // delete
  Timetable.findOneAndRemove({'user_id': req.user._id, '_id' : req.params.id}).lean()
  .exec(function(err, doc) {
    if(err) {
      console.log(err);
      return res.status(500).send("delete timetable failed");
    }
    if (!doc) return res.status(404).send("timetable not found");
    res.send("ok");
  });
});

/**
 * POST /tables/:id/copy
 * copy a timetable
 */
router.post('/:id/copy', function(req, res, next) {
  Timetable.findOne({'user_id': req.user_id, '_id' : req.params.id})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      timetable.copy(timetable.title, function(err, doc) {
        if(err) return res.status(500).send("timetable copy failed");
        else res.send(doc._id);
      });
    })
});

router.put('/:id', function(req, res, next) {
  if (!req.body.title) return res.status(400).send("should provide title");
  Timetable.findOne({'user_id': req.user._id, '_id' : req.params.id})
    .exec(function(err, timetable) {
      if(err) return res.status(500).send("update timetable title failed");
      timetable.title = req.body.title;
      timetable.checkDuplicate(function(err) {
        if (err) return res.status(403).send("duplicate title");
        timetable.save(function (err, doc) {
          if (err) return res.status(500).send("update timetable title failed");
          res.send(timetable._id);
        });
      });
    });
  
});

module.exports = router;
