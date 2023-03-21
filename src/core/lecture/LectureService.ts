import Lecture from './model/Lecture';
import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');
import InvalidLectureTimemaskError from './error/InvalidLectureTimemaskError';

export function setTimemask(lecture: Lecture): void {
    if (lecture.class_time_json) {
      if (!lecture.class_time_mask) {
        lecture.class_time_mask = TimePlaceUtil.timeJsonToMask(lecture.class_time_json, true);
      } else {
        var timemask = TimePlaceUtil.timeJsonToMask(lecture.class_time_json);
      }
    }
}
