import React from 'react';
import {Modal,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {usePreferences} from './Preferences';
import {tipCategories} from './tipCategories';
import {colors as c} from './theme';
import AppInformation from './AppInformation';
export type ContentTab='fixtures'|'favorites'|'settings'|'tips'|'shop';
type Props={visible:boolean;close:()=>void;select:(tab:ContentTab)=>void;category:(id:string)=>void;archive:()=>void;earn:()=>void};
export default function ContentMenu({visible,close,select,category,archive,earn}:Props){
 const {t,rtl}=usePreferences();const align={textAlign:rtl?'right' as const:'left' as const};
 const item=(label:string,press:()=>void,key:string)=><Pressable key={key} accessibilityRole="button" style={s.item} onPress={()=>{close();press();}}><Text style={[s.text,align]}>{label}</Text></Pressable>;
 return <Modal visible={visible} animationType="slide" onRequestClose={close}><SafeAreaView style={s.root}><View style={s.header}><Text style={s.title}>{t('menu')}</Text><Pressable style={s.item} accessibilityRole="button" onPress={close}><Text style={s.text}>{t('back')}</Text></Pressable></View><ScrollView contentContainerStyle={s.content}>
  {item(t('home'),()=>select('tips'),'home')}{item(t('fixtures'),()=>select('fixtures'),'fixtures')}{item(t('favorites'),()=>select('favorites'),'favorites')}
  <Text style={[s.section,align]}>{t('credits')}</Text>{item(t('earnCredits'),earn,'earn')}{item(t('buyCredits'),()=>select('shop'),'buy')}
  {[false,true].map(vip=><View key={String(vip)}><Text style={[s.section,align]}>{t(vip?'vipCategories':'predictionCategories')}</Text>{tipCategories.filter(v=>v.vip===vip).map(v=>item(t(v.label),()=>category(v.id),v.id))}</View>)}
  {item(t('tipsArchive'),archive,'archive')}{item(t('settings'),()=>select('settings'),'settings')}<AppInformation/>
 </ScrollView></SafeAreaView></Modal>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:c.background},header:{paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontSize:24,fontWeight:'800',color:c.text},content:{padding:20},section:{color:c.orange,fontSize:16,fontWeight:'800',marginTop:22,marginBottom:10},item:{paddingVertical:16,paddingHorizontal:10,minHeight:48,borderBottomWidth:1,borderBottomColor:c.border},text:{color:c.text,fontSize:15}});
