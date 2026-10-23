import {NativeModules,PermissionsAndroid,Platform} from 'react-native';
import {Fixture,Reminder,reminderAt} from './model';
import {Language,translate} from './i18n/catalog';
type Bridge={schedule:(id:string,title:string,body:string,at:number)=>Promise<boolean>;cancel:(id:string)=>Promise<boolean>;notificationsEnabled:()=>Promise<boolean>};
const native=NativeModules.BetlerizReminders as Bridge|undefined;
export async function scheduleReminder(fixture:Fixture,minutes:number,language:Language):Promise<Reminder>{
 if(Platform.OS!=='android'||!native)throw new Error('reminderUnsupported');
 const at=reminderAt(fixture,minutes);
 if(Number(Platform.Version)>=33){
  const permission=await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  if(permission!==PermissionsAndroid.RESULTS.GRANTED)throw new Error('permission');
 }
 if(!await native.notificationsEnabled())throw new Error('permission');
 await native.schedule(fixture.id,translate(language,'notificationTitle'),translate(language,'notificationBody',{home:fixture.home,away:fixture.away,minutes}),at);
 return {id:fixture.id,fixture,minutes,scheduledAt:at};
}
export async function cancelReminder(id:string){if(native)await native.cancel(id);}
export async function refreshReminders(reminders:Reminder[],fixtures:Fixture[],language:Language):Promise<Reminder[]>{
 if(!native||Platform.OS!=='android')return reminders;
 const next:Reminder[]=[];
 for(const reminder of reminders){
  const fixture=fixtures.find(f=>f.id===reminder.id) ?? fixtures.find(f=>f.home===reminder.fixture.home && f.away===reminder.fixture.away && f.sport===reminder.fixture.sport && f.league===reminder.fixture.league && Math.abs(Date.parse(f.kickoff??'')-Date.parse(reminder.fixture.kickoff??''))<48*3600000) ?? reminder.fixture;
  let at:number;
  try{at=reminderAt(fixture,reminder.minutes);}catch{await cancelReminder(reminder.id);continue;}
  if(reminder.id!==fixture.id)await cancelReminder(reminder.id);
  await native.schedule(fixture.id,translate(language,'notificationTitle'),translate(language,'notificationBody',{home:fixture.home,away:fixture.away,minutes:reminder.minutes}),at);
  next.push({...reminder,id:fixture.id,fixture,scheduledAt:at});
 }
 return next;
}
