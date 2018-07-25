import { LectureDiff } from '@app/batch/coursebook/data/compare';
import NotificationTypeEnum from '@app/core/notification/model/NotificationTypeEnum';
import { TimetableModel } from '@app/core/model/timetable';
import errcode = require('@app/api/errcode');
import UserService = require('@app/core/user/UserService');
import NotificationService = require('@app/core/notification/NotificationService');

import * as async from 'async';

export async function notifyUpdated(year:number, semesterIndex:number, diff:LectureDiff,
    fcm_enabled:boolean):Promise<void> {
  var num_updated_per_user: {[key: string]: number} = {}
  var num_removed_per_user: {[key: string]: number} = {}

  var promise = new Promise<void>(function(resolve, reject) {
    async.series([
      function (callback) {
        async.each(diff.updated, async function(updated_lecture, callback) {
          let timetables = await TimetableModel.getWithLecture(
            year, semesterIndex, updated_lecture.course_number, updated_lecture.lecture_number);
          async.each(timetables, async function(timetable, callback) {
            var noti_detail = {
              timetable_id : timetable._id,
              lecture : updated_lecture
            };

            let lectureId = timetable.findLectureId(updated_lecture.course_number, updated_lecture.lecture_number);

            try {
              await timetable.updateLecture(lectureId, updated_lecture.after);
              if (num_updated_per_user[timetable.userId]) num_updated_per_user[timetable.userId]++;
              else num_updated_per_user[timetable.userId] = 1;
              await NotificationService.add({
                user_id: timetable.userId,
                message: "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+"' 강의가 업데이트 되었습니다.",
                type: NotificationTypeEnum.LECTURE_UPDATE,
                detail: noti_detail,
                created_at: new Date()
              });
            } catch (err) {
              if (err == errcode.LECTURE_TIME_OVERLAP) {
                await timetable.deleteLecture(lectureId);
                if (num_removed_per_user[timetable.userId]) num_removed_per_user[timetable.userId]++;
                else num_removed_per_user[timetable.userId] = 1; 
                await NotificationService.add({
                  user_id: timetable.userId,
                  message: "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+
                    "' 강의가 업데이트되었으나, 시간표가 겹쳐 삭제되었습니다.",
                  type: NotificationTypeEnum.LECTURE_REMOVE,
                  detail: noti_detail,
                  created_at: new Date()
                });
              } else throw err;
            }
            callback();
          }, function(err) {
            callback(err);
          });
        }, function(err){
          callback(err);
        });
      },

      function (callback) {
        async.each(diff.removed, async function(removed_lecture, callback) {
          let timetables = await TimetableModel.getWithLecture(
            year, semesterIndex, removed_lecture.course_number, removed_lecture.lecture_number);
          
          async.each(timetables, async function(timetable, callback) {
            var noti_detail = {
              timetable_id : timetable._id,
              lecture : removed_lecture
            };

            let lectureId = timetable.findLectureId(removed_lecture.course_number, removed_lecture.lecture_number);
            
            await timetable.deleteLecture(lectureId);
            if (num_removed_per_user[timetable.userId]) num_removed_per_user[timetable.userId]++;
            else num_removed_per_user[timetable.userId] = 1; 
            await NotificationService.add({
              user_id: timetable.userId,
              message: "'"+timetable.title+"' 시간표의 '"+removed_lecture.course_title+"' 강의가 폐강되어 삭제되었습니다.",
              type: NotificationTypeEnum.LECTURE_REMOVE,
              detail: noti_detail,
              created_at: new Date()
            });
            callback();
          }, function(err) {
            callback(err);
          });
        }, function(err){
          callback(err);
        });
      }
      
    ], async function(err) {
      if(fcm_enabled) {
        var users = [];
        for (var user_id in Object.keys(num_updated_per_user)) {
          users.push(user_id);
        }

        for (var user_id in Object.keys(num_removed_per_user)) {
          if (user_id in num_updated_per_user) continue;
          users.push(user_id);
        }

        let promises = [];
        for (var i=0; i<users.length; i++) {
          var updated_num = num_updated_per_user[user_id];
          var removed_num = num_removed_per_user[user_id];
          var msg;
          if (updated_num & removed_num)
            msg = "수강편람이 업데이트되어 "+updated_num+"개 강의가 변경되고 "+removed_num+"개 강의가 삭제되었습니다.";
          else if (updated_num)
            msg = "수강편람이 업데이트되어 "+updated_num+"개 강의가 변경되었습니다.";
          else if (removed_num)
            msg = "수강편람이 업데이트되어 "+removed_num+"개 강의가 삭제되었습니다.";
          else
            continue;
          /* It takes too long to await each requests */
          promises.push(UserService.getByMongooseId(users[i]).then(function (user) {
            if (user.fcmKey) {
              return NotificationService.sendFcmMsg(user, "수강편람 업데이트", msg, "batch/coursebook", "lecture updated");
            } else {
              return Promise.resolve("No fcm key");
            }
          }));
        }
        await Promise.all(promises);
      }
      if (err) return reject(err);
      return resolve();
    });
  });
  await promise;
}
