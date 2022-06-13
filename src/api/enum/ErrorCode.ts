enum ErrorCode {
  /* 500 - Server fault */
  SERVER_FAULT = 0x0000,

  /* 400 - Request was invalid */
  NO_FB_ID_OR_TOKEN = 0x1001,
  NO_YEAR_OR_SEMESTER = 0x1002,
  NOT_ENOUGH_TO_CREATE_TIMETABLE = 0x1003,
  NO_LECTURE_INPUT = 0x1004,
  NO_LECTURE_ID = 0x1005,
  ATTEMPT_TO_MODIFY_IDENTITY = 0x1006,
  NO_TIMETABLE_TITLE = 0x1007,
  NO_REGISTRATION_ID = 0x1008,
  INVALID_TIMEMASK = 0x1009,
  INVALID_COLOR = 0x100A,
  NO_LECTURE_TITLE = 0x100B,
  INVALID_TIMEJSON = 0x100C,
  INVALID_NOTIFICATION_DETAIL = 0x100D,
  NO_APPLE_ID_OR_TOKEN = 0x100E,
  NO_TIMETABLE_THEME = 0x100F,
  INVALID_VERIFICATION_CODE = 0x1010,

  /* 401, 403 - Authorization-related */
  WRONG_API_KEY = 0x2000,
  NO_USER_TOKEN = 0x2001,
  WRONG_USER_TOKEN = 0x2002,
  NO_ADMIN_PRIVILEGE = 0x2003,
  WRONG_ID = 0x2004,
  WRONG_PASSWORD = 0x2005,
  WRONG_FB_TOKEN = 0x2006,
  UNKNOWN_APP = 0x2007,
  WRONG_APPLE_TOKEN = 0x2008,

  /* 403 - Restrictions */
  INVALID_ID = 0x3000,
  INVALID_PASSWORD = 0x3001,
  DUPLICATE_ID = 0x3002,
  DUPLICATE_TIMETABLE_TITLE = 0x3003,
  DUPLICATE_LECTURE = 0x3004,
  ALREADY_LOCAL_ACCOUNT = 0x3005,
  ALREADY_FB_ACCOUNT = 0x3006,
  NOT_LOCAL_ACCOUNT = 0x3007,
  NOT_FB_ACCOUNT = 0x3008,
  FB_ID_WITH_SOMEONE_ELSE = 0x3009,
  WRONG_SEMESTER = 0x300A,
  NOT_CUSTOM_LECTURE = 0x300B,
  LECTURE_TIME_OVERLAP = 0x300C,
  IS_CUSTOM_LECTURE = 0x300D,
  USER_HAS_NO_FCM_KEY = 0x300E,
  INVALID_EMAIL = 0x300F,
  INPUT_OUT_OF_RANGE = 0x3010,

  /* 404 - Not found */
  TAG_NOT_FOUND = 0x4000,
  TIMETABLE_NOT_FOUND = 0x4001,
  LECTURE_NOT_FOUND = 0x4002,
  REF_LECTURE_NOT_FOUND = 0x4003,
  USER_NOT_FOUND = 0x4004,
  COLORLIST_NOT_FOUND = 0x4005,

  /* 409 - Conflict */
  USER_EMAIL_ALREADY_VERIFIED = 0x9000,

  /* 429 - Too many requests */
  TOO_MANY_VERIFICATION_REQUEST = 0xA000,
}

export default ErrorCode;
