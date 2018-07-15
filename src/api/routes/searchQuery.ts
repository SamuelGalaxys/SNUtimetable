import express = require('express');
var router = express.Router();
import Util = require('@app/core/util');
import errcode = require('@app/api/errcode');
import {LectureQuery, extendedSearch, writeLog} from '@app/core/model/query';
import * as log4js from 'log4js';
var logger = log4js.getLogger();

// deprecated
/*
function timeRangesToBinaryConditions(timeJson) {
  return Util.timeJsonToMask(timeJson).map(function(bit, idx) {
    return {$bitsAllClear : ~bit<<1>>>1};
  })
}
*/

router.post('/', async function(req, res, next) {
  if (!req.body.year || !req.body.semester) {
    return res.status(400).json({errcode:errcode.NO_YEAR_OR_SEMESTER, message: 'no year and semester'});
  }

  var query:LectureQuery = req.body;
  try {
    writeLog(query);
    var lectures = await extendedSearch(query);
    return res.json(lectures);
  } catch (err) {
    switch(err) {
    case errcode.INVALID_TIMEMASK:
      return res.status(400).json({errcode:errcode.INVALID_TIMEMASK, message: "invalid timemask"});
    default:
      logger.error(err);
      return res.status(500).json({errcode:errcode.SERVER_FAULT, message: "search error"});
    }
  }
});

export = router;