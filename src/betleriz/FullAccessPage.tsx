import React from 'react';
import {FlatList,Modal,Pressable,StatusBar,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCredits} from './Credits';
import {usePreferences} from './Preferences';
import {colors as c} from './theme';
export default function FullAccessPage(){
 const {fullPage,closeFullPage}=useCredits();const {t,rtl,language}=usePreferences();const text={textAlign:rtl?'right' as const:'left' as const,writingDirection:rtl?'rtl' as const:'ltr' as const};
 return <Modal visible={!!fullPage} animationType="slide" onRequestClose={closeFullPage}><SafeAreaView style={s.root}><StatusBar barStyle="light-content"/><View style={s.header}><Text style={[s.title,text]}>{t('fullViewTitle')}</Text><Pressable accessibilityRole="button" style={s.close} onPress={closeFullPage}><Text style={s.link}>{t('back')}</Text></Pressable></View><Text style={[s.notice,text]}>{t('fullViewOnceInfo')}</Text><FlatList data={fullPage?.tips??[]} keyExtractor={tip=>tip.id} contentContainerStyle={s.content} renderItem={({item})=><View style={s.card}><Text style={[s.caption,text]}>{item.competitionName}</Text><Text style={[s.team,text]}>{item.homeTeam} – {item.awayTeam}</Text><Text style={[s.caption,text]}>{item.matchDate?new Date(item.matchDate).toLocaleString(language):t('noDate')}</Text><Text style={[s.prediction,text]}>{item.prediction?.type}: {item.prediction?.prediction}{item.prediction?.percentage==null?'':` · ${item.prediction.percentage}%`}</Text></View>}/></SafeAreaView></Modal>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:c.background},header:{flexDirection:'row',padding:20,alignItems:'center',gap:12},title:{flex:1,color:c.text,fontSize:22,fontWeight:'800'},close:{padding:12,minHeight:44},link:{color:c.orange,fontSize:14},notice:{color:c.muted,fontSize:12,lineHeight:20,paddingHorizontal:20,paddingBottom:16},content:{padding:20,gap:14},card:{backgroundColor:c.surface,padding:18,borderWidth:1,borderColor:c.border,borderRadius:16,gap:10},caption:{color:c.muted,fontSize:12},team:{color:c.text,fontWeight:'800',fontSize:17},prediction:{color:c.orange,fontSize:15,lineHeight:22}});
