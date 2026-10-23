import React from 'react';
import Svg,{Path,Circle} from 'react-native-svg';
import {colors} from './theme';
export type IconName='star'|'bell'|'search'|'settings'|'calendar'|'close'|'arrow'|'filter';
const paths:Record<IconName,string>={star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',search:'m16 16 5 5',settings:'m9 3-1 3-3 1-2 4 2 2v3l4 3 3-1 3 1 4-3v-3l2-2-2-4-3-1-1-3Z',calendar:'M5 4h14v17H5ZM8 2v5m8-5v5M5 10h14m-10 4h2m2 3h2',close:'m6 6 12 12M18 6 6 18',arrow:'m9 5 7 7-7 7',filter:'M4 5h16M7 12h10M10 19h4'};
export function Icon({name,size=22,color=colors.muted,filled=false}:{name:IconName;size?:number;color?:string;filled?:boolean}){
 return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d={paths[name]} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill={filled?color:'none'}/>{name==='search'?<Circle cx="10" cy="10" r="6" stroke={color} strokeWidth={1.8}/>:null}{name==='settings'?<Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8}/>:null}</Svg>;
}
