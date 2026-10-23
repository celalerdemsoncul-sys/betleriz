import React,{createContext,ReactNode,useContext,useEffect,useRef,useState} from 'react';
import {AppState,NativeModules,Platform} from 'react-native';
import {creditRequest,fetchWallet,Wallet,CreditTip} from './creditApi';
const ads=NativeModules.BetlerizAds as {prepare:()=>Promise<boolean>;show:(unit:string,user:string,nonce:string,test:boolean)=>Promise<boolean>;privacy:()=>Promise<boolean>}|undefined;
type FullPage={tips:CreditTip[];expiresAt:string;remainingMs:number};
type Context={wallet:Wallet|null;busy:boolean;error:boolean;canRetryFullPage:boolean;fullPage:FullPage|null;refresh:()=>Promise<void>;watch:()=>Promise<'confirmed'|'pending'|'canceled'|'fullReady'|'progress'>;unlock:(id:string)=>Promise<CreditTip>;openFullPage:()=>Promise<void>;closeFullPage:()=>void;privacy:()=>Promise<void>};
const WalletContext=createContext<Context|null>(null);
export function CreditsProvider({children}:{children:ReactNode}){
 const [wallet,setWallet]=useState<Wallet|null>(null);const [fullPage,setFullPage]=useState<FullPage|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState(false);const lock=useRef(false);const request=useRef(0);const retryKey=useRef<string|null>(null);
 const refresh=async()=>{const seq=++request.current;try{const next=await fetchWallet();if(seq===request.current){setWallet(next);setError(false);}}catch(e){if(seq===request.current)setError(true);throw e;}};
 useEffect(()=>{void refresh().catch(()=>{});void ads?.prepare().catch(()=>{});const sub=AppState.addEventListener('change',state=>{if(state==='active'&&!lock.current)void refresh().catch(()=>{});});const timer=setInterval(()=>{if(!lock.current)void refresh().catch(()=>{});},60000);return()=>{sub.remove();clearInterval(timer);};},[]);
 useEffect(()=>{if(!fullPage)return;const timer=setTimeout(()=>setFullPage(null),fullPage.remainingMs);return()=>clearTimeout(timer);},[fullPage]);
 const exclusive=async<T,>(work:()=>Promise<T>):Promise<T>=>{if(lock.current)throw new Error('busy');lock.current=true;setBusy(true);++request.current;try{return await work();}finally{lock.current=false;setBusy(false);}};
 const watch=()=>exclusive(async()=>{
  if(Platform.OS!=='android'||!ads)throw new Error('ad_unavailable');
  const current=await fetchWallet();setWallet(current);if(current.videosToday>=current.dailyLimit)throw new Error('daily_limit');if(current.adMode==='off')throw new Error('ads_not_configured');
  const session=await creditRequest('/ad-session','POST',{});let completed=false;
  try{completed=await ads.show(current.adUnitId,session.userId,session.nonce,current.adMode==='test');}
  catch(e){await creditRequest('/ad-cancel','POST',{nonce:session.nonce}).catch(()=>{});throw e;}
  if(!completed){await creditRequest('/ad-cancel','POST',{nonce:session.nonce});await refresh();return 'canceled' as const;}
  const outcome=(next:Wallet)=>next.fullViewAvailable&&!current.fullViewAvailable?'fullReady' as const:current.videosToday>=10?'progress' as const:'confirmed' as const;
  if(current.adMode==='test'){const result=await creditRequest('/test-complete','POST',{nonce:session.nonce});setWallet(result.wallet);setError(false);return outcome(result.wallet);}
  for(let attempt=0;attempt<6;attempt++){
   if(attempt)await new Promise(resolve=>setTimeout(resolve,1500));const next=await fetchWallet();setWallet(next);setError(false);if(next.videosToday>current.videosToday)return outcome(next);
  }
  return 'pending' as const;
 });
 const unlock=(tipId:string)=>exclusive(async()=>{const result=await creditRequest('/unlock','POST',{tipId});setWallet(result.wallet);setError(false);return result.tip as CreditTip;});
 const openFullPage=()=>exclusive(async()=>{
  // Kept only in memory: a retry recovers the same response, never creates a second page view.
  if(!retryKey.current)retryKey.current=`view_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  const key=retryKey.current;const started=performance.now();let result:any;try{result=await creditRequest('/full-view','POST',{requestKey:key});}catch(error){if(error instanceof Error&&['full_view_used','full_view_required','no_tips'].includes(error.message))retryKey.current=null;throw error;}
  const remaining=Math.max(0,Date.parse(result.expiresAt)-Date.parse(result.wallet.serverTime)-(performance.now()-started)-1000);
  setWallet(result.wallet);setError(false);
  if(remaining<=0){retryKey.current=null;throw new Error('full_view_used');}
  setFullPage({tips:result.data,expiresAt:result.expiresAt,remainingMs:remaining});retryKey.current=null;
  // Delivery acknowledgment closes server replay access. Only this already delivered page stays in RAM.
  void creditRequest('/full-view-ack','POST',{requestKey:key}).catch(()=>{});
 });
 return <WalletContext.Provider value={{wallet,busy,error,canRetryFullPage:retryKey.current!==null&&!fullPage,fullPage,refresh,watch,unlock,openFullPage,closeFullPage:()=>{retryKey.current=null;setFullPage(null);},privacy:async()=>{if(ads)await ads.privacy();}}}>{children}</WalletContext.Provider>;
}
export function useCredits(){const value=useContext(WalletContext);if(!value)throw new Error('CreditsProvider missing');return value;}
