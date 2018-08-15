import EtcTagEnum from "@app/core/taglist/model/EtcTagEnum";
import log4js = require('log4js');
let logger = log4js.getLogger();

export function getEtcTagMQuery(etcTags: string[]): any {
    let andQueryList = etcTags.map(getMQueryFromEtcTag).filter(x => x !== null);
    return { $and: andQueryList };
}

function getMQueryFromEtcTag(etcTag: string): object | null {
    switch (etcTag) {
        case EtcTagEnum.ENGLISH_LECTURE:
            return {remark: {$regex: ".*ⓔ.*", $options: 'i'}};
        case EtcTagEnum.MILITARY_REMOTE_LECTURE:
            return {remark: {$regex: ".*ⓜⓞ.*", $options: 'i'}};
        default:
            logger.warn("Unknown etc tag :", etcTag);
            return null;
    }
}
