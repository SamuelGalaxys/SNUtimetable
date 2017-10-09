import mongoose = require('mongoose');

var FcmLogSchema = new mongoose.Schema({
  date: {type:Number, default: Date.now()},
  author: String,
  to: String,
  message: String,
  cause: String,
  response: String
});

var mongooseModel = mongoose.model('FcmLog', FcmLogSchema);

export function writeFcmLog(to: string, author: string, message: string, cause: string, response: any) {
  var log = new mongooseModel({
    author: author,
    cause: cause,
    to : to,
    message: message,
    response: JSON.stringify(response)
  });
  return log.save();
}

export function getRecentFcmLog(): Promise<any[]>{
  return mongooseModel.find().sort({date: -1}).limit(10).exec();
}
