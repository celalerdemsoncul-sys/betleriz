import React,{useCallback,useEffect,useState} from 'react';
import {ActivityIndicator,AppState,Linking,Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {usePreferences} from './Preferences';
import {colors as c} from './theme';
import {PUBLIC_API_BASE} from './config';
import {Icon} from './Icon';
type Page={id:string;title:string;status:'draft'|'published';content?:string;language:string};
type Store={status:'soon'|'available';url:string};
type Info={stores:{android:Store;ios:Store};supportEmail:string;pages:Page[]};
async function getData(path:string,signal:AbortSignal){const response=await fetch(PUBLIC_API_BASE+path,{signal,headers:{Accept:'application/json'}});const json=await response.json();if(!response.ok||json.success!==true)throw new Error('unavailable');return json.data;}
function validStore(platform:'android'|'ios',url:unknown):url is string{return typeof url==='string'&&(platform==='android'?/^https:\/\/play\.google\.com\//:/^https:\/\/apps\.apple\.com\//).test(url);}
export default function AppInformation(){
 const p=usePreferences(),t=p.t;const [info,setInfo]=useState<Info|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(false),[refresh,setRefresh]=useState(0);
 const [selected,setSelected]=useState<string|null>(null),[page,setPage]=useState<Page|null>(null),[pageBusy,setPageBusy]=useState(false),[pageError,setPageError]=useState(false),[linkError,setLinkError]=useState(false);
 const direction={flexDirection:p.rtl?'row-reverse' as const:'row' as const};const align={textAlign:p.rtl?'right' as const:'left' as const};
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state==='active')setRefresh(n=>n+1);});return()=>sub.remove();},[]);
 useEffect(()=>{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);let alive=true;setLoading(true);setError(false);setInfo(null);
  getData('/api/app-config.php?lang='+p.language,controller.signal).then(data=>{
   if(!data||!data.stores||!Array.isArray(data.pages)||typeof data.supportEmail!=='string')throw new Error('invalid');
   const pages=data.pages.filter((v:any)=>typeof v?.id==='string'&&/^[a-z][a-z0-9-]{0,59}$/.test(v.id)&&typeof v.title==='string');
   if(alive)setInfo({...data,pages});
  }).catch(()=>{if(alive)setError(true);}).finally(()=>{clearTimeout(timer);if(alive)setLoading(false);});
  return()=>{alive=false;clearTimeout(timer);controller.abort();};
 },[p.language,refresh]);
 useEffect(()=>{
  if(!selected)return;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);let alive=true;setPage(null);setPageBusy(true);setPageError(false);
  getData('/api/pages.php?action=content&page_id='+encodeURIComponent(selected)+'&lang='+p.language,controller.signal).then(data=>{if(data?.id!==selected||typeof data.title!=='string'||typeof data.content!=='string')throw new Error('invalid');if(alive)setPage(data);}).catch(()=>{if(alive)setPageError(true);}).finally(()=>{clearTimeout(timer);if(alive)setPageBusy(false);});
  return()=>{alive=false;clearTimeout(timer);controller.abort();};
 },[selected,p.language,refresh]);
 const open=useCallback(async(url:string)=>{setLinkError(false);try{await Linking.openURL(url);}catch{setLinkError(true);}},[]);
 const close=()=>{setSelected(null);setPage(null);setLinkError(false);};
 return <View style={s.container}>
  <Text style={[s.heading,align]}>{t('appInformation')}</Text>
  {loading?<ActivityIndicator color={c.purple}/>:null}
  {error?<Text style={[s.error,align]}>{t('informationUnavailable')}</Text>:null}
  {info?<View style={s.panel}>
   {(['android','ios'] as const).map(platform=>{const store=info.stores[platform],available=store?.status==='available'&&validStore(platform,store.url);return <Pressable key={platform} accessibilityRole="link" accessibilityState={{disabled:!available}} disabled={!available} style={[s.row,direction]} onPress={()=>void open(store.url)}><Text style={s.body}>{platform==='android'?'Google Play':'App Store'}</Text><Text style={available?s.link:s.caption}>{t(available?'openStore':'storeSoon')}</Text></Pressable>;})}
   {info.pages.map(item=><Pressable key={item.id} accessibilityRole="button" style={[s.row,direction]} onPress={()=>{setSelected(item.id);setLinkError(false);}}><Text style={[s.body,s.flex,align]}>{item.title}</Text><Icon name="calendar" size={18} color={c.purple}/></Pressable>)}
   {info.supportEmail&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.supportEmail)?<Pressable accessibilityRole="link" style={[s.row,direction]} onPress={()=>void open('mailto:'+encodeURIComponent(info.supportEmail))}><Text style={s.body}>{t('contactSupport')}</Text><Text style={[s.link,s.flex,align]}>{info.supportEmail}</Text></Pressable>:null}
  </View>:null}
  {linkError?<Text style={s.error}>{t('linkUnavailable')}</Text>:null}
  <Pressable accessibilityRole="button" style={s.button} onPress={()=>setRefresh(n=>n+1)}><Text style={s.link}>{t('refreshInformation')}</Text></Pressable>
  <Modal visible={selected!==null} animationType="slide" onRequestClose={close}><SafeAreaView style={s.modal}>
   <View style={[s.toolbar,direction]}><Text style={[s.heading,s.flex,align]}>{page?.title??t('appInformation')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('back')} style={s.close} onPress={close}><Icon name="close"/></Pressable></View>
   {pageBusy?<ActivityIndicator color={c.purple}/>:null}
   {pageError?<View style={s.pad}><Text style={s.error}>{t('informationUnavailable')}</Text><Pressable style={s.button} onPress={()=>setRefresh(n=>n+1)}><Text style={s.link}>{t('refreshInformation')}</Text></Pressable></View>:null}
   <ScrollView contentContainerStyle={s.pad}>{page?<>
    {page.status==='draft'?<Text style={[s.draft,align]}>{t('draftInformation')}</Text>:null}
    {page.language!==p.language?<Text style={[s.caption,align]}>{t('contentFallback')}</Text>:null}
    <Text selectable style={[s.content,{textAlign:['ar','ur'].includes(page.language)?'right':'left',writingDirection:['ar','ur'].includes(page.language)?'rtl':'ltr'}]}>{page.content}</Text>
    <Pressable accessibilityRole="link" style={s.button} onPress={()=>void open(PUBLIC_API_BASE+'/pages/'+selected+'?lang='+p.language)}><Text style={s.link}>{t('openInBrowser')}</Text></Pressable>
    {linkError?<Text style={s.error}>{t('linkUnavailable')}</Text>:null}
   </>:null}</ScrollView>
  </SafeAreaView></Modal>
 </View>;
}
const s=StyleSheet.create({container:{marginTop:20},heading:{color:c.text,fontSize:18,fontWeight:'800',marginBottom:14},panel:{backgroundColor:c.surface,borderRadius:18,paddingHorizontal:16},row:{alignItems:'center',justifyContent:'space-between',paddingVertical:17,borderBottomWidth:1,borderBottomColor:c.border,gap:14},body:{color:c.text,fontSize:14},caption:{color:c.muted,fontSize:12},link:{color:c.purple,fontSize:13,fontWeight:'700'},flex:{flex:1},button:{minHeight:48,justifyContent:'center',paddingVertical:14},error:{color:c.orange,fontSize:13,lineHeight:21},draft:{color:c.orange,fontSize:13,lineHeight:21,marginBottom:16},modal:{flex:1,backgroundColor:c.background},toolbar:{padding:20,alignItems:'center',gap:10},close:{minWidth:44,minHeight:44,justifyContent:'center',alignItems:'center'},pad:{padding:20},content:{color:c.text,fontSize:15,lineHeight:25}});
