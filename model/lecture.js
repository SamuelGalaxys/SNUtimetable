var mongoose = require('../db');

var LectureSchema = mongoose.Schema({
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  classification: { type: String, required: true },
  department: String,
  academic_year: String,
  course_number: { type: String, required: true },
  lecture_number: String,
  course_title: { type: String, required: true },
  credit: Number,
  class_time: String,
  class_time_json: [
  { day : Number, start: Number, len: Number, place : String }
  ],
  class_time_mask: { type: [ Number ], required: true },
  instructor: String,
  quota: Number,
  enrollment: Number,
  remark: String,
  category: String,
  created_at: Date,
  updated_at: Date
});

LectureSchema.index({ year: 1, semester: 1, classification: 1 });
LectureSchema.index({ year: 1, semester: 1, department: 1 });
LectureSchema.index({ year: 1, semester: 1, course_title: 1 });

module.exports = mongoose.model('Lecture', LectureSchema);
