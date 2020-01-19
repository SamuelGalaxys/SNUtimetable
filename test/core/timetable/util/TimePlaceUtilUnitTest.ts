import assert = require('assert');
import TimePlaceUtil = require('@app/core/timetable/util/TimePlaceUtil');
import TimePlace from '@app/core/timetable/model/TimePlace';

describe('TimePlaceUtilUnitTest', function() {
    it("timeAndPlaceToJson__success__emptyTimeString", async function() {
        assert.deepEqual([], TimePlaceUtil.timeAndPlaceToJson('',''));
    })

    it("timeAndPlaceToJson__success__coursesInDifferentDay", async function() {
        assert.deepEqual([{day: 1, start:1, len:2, place: '220-317'},
                {day:3, start:1, len:2, place: '220-317'}],
                TimePlaceUtil.timeAndPlaceToJson('화(1-2)/목(1-2)', '220-317/220-317'));
    })

    it("timeAndPlaceToJson__success__onlyOneLocation", async function() {
        assert.deepEqual([{day: 1, start:1, len:2, place: '220-317'},
                {day:3, start:1, len:2, place: '220-317'}],
                TimePlaceUtil.timeAndPlaceToJson('화(1-2)/목(1-2)', '220-317'));
    })

    it("timeAndPlaceToJson__success__emptyLocation", async function() {
        assert.deepEqual([{day: 1, start:1, len:2, place: ''},
                {day:3, start:1, len:2, place: ''}],
                TimePlaceUtil.timeAndPlaceToJson('화(1-2)/목(1-2)', '/'));
    })

    it("timeAndPlaceToJson__success__noLocation", async function() {
        assert.deepEqual([{day: 1, start:1, len:2, place: ''},
                {day:3, start:1, len:2, place: ''}],
                TimePlaceUtil.timeAndPlaceToJson('화(1-2)/목(1-2)', ''));
    })

    it("timeAndPlaceToJson__success__floatingPointTime", async function() {
        assert.deepEqual([{day: 1, start:1.5, len:2, place: '220-317'},
        {day:3, start:1.5, len:2, place: '220-317'}],
        TimePlaceUtil.timeAndPlaceToJson('화(1.5-2)/목(1.5-2)', '220-317/220-317'));
    })

    it("timeAndPlaceToJson__success__coursesInSameDay", async function() {
        assert.deepEqual([{day: 1, start:3, len:1, place: '302-208'},
            {day: 3, start:3, len:1, place: '302-208'},
            {day: 3, start:11, len:2, place: '302-310-2'}],
          TimePlaceUtil.timeAndPlaceToJson('화(3-1)/목(3-1)/목(11-2)', '302-208/302-208/302-310-2'));
    })

    it("timeAndPlaceToJson__success__mergeContinuousCourse", async function() {
        assert.deepEqual([{day: 3, start: 9, len: 4, place: '220-317'}],
              TimePlaceUtil.timeAndPlaceToJson('목(9-2)/목(11-2)', '220-317/220-317'));
    })

    it("timeAndPlaceToJson__success__doNotMergeContinuousCourseButDiffLocation", async function() {
        assert.deepEqual([
                {day: 3, start: 9, len: 2, place: '220-317'},
                {day: 3, start: 11, len: 2, place: '220-316'}
              ],
              TimePlaceUtil.timeAndPlaceToJson('목(9-2)/목(11-2)', '220-317/220-316'));
    })

    it("timeAndPlaceToJson__success__mergeMultipleClassroom", async function() {
        assert.deepEqual([
            {day: 0, start: 3, len: 1.5, place: '500-L302'},
            {day: 2, start: 3, len: 1.5, place: '500-L302'},
            {day: 4, start: 3, len: 2, place: '020-103/020-104'}
          ],
          TimePlaceUtil.timeAndPlaceToJson('월(3-1.5)/수(3-1.5)/금(3-2)/금(3-2)', '500-L302/500-L302/020-103/020-104'));
    })

    it("timeAndPlaceToJson__success__mergeMultipleClassroom2", async function() {
        assert.deepEqual([
            {day: 2, start: 7, len: 1, place: '014-B101'},
            {day: 2, start: 10, len: 1, place: '008-301/008-304/014-102/014-202/014-204/014-207'}
          ],
          TimePlaceUtil.timeAndPlaceToJson('수(10-1)/수(10-1)/수(7-1)/수(10-1)/수(10-1)/수(10-1)/수(10-1)', '008-301/008-304/014-B101/014-102/014-202/014-204/014-207'));
    })

    it("timeJsonToMask__success__emptyJson", async function() {
        assert.deepEqual([0, 0, 0, 0, 0, 0, 0], TimePlaceUtil.timeJsonToMask([]));
    })

    it("timeJsonToMask__success", async function() {
        assert.deepEqual([0, parseInt("00011"+"11000"+"00000"+"00000"+"00000"+"00000", 2), 0,
            parseInt("00011"+"11000"+"00000"+"00000"+"00000"+"00000", 2), 0, 0, 0],
            TimePlaceUtil.timeJsonToMask([{day: 1, start:1.5, len:2, place: '220-317'},
            {day:3, start:1.5, len:2, place: '220-317'}]));
        assert.deepEqual([0, parseInt("00011"+"11100"+"00000"+"00000"+"00000"+"00000", 2), 0,
            parseInt("00011"+"11100"+"00000"+"00000"+"00000"+"00000", 2), 0, 0, 0],
            TimePlaceUtil.timeJsonToMask([{day: 1, start:1.5, len:2.5, place: '220-317'},
            {day:3, start:1.5, len:2.5, place: '220-317'}]));
        assert.deepEqual([0, parseInt("00001"+"11100"+"00000"+"00000"+"00000"+"00000", 2), 0,
            parseInt("00001"+"11100"+"00000"+"00000"+"00000"+"00000", 2), 0, 0, 0],
            TimePlaceUtil.timeJsonToMask([{day: 1, start:2, len:2, place: '220-317'},
            {day:3, start:2, len:2, place: '220-317'}]));
        assert.deepEqual([0, parseInt("00000"+"00000"+"00000"+"00000"+"11111"+"11111", 2), 0,
            parseInt("00000"+"00000"+"00000"+"00000"+"11111"+"11111", 2), 0, 0, 0],
            TimePlaceUtil.timeJsonToMask([{day: 1, start:10, len:5, place: '220-317'},
            {day:3, start:10, len:5, place: '220-317'}]));
        assert.deepEqual([0, parseInt("00000"+"00000"+"00000"+"00000"+"00000"+"01100", 2), 0,
            parseInt("00000"+"00000"+"00000"+"00000"+"00000"+"01100", 2), 0, 0, 0],
            TimePlaceUtil.timeJsonToMask([{day: 1, start: 13, len: 1, place: "302-308"},
            {day: 3, start: 13, len: 1, place: "302-308"}]));
        assert.deepEqual([0, parseInt("00000"+"00000"+"00000"+"00000"+"00000"+"00000", 2), 0,
            parseInt("00000"+"00000"+"00000"+"00000"+"00000"+"00000", 2), 0, 0, 0],
            TimePlaceUtil.timeJsonToMask([{day: 1, start: -1, len: 1, place: "302-308"},
            {day: 3, start: 15, len: 1, place: "302-308"}]));
    });

    it("equalTimeJson__true", async function() {
        let t1: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcg"
            }
        ];

        let t2: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcg"
            }
        ];

        assert(TimePlaceUtil.equalTimeJson(t1, t2));
    })

    it("equalTimeJson__false__differLength", async function() {
        let t1: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            }
        ];

        let t2: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcd"
            }
        ];

        assert(TimePlaceUtil.equalTimeJson(t1, t2) == false);
    })

    it("equalTimeJson__false__differDay", async function() {
        let t1: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcg"
            }
        ];

        let t2: Array<TimePlace> = [
            {
                day: 4,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcg"
            }
        ];

        assert(TimePlaceUtil.equalTimeJson(t1, t2) == false);
    })

    it("equalTimeJson__false__differStart", async function() {
        let t1: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 2,
                len: 2,
                place: "abcg"
            }
        ];

        let t2: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcg"
            }
        ];

        assert(TimePlaceUtil.equalTimeJson(t1, t2) == false);
    })

    it("equalTimeJson__false__differLen", async function() {
        let t1: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 1,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcg"
            }
        ];

        let t2: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcg"
            }
        ];

        assert(TimePlaceUtil.equalTimeJson(t1, t2) == false);
    })

    it("equalTimeJson__false__differPlace", async function() {
        let t1: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcgs"
            }
        ];

        let t2: Array<TimePlace> = [
            {
                day: 5,
                start: 3,
                len: 2,
                place: "abcd"
            },
            {
                day: 3,
                start: 3,
                len: 2,
                place: "abcg"
            }
        ];

        assert(TimePlaceUtil.equalTimeJson(t1, t2) == false);
    })
});
