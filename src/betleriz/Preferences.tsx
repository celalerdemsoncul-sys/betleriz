import React,{createContext,useContext,useEffect,useRef,useState,ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Language,languages,translate,MessageKey} from './i18n/catalog';
import {Fixture,Team,Reminder,teamKey} from './model';
const KEY='@betleriz/preferences-v1';
type State={language:Language;teams:Team[];matches:string[];reminders:Reminder[];lead:number};
const initial:State={language:'tr',teams:[],matches:[],reminders:[],lead:15};
type Context=State & {ready:boolean;storageError:boolean;rtl:boolean;t:(key:MessageKey,values?:Record<string,string|number>)=>string;setLanguage:(v:Language)=>void;setLead:(v:number)=>void;toggleTeam:(f:Fixture,side:'home'|'away')=>void;toggleMatch:(id:string)=>void;removeTeam:(key:string)=>void;setReminders:(r:Reminder[])=>Promise<void>};
const PreferencesContext=createContext<Context|null>(null);
export function PreferencesProvider({children}:{children:ReactNode}){
 const [state,setState]=useState(initial);const current=useRef(initial);const [ready,setReady]=useState(false);const [storageError,setStorageError]=useState(false);const queue=useRef(Promise.resolve());
 useEffect(()=>{let active=true;AsyncStorage.getItem(KEY).then(raw=>{
  if(!active)return;
  if(raw){try{const x=JSON.parse(raw);const next:State={
   language:languages.some(l=>l.code===x.language)?x.language:'tr',
   teams:Array.isArray(x.teams)?x.teams.filter((t:any)=>typeof t?.key==='string'&&typeof t?.name==='string'&&['football','basketball','tennis'].includes(t.sport)):[],
   matches:Array.isArray(x.matches)?x.matches.filter((m:any)=>typeof m==='string'):[],
   reminders:Array.isArray(x.reminders)?x.reminders.filter((r:any)=>typeof r?.id==='string'&&r.fixture&&typeof r.fixture.home==='string'&&typeof r.fixture.away==='string'&&[5,15,30,60].includes(r.minutes)&&Number.isFinite(r.scheduledAt)):[],
   lead:[5,15,30,60].includes(x.lead)?x.lead:15,
  };current.current=next;setState(next);}catch{setStorageError(true);}}
 }).catch(()=>{if(active)setStorageError(true);}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
 const persist=(next:State)=>{
  const previous=current.current;current.current=next;setState(next);
  const write=queue.current.catch(()=>{}).then(()=>AsyncStorage.setItem(KEY,JSON.stringify(next)));
  queue.current=write;write.then(()=>setStorageError(false),()=>{setStorageError(true);if(current.current===next){current.current=previous;setState(previous);}});return write;
 };
 const patch=(p:Partial<State>)=>{void persist({...current.current,...p}).catch(()=>{});};
 const toggleTeam=(f:Fixture,side:'home'|'away')=>{const key=teamKey(f,side),teams=current.current.teams;patch({teams:teams.some(t=>t.key===key)?teams.filter(t=>t.key!==key):[...teams,{key,name:f[side],sport:f.sport}]});};
 return <PreferencesContext.Provider value={{...state,ready,storageError,rtl:state.language==='ur'||state.language==='ar',t:(k,v)=>translate(state.language,k,v),setLanguage:language=>patch({language}),setLead:lead=>patch({lead}),toggleTeam,removeTeam:key=>patch({teams:current.current.teams.filter(team=>team.key!==key)}),toggleMatch:id=>patch({matches:current.current.matches.includes(id)?current.current.matches.filter(m=>m!==id):[...current.current.matches,id]}),setReminders:reminders=>persist({...current.current,reminders})}}>{children}</PreferencesContext.Provider>;
}
export function usePreferences(){const context=useContext(PreferencesContext);if(!context)throw new Error('PreferencesProvider missing');return context;}
