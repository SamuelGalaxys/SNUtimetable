if (!module.parent) {
  console.log("Not to be executed directly. Instead call import_txt.js");
  console.log("usage: $ node import_txt.js 2016 1");
  process.exit(1);
}

const db = require('../db'); // Unused imports will be deleted
import async = require('async');
import {LectureModel, LectureDocument} from '../model/lecture';
import {CourseBookModel} from '../model/courseBook';
import {NotificationModel, Type as NotificationType} from '../model/notification';
import {TimetableModel, TimetableDocument} from '../model/timetable';
import {TagListModel} from '../model/tagList';
import Util = require('../lib/util');

/*
 * 교양 영역을 한글로 번역.
 * fetch.rb를 수정하게 되면
 * 지난 수강편람을 모두 새로고침해야 하므로
 * 일단은 update_lectures에서 두번 해석
 */

var str_category = {
  "" : "",
  "foundation_writing":"사고와 표현",
  "foundation_language":"외국어",
  "foundation_math":"수량적 분석과 추론",
  "foundation_science":"과학적 사고와 실험",
  "foundation_computer":"컴퓨터와 정보 활용",
  "knowledge_literature":"언어와 문학",
  "knowledge_art":"문화와 예술",
  "knowledge_history":"역사와 철학",
  "knowledge_politics":"정치와 경제",
  "knowledge_human":"인간과 사회",
  "knowledge_nature":"자연과 기술",
  "knowledge_life":"생명과 환경",
  "general_physical":"체육",
  "general_art":"예술실기",
  "general_college":"대학과 리더십",
  "general_creativity":"창의와 융합",
  "general_korean":"한국의 이해"
};

type TagStruct = {
    classification : string[],
    department : string[],
    academic_year : string[],
    credit : string[],
    instructor : string[],
    category : string[]
  };

type LectureIdent = {
  course_number: string,
  lecture_number: string,
  course_title: string
}

type LectureIdentUpdated = {
  course_number: string,
  lecture_number: string,
  course_title: string,
  before: any,
  after: any
}

class LectureDiff {
  created: LectureIdent[];
  removed: LectureIdent[];
  updated: LectureIdentUpdated[];

  constructor() {
    this.created = [];
    this.removed = [];
    this.updated = [];
  }

  addLecture(array:LectureIdent[], lecture:LectureDocument) {
    array.push({
      course_number: lecture.course_number,
      lecture_number: lecture.lecture_number,
      course_title: lecture.course_title
    });
  };

  addCreated(lecture:LectureDocument) { this.addLecture(this.created, lecture) };
  addRemoved(lecture:LectureDocument) { this.addLecture(this.removed, lecture) };
  addUpdated(updatedObj:any, lecture:LectureDocument) {
    updatedObj.course_number = lecture.course_number;
    updatedObj.lecture_number = lecture.lecture_number;
    updatedObj.course_title = lecture.course_title;
    this.updated.push(updatedObj);
  };
}

function load_new_lectures(year:number, semesterIndex:number, lines:string[]) : {
  new_lectures: LectureDocument[],
  tags: TagStruct
} {
  var new_lectures:LectureDocument[] = new Array<LectureDocument>();
  var tags:TagStruct = {
    classification : [],
    department : [],
    academic_year : [],
    credit : [],
    instructor : [],
    category : []
  };
  for (let i=0; i<lines.length; i++) {
    var line = lines[i];
    var components = line.split(";");
    if (components.length == 1) continue;
    if (components.length > 16) {
      console.log("Parsing error detected : ");
      console.log(line);
    }

    // 교양영역 번역
    components[13] = str_category[components[13]];
    if (components[13] === undefined) components[13] = "";
    // null(과학교육계) 고침
    components[1] = components[1].replace("null", "");

    var new_tag = {
      classification : components[0],
      department : components[1],
      academic_year : components[2],
      credit : components[6]+'학점',
      instructor : components[9],
      category : components[13]
    };

    for (let key in tags) {
      if (tags.hasOwnProperty(key)){
        var existing_tag = null;
        for (let j=0; j<tags[key].length; j++) {
          if (tags[key][j] == new_tag[key]){
            existing_tag = new_tag[key];
            break;
          }
        }
        if (existing_tag === null) {
          if (new_tag[key] === undefined) {
            console.log(key);
            console.log(components);
            console.log(line);
          }
          if (new_tag[key].length < 2) continue;
          tags[key].push(new_tag[key]);
        }
      }
    }

    var timeJson = Util.timeAndPlaceToJson(components[7], components[8]);
    if (timeJson === null) console.log(line);
    // TimeMask limit is 15*2
    for (let j=0; j<timeJson.length; j++) {
      var t_end = timeJson[j].start+timeJson[j].len;
      if (t_end > 15) {
        console.log("Warning: ("+components[3]+", "+components[4]+", "+components[5]+
          ") ends at "+t_end);
      }
    }

    new_lectures.push(new LectureModel({
      year: year,
      semester: semesterIndex,
      classification: components[0],
      department: components[1],
      academic_year: components[2],
      course_number: components[3],
      lecture_number: components[4],
      course_title: components[5],
      credit: Number(components[6]),
      class_time: components[7],
      class_time_json: timeJson,
      class_time_mask: Util.timeJsonToMask(timeJson),
      instructor: components[9],
      quota: Number(components[10]),
      enrollment: Number(components[11]),
      remark: components[12],
      category: components[13]
    }));
    process.stdout.write("Loading " + new_lectures.length + "th course\r");
  }

  return {
    new_lectures: new_lectures,
    tags: tags
  }
}

function compare_lectures(old_lectures:LectureDocument[], new_lectures:LectureDocument[]): LectureDiff {
  var diff = new LectureDiff();
  var checked:boolean[] = [];
  for (let i=0; i<new_lectures.length; i++) {
    var exists = false;
    for (let j=0; j<old_lectures.length; j++) {
      if (checked[j]) continue;
      if (old_lectures[j].course_number != new_lectures[i].course_number) continue;
      if (old_lectures[j].lecture_number != new_lectures[i].lecture_number) continue;
      var diff_update = Util.compareLecture(old_lectures[j], new_lectures[i]);
      diff.addUpdated(diff_update, old_lectures[j]);
      checked[j] = true;
      exists = true;
      break;
    }
    if (exists === false) {
      diff.addCreated(new_lectures[i]);
      //console.log(new_lectures[i].course_title+" created");
    }
  }
  for (let i=0; i<old_lectures.length; i++) {
    if (!checked[i]) {
      diff.addRemoved(old_lectures[i]);
      //console.log(old_lectures[i].course_title+" removed");
    }
  }

  return diff;
}

function findTableWithLecture(year:number, semesterIndex:number, course_number:string,
  lecture_number:string, cb?:(err, timetables:TimetableDocument[])=>any): Promise<TimetableDocument[]> {
  return TimetableModel.find(
      {
        year: year,
        semester: semesterIndex,
        lecture_list: {
          $elemMatch : {
            course_number: course_number,
            lecture_number: lecture_number
          }
        }
      },
      {
        lecture_list: {
          $elemMatch : {
            course_number: course_number,
            lecture_number: lecture_number
          }
        }
  }, cb).exec();
}

function notifyUpdated(year:number, semesterIndex:number, diff:LectureDiff, callback) {
  async.each(diff.updated, function(updated_lecture, callback) {
    findTableWithLecture(year, semesterIndex, updated_lecture.course_number, updated_lecture.lecture_number,
    function(err, timetables) {
      async.each(timetables, function(timetable, callback) {
          if (timetable.lecture_list.length != 1) {
            return callback({
              message: "Lecture update error",
              timetable_id: timetable,
              lecture: updated_lecture
            });
          }
          var noti_detail = {
            timetable_id : timetable._id,
            lecture : updated_lecture
          };
          timetable.update_lecture(timetable.lecture_list[0]._id, updated_lecture.after,
            function(err, timetable){
              if (err) return callback(err);
              NotificationModel.createNotification(
                timetable.user_id,
                "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+"' 강의가 업데이트 되었습니다.",
                NotificationType.LECTURE,
                noti_detail,
                "unused",
                function(err) {
                  callback(err);
                });
          });
        }, function(err) {
          callback(err);
        });
    });
  }, function(err){
    callback(err);
  });
}

function notifyRemoved(year:number, semesterIndex:number, diff:LectureDiff, callback) {
  async.each(diff.removed, function(removed_lecture, callback) {
    findTableWithLecture(year, semesterIndex, removed_lecture.course_number, removed_lecture.lecture_number,
    function(err, timetables) {
        async.each(timetables, function(timetable, callback) {
          if (timetable.lecture_list.length != 1) {
            return callback({
              message: "Lecture update error",
              timetable_id: timetable,
              lecture: removed_lecture
            });
          }
          var noti_detail = {
            timetable_id : timetable._id,
            lecture : removed_lecture
          };
          timetable.delete_lecture(timetable.lecture_list[0]._id, function(err, timetable) {
            if (err) return callback(err);
            NotificationModel.createNotification(
              timetable.user_id,
              "'"+timetable.title+"' 시간표의 '"+removed_lecture.course_title+"' 강의가 폐강되었습니다.",
              NotificationType.LECTURE,
              noti_detail,
              "unused",
              function(err) {
                callback(err);
              });
          });
        }, function(err) {
          callback(err);
        });
      });
  }, function(err){
    callback(err);
  });
}

export function insert_course(lines:Array<string>, year:number, semesterIndex:number, next:()=>void)
{
  var semesterString = (['1', '여름', '2', '겨울'])[semesterIndex-1];
  var saved_cnt = 0, err_cnt = 0;
  var old_lectures: LectureDocument[];
  var new_lectures: LectureDocument[];
  var tags: TagStruct;
  var diff: LectureDiff;


  // Do each function step by step
  async.series([
    function (callback) {
      /* Load new lectures from txt */
      console.log ("Loading new lectures...");
      var result = load_new_lectures(year, semesterIndex, lines);
      new_lectures = result.new_lectures;
      tags = result.tags;
      console.log("\nLoad complete with "+new_lectures.length+" courses");
      callback();
    },
    function (callback) {
      /* Load old lectures from db */
      console.log ("Pulling existing lectures...");
      LectureModel.find({year : year, semester : semesterIndex}).lean()
        .exec(function(err, docs) {
          old_lectures = <LectureDocument[]>docs;
          callback(err);
        });
    },
    function (callback){
      /* Compare new & old, save the difference */
      console.log("Comparing existing lectures and new lectures...");
      diff = compare_lectures(old_lectures, new_lectures);
      if (diff.updated.length === 0 &&
          diff.created.length === 0 &&
          diff.removed.length === 0) {
        console.log("Nothing updated.");
        return callback(new Error("Update cancelled: nothing to update"));
      }
      console.log(diff.updated.length + " updated, "+
          diff.created.length + " created, "+
          diff.removed.length + " removed.");
      callback();
    },
    function (callback){
      async.parallel([
        function(callback){
          notifyUpdated(year, semesterIndex, diff, callback);
        },
        function(callback){
          notifyRemoved(year, semesterIndex, diff, callback);
        }
      ], function(err, results){
        callback(err);
      });
    },
    function (callback){
      /* Remove old lectures */
      LectureModel.remove({ year: year, semester: semesterIndex}, function(err) {
        if (err) {
          console.log(err);
          callback(err, 'remove lectures');
        } else {
          console.log("Removed existing lecture for this semester");
          callback(null, 'remove lectures');
        }
      });
    },
    function (callback){
      /* Insert new lectures */
      console.log("Inserting new lectures...");
      LectureModel.insertMany(new_lectures, function(err, docs) {
        console.log("\nInsert complete with " + docs.length + " success and "+ (new_lectures.length - docs.length) + " errors");
        callback(null, 'insert lectures');
      });
    },
    function (callback){
      TagListModel.remove({ year: year, semester: semesterIndex}, function(err) {
        if (err) callback(err, 'tag remove');
        console.log("Removed existing tags");
        callback(null, 'tag remove');
      });
    },
    function (callback){
      console.log("Inserting tags from new lectures...");
      for (var key in tags) {
        if (tags.hasOwnProperty(key)){
          tags[key].sort();
        }
      }
      var tagList = new TagListModel({
        year: Number(year),
        semester: semesterIndex,
        tags: tags,
        updated_at: Date.now()
      });
      tagList.save(function (err, docs) {
        if (err) callback(err, 'tags');
        else {
          console.log("Inserted tags");
          callback(null, 'tags');
        }
      });
    },
    function (callback) {
      console.log("saving coursebooks...");
      CourseBookModel.findOneAndUpdate({ year: Number(year), semester: semesterIndex },
        { updated_at: Date.now() },
        {
          new: false,   // return new doc
          upsert: true // insert the document if it does not exist
        })
        .exec(function(err, doc) {
          if (!doc) {
            var msg = year+"년도 "+semesterString+"학기 수강 편람이 업데이트 되었습니다.";
            NotificationModel.createNotification(null, msg, NotificationType.COURSEBOOK, null, "unused",
              function(err) {
                if (!err) console.log("Notification inserted");
                callback(err);
              });
          } else {
            callback(err);
          }
      });
    }
  ], function (err, results){
    if (err) {
      console.log(err);
      process.exit(1);
    }
    next();
  });
}
