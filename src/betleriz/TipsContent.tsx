import React,{useEffect,useState} from 'react';
import {ActivityIndicator,Alert,AppState,FlatList,Pressable,RefreshControl,StyleSheet,Text,View} from 'react-native';
import {usePreferences} from './Preferences';
import {useCredits} from './Credits';
import {CreditTip,fetchCreditTips} from './creditApi';
import {tipCategories,tipDates,TipDate} from './tipCategories';
import {colors as c} from './theme';
import {languages} from './i18n/catalog';
import {Icon} from './Icon';
type Props={category:string|null;onCategory:(id:string|null)=>void;onCredits:()=>void;initialArchive?:boolean};
export default function TipsContent({category,onCategory,onCredits,initialArchive=false}:Props){
 const {t,rtl,language}=usePreferences();const {unlock,busy,wallet}=useCredits();
 const [date,setDate]=useState<TipDate>(initialArchive?'archive':'today');
 const [tips,setTips]=useState<CreditTip[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state==='active')setAttempt(n=>n+1);});const timer=setInterval(()=>setAttempt(n=>n+1),60000);return()=>{sub.remove();clearInterval(timer);};},[]);
 useEffect(()=>{
  if(!category)return;let active=true;setLoading(true);setError(false);setTips([]);
  fetchCreditTips(category,date).then(result=>{if(!Array.isArray(result))throw new Error('invalid_response');if(active)setTips(result);}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};
 },[category,date,attempt]);
 const text={textAlign:rtl?'right' as const:'left' as const,writingDirection:rtl?'rtl' as const:'ltr' as const};
 const direction={flexDirection:rtl?'row-reverse' as const:'row' as const};
 const locale=languages.find(l=>l.code===language)!.locale;
 const requestUnlock=(tip:CreditTip)=>{
  if(!wallet||wallet.balance<10){Alert.alert(t('credits'),t('insufficientCredits'),[{text:t('cancel'),style:'cancel'},{text:t('buyCredits'),onPress:onCredits}]);return;}
  if(!wallet.canUnlockTip){Alert.alert(t('credits'),t('singleUnlockUsed'),[{text:t('cancel'),style:'cancel'},{text:t('buyCredits'),onPress:onCredits}]);return;}
  Alert.alert(t('unlockTip'),t('unlockConfirm'),[{text:t('cancel'),style:'cancel'},{text:t('confirm'),onPress:()=>{
   void unlock(tip.id).then(opened=>setTips(rows=>rows.map(row=>row.id===opened.id?opened:row))).catch(e=>Alert.alert(t('credits'),t(e instanceof Error&&e.message==='daily_single_limit'?'singleUnlockUsed':e instanceof Error&&e.message==='daily_single_required'?'singleUnlockNeedVideos':e instanceof Error&&e.message==='insufficient_credits'?'insufficientCredits':'walletOffline')));
  }}]);
 };
 const chip=(label:string,active:boolean,onPress:()=>void,key:string)=><Pressable key={key} accessibilityRole="button" accessibilityState={{selected:active}} style={[s.chip,active&&s.selected]} onPress={onPress}><Text style={s.label}>{label}</Text></Pressable>;
 const header=<View style={s.header}>
  <View style={[s.row,direction]}>{category?<Pressable accessibilityRole="button" onPress={()=>onCategory(null)} style={s.chip}><Text style={s.label}>{t('back')}</Text></Pressable>:null}<Text style={[s.title,text]}>{category==='all'?t('all'):category?t(tipCategories.find(item=>item.id===category)!.label):t('home')}</Text></View>
  <Pressable accessibilityRole="button" style={[s.creditLink,direction]} onPress={onCredits}><View style={s.grow}><Text style={[s.label,text]}>{wallet?t('creditBalance',{count:wallet.balance}):t('credits')}</Text><Text style={[s.caption,text]}>{t('earnCredits')} · {t('buyCredits')}</Text></View><Icon name="arrow" color={c.orange}/></Pressable>
  {!category?<><Text style={[s.body,text]}>{t('tipCategoriesHint')}</Text>{[false,true].map(vip=><View key={String(vip)}><Text style={[s.section,text]}>{t(vip?'vipCategories':'predictionCategories')}</Text><View style={[s.grid,direction]}>{tipCategories.filter(item=>item.vip===vip).map(item=><Pressable key={item.id} accessibilityRole="button" style={[s.category,item.vip&&s.vip]} onPress={()=>onCategory(item.id)}><Icon name={item.vip?'star':'filter'} color={item.vip?c.orange:c.purple}/><Text style={[s.categoryText,text]}>{t(item.label)}</Text>{item.vip?<Text style={s.vipLabel}>VIP</Text>:null}</Pressable>)}</View></View>)}{chip(t('all'),false,()=>onCategory('all'),'all')}</>:<>
   <View style={[s.wrap,direction]}>{tipDates.map(day=>chip(t(day.label),date===day.id,()=>setDate(day.id),day.id))}</View>
   {date==='archive'?<Text style={[s.notice,text]}>{t('archiveTipsNotice')}</Text>:null}
  </>}
 </View>;
 return <FlatList data={category?tips:[]} keyExtractor={tip=>tip.id} contentContainerStyle={s.content} ListHeaderComponent={header} refreshControl={<RefreshControl refreshing={loading} onRefresh={()=>setAttempt(n=>n+1)} tintColor={c.purple}/>}
  ListEmptyComponent={category?loading?<ActivityIndicator color={c.purple}/>:<View style={s.card}><Text style={[s.body,text]}>{t(error?'tipsError':'tipsEmpty')}</Text>{!error&&date!=='archive'?<><Text style={[s.caption,text]}>{t('noCurrentTipsHint')}</Text>{chip(t('openArchive'),false,()=>setDate('archive'),'archive')}</>:null}{chip(t('tipsRefresh'),false,()=>setAttempt(n=>n+1),'retry')}</View>:null}
  renderItem={({item:tip})=><View style={s.card}><View style={[s.row,direction]}><Text style={[s.caption,s.grow,text]}>{tip.competitionName}</Text>{tip.historical?<Text style={s.vipLabel}>{t('archived')}</Text>:null}</View><Text style={[s.team,text]}>{tip.homeTeam} – {tip.awayTeam}</Text><Text style={[s.caption,text]}>{tip.matchDate?new Date(tip.matchDate).toLocaleString(locale):t('noDate')}</Text>{tip.score?<Text style={[s.team,text]}>{tip.score}</Text>:null}
   {tip.unlocked&&tip.prediction?<><Text style={[s.prediction,text]}>{tip.prediction.type}: {tip.prediction.prediction}{tip.prediction.percentage==null?'':` · ${tip.prediction.percentage}%`}</Text><Text style={[s.caption,text]}>{tip.prediction.result?`${t('tipResult')}: ${t(tip.prediction.result==='WON'?'won':tip.prediction.result==='LOST'?'lost':'pendingResult')}`:t(tip.historical?'archiveTipsNotice':'unlocked')}</Text></>:<Pressable accessibilityRole="button" disabled={busy||!tip.canUnlock} style={[s.chip,s.selected,(!tip.canUnlock||busy)&&s.disabled]} onPress={()=>requestUnlock(tip)}><Text style={s.label}>{t(tip.canUnlock?'unlockTip':'archived')}</Text></Pressable>}
  </View>}/>
}
const s=StyleSheet.create({content:{padding:20,paddingBottom:30},header:{gap:14,marginBottom:16},title:{color:c.text,fontSize:26,fontWeight:'800',flex:1},section:{color:c.text,fontSize:19,fontWeight:'800',marginBottom:12},row:{alignItems:'center',gap:12},grow:{flex:1},grid:{flexWrap:'wrap',gap:12},category:{width:'47%',minHeight:112,padding:16,gap:10,backgroundColor:c.surface,borderWidth:1,borderColor:c.border,borderRadius:18},vip:{borderColor:'#6F416E'},categoryText:{color:c.text,fontSize:14,fontWeight:'700'},vipLabel:{color:c.orange,fontSize:11,fontWeight:'800'},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:14,paddingVertical:12,borderWidth:1,borderColor:c.border,borderRadius:16,alignSelf:'flex-start'},selected:{backgroundColor:'#4C2766',borderColor:c.purple},label:{color:c.text,fontSize:13,fontWeight:'600'},card:{backgroundColor:c.surface,padding:18,borderRadius:18,gap:12,borderWidth:1,borderColor:c.border,marginBottom:12},body:{color:c.text,fontSize:15,lineHeight:24},caption:{color:c.muted,fontSize:12,lineHeight:20},team:{color:c.text,fontSize:17,fontWeight:'800'},prediction:{color:c.orange,fontSize:16,lineHeight:24},notice:{color:c.orange,fontSize:13,lineHeight:22},disabled:{opacity:0.4},creditLink:{padding:16,gap:10,borderRadius:16,borderWidth:1,borderColor:c.purple,backgroundColor:c.surface,alignItems:'center'}});
