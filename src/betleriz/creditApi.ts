import AsyncStorage from '@react-native-async-storage/async-storage';
import {PUBLIC_API_BASE} from './config';
export const CREDIT_API=PUBLIC_API_BASE+'/v1';
const TOKEN='@betleriz/wallet-token-v1';
export type Wallet={accountId:string;paidBalance:number;canUnlockTip:boolean;balance:number;singleUnlocksToday:number;singleUnlockAvailable:boolean;videosToday:number;dailyLimit:number;unlockCost:number;day:string;resetAt:string;adMode:'off'|'test'|'production';adUnitId:string;timeZone:string;serverTime:string;fullViewAvailable:boolean;fullViewUsed:boolean;fullViewExpiresAt:string|null;fullViewThreshold:number};
export type CreditTip={id:string;category:string;homeTeam:string;awayTeam:string;competitionName:string;matchDate:string|null;canUnlock:boolean;unlocked:boolean;historical?:boolean;score?:string|null;access:'permanent'|'locked'|'one-view'|'archive';prediction?:{type:string;prediction:string;percentage:number|null;result?:string|null}};
let tokenFlight:Promise<string>|null=null;
async function raw(path:string,method='GET',body?:unknown,token?:string):Promise<any>{
 const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),12000);
 try{const response=await fetch(CREDIT_API+path,{method,signal:abort.signal,headers:{Accept:'application/json',...(method==='POST'?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const result=await response.json();if(!response.ok||result.success!==true)throw new Error(result.error??'wallet_offline');return result;
 }finally{clearTimeout(timeout);}
}
async function getToken():Promise<string>{
 if(!tokenFlight)tokenFlight=(async()=>{const config=await raw('/config');const mode=config.adMode;if(!['off','test','production'].includes(mode))throw new Error('wallet_offline');const key=`${TOKEN}:${CREDIT_API}:${mode}`;const saved=await AsyncStorage.getItem(key);if(saved)return saved;const result=await raw('/register','POST',{});if(typeof result.token!=='string'||!/^[a-f0-9]{64}$/.test(result.token))throw new Error('wallet_offline');await AsyncStorage.setItem(key,result.token);return result.token;})().catch(error=>{tokenFlight=null;throw error;});
 return tokenFlight;
}
export async function creditRequest(path:string,method='GET',body?:unknown){return raw(path,method,body,await getToken());}
export async function fetchWallet():Promise<Wallet>{return (await creditRequest('/wallet')).wallet;}
export async function fetchCreditTips(category:string,date:string):Promise<CreditTip[]>{return (await creditRequest(`/tips?category=${encodeURIComponent(category)}&date=${encodeURIComponent(date)}&offset=${-new Date().getTimezoneOffset()}`)).data;}
