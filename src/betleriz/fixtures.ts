import AsyncStorage from '@react-native-async-storage/async-storage';
import {FIXTURE_API_URL} from './config';
import archive from './data/archive.json';
import {Fixture,normalizeFixture,dedupeFixtures} from './model';
const CACHE='@betleriz/fixtures-v1';
export type FixtureResult={fixtures:Fixture[];source:'local'|'cached'|'archive';updatedAt:string|null};
function normalize(rows:unknown):Fixture[]{
 if(!Array.isArray(rows))throw new Error('Invalid fixtures');
 return dedupeFixtures(rows.map(normalizeFixture).filter((f):f is Fixture=>f!==null));
}
export async function loadFixtures():Promise<FixtureResult>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch(FIXTURE_API_URL,{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const body=await response.json(); if(body.success!==true)throw new Error('Invalid response');
  const result:FixtureResult={fixtures:normalize(body.data),source:'local',updatedAt:typeof body.updatedAt==='string'?body.updatedAt:null};
  try {await AsyncStorage.setItem(CACHE,JSON.stringify(result));}catch{/* A cache failure must not discard fresh data. */}
  return result;
 }catch{
  try{
   const cached=JSON.parse(await AsyncStorage.getItem(CACHE) ?? 'null');
   if(cached && Array.isArray(cached.fixtures))return {fixtures:normalize(cached.fixtures),source:'cached',updatedAt:cached.updatedAt??null};
  }catch{/* Show the dated archive if cache is corrupt or inaccessible. */}
  return {fixtures:normalize(archive),source:'archive',updatedAt:null};
 }finally{clearTimeout(timer);}
}
