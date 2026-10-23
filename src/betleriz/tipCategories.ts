import {MessageKey} from './i18n/catalog';
import {CARD_TYPE_MAPPING, PREMIUM_CARD_TYPES} from '../constants/endpoints';
const labels:Record<string,MessageKey>={
 'daily-sure':'dailySure',football:'football','over-under':'overUnder',single:'single',
 'daily-odds':'dailyOdds',bonus:'bonus',basketball:'basketball',tennis:'tennis',
 special:'specialVip',fixed:'fixedVip','correct-score':'correctScore',mixed:'mixedVip',
 'multi-50':'multi50','multi-10':'multi10','single-vip':'singleVip','ht-ft':'htFt',
};
// Share the original app's category IDs with its JSON content and backend.
export const tipCategories=Object.values(CARD_TYPE_MAPPING).map(id=>({id,label:labels[id],vip:PREMIUM_CARD_TYPES.includes(id)}));
export const tipDates=[{id:'yesterday',label:'yesterday'},{id:'today',label:'today'},{id:'tomorrow',label:'tomorrow'},{id:'after-tomorrow',label:'afterTomorrow'},{id:'archive',label:'tipsArchive'}] as const;
export type TipDate=typeof tipDates[number]['id'];
