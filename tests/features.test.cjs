const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');const fs=require('fs');const vm=require('vm');
function load(path){const source=fs.readFileSync(path,'utf8');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;const sandbox={exports:{},require:(name)=>name==='./translations.json'?JSON.parse(fs.readFileSync('src/betleriz/i18n/translations.json','utf8')):require(name)};vm.runInNewContext(compiled,sandbox);return sandbox.exports;}
const m=load('src/betleriz/model.ts');const i18n=load('src/betleriz/i18n/catalog.ts');
const NOW=Date.parse('2026-10-20T09:00:00Z');
const fixture=(home,kickoff,status='upcoming',sport='football')=>m.normalizeFixture({homeTeam:home,awayTeam:'Away',matchDate:kickoff,sport,status,competitionName:'League'});
test('normalization rejects malformed rows and ambiguous time zones',()=>{
 assert.equal(m.normalizeFixture(null),null);assert.equal(m.normalizeFixture({homeTeam:'X'}),null);
 assert.equal(fixture('A','2026-10-21T10:00:00').kickoff,null);
 assert.equal(fixture('A','2026-10-21T10:00:00+03:00').kickoff,'2026-10-21T07:00:00.000Z');
});
test('same team in different sports is not the same favorite',()=>{
 const a=fixture('United','2026-10-21T10:00:00Z');const b=fixture('United','2026-10-21T10:00:00Z','upcoming','basketball');
 assert.notEqual(m.teamKey(a,'home'),m.teamKey(b,'home'));
});
test('same-day kickoff reschedule keeps favorite identity; return leg stays distinct',()=>{
 assert.equal(fixture('A','2026-10-21T10:00:00Z').id,fixture('A','2026-10-21T12:00:00Z').id);
 assert.notEqual(fixture('A','2026-10-21T10:00:00Z').id,fixture('A','2026-10-22T10:00:00Z').id);
});
test('only upcoming favorite-team fixtures receive priority',()=>{
 const past=fixture('Favorite','2026-10-19T08:00:00Z','FT'),favorite=fixture('Favorite','2026-10-21T11:00:00Z'),other=fixture('Other','2026-10-20T10:00:00Z');
 const teams=[{key:m.teamKey(favorite,'home'),name:'Favorite',sport:'football'}];
 const ranked=m.rankFixtures([past,other,favorite],teams,NOW);
 assert.equal(ranked[0].id,favorite.id);assert.equal(ranked[2].id,past.id);
});
test('search, sport, league, local date and favorites filters compose',()=>{
 const date=new Date('2026-10-20T10:00:00Z');const a=fixture('Istanbul','2026-10-20T11:00:00Z');const b=fixture('Other','2026-10-21T12:00:00Z');
 const result=m.filterFixtures([a,b],{query:'istan',sport:'football',league:'League',date:'today',favoritesOnly:true},[],[a.id],date);
 assert.equal(result.length,1);assert.equal(result[0].id,a.id);
 assert.equal(m.filterFixtures([a],{query:'',sport:'tennis',league:'',date:'all',favoritesOnly:false},[],[],date).length,0);
});
test('deduplication does not duplicate a match present in several files',()=>{
 const a=fixture('A','2026-10-21T10:00:00Z');assert.equal(m.dedupeFixtures([a,{...a,score:'1 – 0'}]).length,1);
});
test('reminders reject missing kickoff, past lead time, finished and postponed matches',()=>{
 const a=fixture('A','2026-10-20T10:00:00Z');assert.equal(m.reminderAt(a,15,NOW),Date.parse('2026-10-20T09:45:00Z'));
 assert.throws(()=>m.reminderAt(a,60,NOW),/tooLate/);
 assert.throws(()=>m.reminderAt({...a,kickoff:null},15,NOW),/unknownTime/);
 assert.throws(()=>m.reminderAt({...a,status:'finished'},15,NOW),/tooLate/);
 assert.throws(()=>m.reminderAt(fixture('A','2026-10-20T10:00:00Z','POSTPONED'),15,NOW),/tooLate/);
});
test('all nine catalogs have identical keys and interpolation placeholders',()=>{
 const keys=Object.keys(i18n.catalogs.en).sort();assert.equal(i18n.languages.length,9);
 for(const lang of i18n.languages){const catalog=i18n.catalogs[lang.code];assert.deepEqual(Object.keys(catalog).sort(),keys);
 for(const key of keys){assert.ok(catalog[key].trim());assert.deepEqual((catalog[key].match(/\{\w+\}/g)||[]).sort(),(i18n.catalogs.en[key].match(/\{\w+\}/g)||[]).sort());}}
 assert.ok(!i18n.translate('ur','notificationBody',{home:'A',away:'B',minutes:15}).includes('{'));
});
