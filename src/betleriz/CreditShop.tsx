import React,{createContext,ReactNode,useContext,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Alert,Platform,Pressable,ScrollView,StyleSheet,Text} from 'react-native';
import * as IAP from 'react-native-iap';
import {creditRequest} from './creditApi';
import {useCredits} from './Credits';
import {usePreferences} from './Preferences';
import CreditPanel from './CreditPanel';
import {colors as c} from './theme';
type Pack={id:string;credits:number};
type Shop={enabled:boolean;loading:boolean;busy:boolean;products:IAP.Product[];packs:Pack[];error:boolean;reload:()=>void;buy:(id:string)=>Promise<void>;recover:()=>Promise<void>};
const Context=createContext<Shop|null>(null);
export function CreditPurchasesProvider({children}:{children:ReactNode}){
 const {refresh}=useCredits();const p=usePreferences();const latest=useRef({refresh,p});latest.current={refresh,p};
 const [enabled,setEnabled]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[products,setProducts]=useState<IAP.Product[]>([]),[packs,setPacks]=useState<Pack[]>([]),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 const config=useRef<{accountId:string;products:Pack[]}|null>(null);const processing=useRef(new Set<string>());
 const process=async(purchase:IAP.Purchase)=>{
  const token=purchase.purchaseToken;
  if(!config.current?.products.some(pack=>pack.id===purchase.productId)||!token||processing.current.has(token)||purchase.purchaseState!=='purchased')return false;
  processing.current.add(token);setBusy(true);
  try{
   await creditRequest('/credit-purchase','POST',{productId:purchase.productId,purchaseToken:token});
   // Persist verified credits before consuming the Play product. Retrying never grants twice.
   await IAP.finishTransaction({purchase,isConsumable:true});await latest.current.refresh();return true;
  }finally{processing.current.delete(token);setBusy(false);}
 };
 const recover=async()=>{const pending=await IAP.getAvailablePurchases({});for(const purchase of pending)await process(purchase);};
 useEffect(()=>{
  let active=true;let update:ReturnType<typeof IAP.purchaseUpdatedListener>|undefined;let failure:ReturnType<typeof IAP.purchaseErrorListener>|undefined;
  setLoading(true);setError(false);setEnabled(false);setProducts([]);
  void(async()=>{
   const data=await creditRequest('/credit-products');if(!active)return;setPacks(data.products);config.current=data;
   if(!data.enabled||Platform.OS!=='android')return;
   await IAP.initConnection();if(!active)return;
   update=IAP.purchaseUpdatedListener(purchase=>{void process(purchase).then(delivered=>{if(delivered)Alert.alert(latest.current.p.t('credits'),latest.current.p.t('purchaseConfirmed'));}).catch(()=>Alert.alert(latest.current.p.t('credits'),latest.current.p.t('purchaseFailed')));});
   failure=IAP.purchaseErrorListener(e=>{setBusy(false);if(e.code!=='user-cancelled')Alert.alert(latest.current.p.t('credits'),latest.current.p.t('purchaseFailed'));});
   const list=await IAP.fetchProducts({skus:data.products.map((pack:Pack)=>pack.id),type:'in-app'});
   if(active){setProducts((list??[]) as IAP.Product[]);setEnabled(true);}await recover();
  })().catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;update?.remove();failure?.remove();};
 },[attempt]);
 const buy=async(id:string)=>{if(!enabled||busy||!products.some(v=>v.id===id)||!config.current)return;setBusy(true);try{await IAP.requestPurchase({type:'in-app',request:{android:{skus:[id],obfuscatedAccountIdAndroid:config.current.accountId}}});}finally{setBusy(false);}};
 return <Context.Provider value={{enabled,loading,busy,products,packs,error,reload:()=>setAttempt(n=>n+1),buy,recover}}>{children}</Context.Provider>;
}
export default function CreditShop({initialMode='buy'}:{initialMode?:'buy'|'earn'}){
 const [mode,setMode]=useState(initialMode);const {wallet}=useCredits();
 const shop=useContext(Context)!;const {t,rtl}=usePreferences();const text={textAlign:rtl?'right' as const:'left' as const};
 return <ScrollView contentContainerStyle={s.content}><Text style={[s.title,text]}>{t('creditShop')}</Text><Pressable style={s.button} onPress={()=>setMode(mode==='buy'?'earn':'buy')}><Text style={s.buttonText}>{t(mode==='buy'?'earnCredits':'buyCredits')}</Text></Pressable>{mode==='earn'?<CreditPanel/>:<><Text style={[s.body,text]}>{wallet?t('creditBalance',{count:wallet.balance}):t('walletLoading')}</Text><Text style={[s.body,text]}>{t('paidCreditRule')}</Text>
 {shop.loading?<ActivityIndicator color={c.purple}/>:null}
 {!shop.enabled?<Text style={[s.notice,text]}>{t(shop.error?'walletOffline':'shopSoon')}</Text>:null}
 {shop.packs.map(pack=>{const product=shop.products.find(v=>v.id===pack.id);return <Pressable key={pack.id} accessibilityRole="button" disabled={!shop.enabled||!product||shop.busy} style={[s.button,(!shop.enabled||!product||shop.busy)&&s.disabled]} onPress={()=>void shop.buy(pack.id).catch(()=>Alert.alert(t('credits'),t('purchaseFailed')))}><Text style={s.title}>{t('creditPack',{count:pack.credits})}</Text><Text style={s.buttonText}>{product?.displayPrice?`${t('buyCredits')} · ${product.displayPrice}`:t('shopSoon')}</Text></Pressable>;})}
 <Pressable style={s.button} onPress={shop.reload}><Text style={s.buttonText}>{t('retry')}</Text></Pressable>
 {shop.enabled?<Pressable style={s.button} disabled={shop.busy} onPress={()=>void shop.recover().then(()=>Alert.alert(t('credits'),t('retry'))).catch(()=>Alert.alert(t('credits'),t('purchaseFailed')))}><Text style={s.buttonText}>{t('purchaseRetry')}</Text></Pressable>:null}
 </>}</ScrollView>;
}
const s=StyleSheet.create({content:{padding:20,gap:16},title:{fontSize:22,fontWeight:'800',color:c.text},body:{fontSize:14,lineHeight:23,color:c.text},notice:{color:c.orange,fontSize:13,lineHeight:22},button:{padding:16,gap:12,minHeight:48,backgroundColor:c.surface,borderWidth:1,borderColor:c.purple,borderRadius:14},buttonText:{color:c.text,fontWeight:'700',lineHeight:22},disabled:{opacity:0.5}});
