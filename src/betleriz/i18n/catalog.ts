import data from './translations.json';
export const languages = [
 {code:'tr',name:'Türkçe',locale:'tr-TR'}, {code:'en',name:'English',locale:'en-GB'},
 {code:'az',name:'Azərbaycanca',locale:'az-AZ'}, {code:'ur',name:'اردو',locale:'ur-PK'},
 {code:'hi',name:'हिन्दी',locale:'hi-IN'}, {code:'th',name:'ไทย',locale:'th-TH'},
 {code:'id',name:'Bahasa Indonesia',locale:'id-ID'}, {code:'ar',name:'العربية',locale:'ar'},
 {code:'ku',name:'Kurdî (Kurmancî)',locale:'ku'},
] as const;
export type Language=typeof languages[number]['code'];
export type MessageKey=keyof typeof data.en;
export const catalogs:Record<Language,Record<MessageKey,string>>=data;
export function translate(language:Language,key:MessageKey,values:Record<string,string|number>={}):string{
 return Object.entries(values).reduce((text,[k,v])=>text.split(`{${k}}`).join(String(v)),catalogs[language][key]);
}
