export type Sport = 'football' | 'basketball' | 'tennis';
export type Fixture = {
 id: string; home: string; away: string; homeId?: string; awayId?: string; league: string;
 sport: Sport; kickoff: string | null; status: 'upcoming' | 'live' | 'finished' | 'archived' | 'unavailable'; score?: string;
};
export type Team = {key:string; name:string; sport:Sport};
export type Reminder = {id:string; fixture:Fixture; minutes:number; scheduledAt:number};
export function kickoffMs(f:Fixture):number { return f.kickoff ? Date.parse(f.kickoff) : NaN; }
export function teamKey(f:Fixture, side:'home'|'away'):string {
 // Name + sport remains stable when feed provider ids change between snapshots.
 return `${f.sport}:${f[side].normalize('NFKC').trim().toLocaleLowerCase('en-US')}`;
}
export function fixtureKey(sport:Sport, home:string, away:string, kickoff:string|null, rawId:unknown):string {
 return `${sport}:${home.trim().toLocaleLowerCase('en-US')}:${away.trim().toLocaleLowerCase('en-US')}:${kickoff ? kickoff.slice(0,10) : String(rawId)}`;
}
export function normalizeFixture(row:any):Fixture | null {
 if (!row || typeof row !== 'object') return null;
 const home = row.homeTeam ?? row.home; const away = row.awayTeam ?? row.away;
 if (typeof home !== 'string' || !home.trim() || typeof away !== 'string' || !away.trim()) return null;
 const sport:Sport = row.sport === 'basketball' || row.sport === 'tennis' ? row.sport : 'football';
 const raw = row.kickoff ?? row.matchDate;
 const kickoff = typeof raw === 'string' && /T\d{2}:\d{2}/.test(raw) && /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw) && Number.isFinite(Date.parse(raw)) ? new Date(raw).toISOString() : null;
 const status = String(row.liveScore?.status ?? row.status ?? '').toUpperCase();
 const live = ['LIVE','HT','1H','2H','ET'].includes(status);
 const finished = ['FT','AET','PEN','FINISHED'].includes(status);
 const unavailable = ['UNAVAILABLE','CANCELLED','CANCELED','POSTPONED','ABD','PST','CANC'].includes(status);
 const archived = status==='ARCHIVED' || (live && !!kickoff && Date.parse(kickoff)<Date.now()-12*3600000);
 const score = row.liveScore && Number.isFinite(row.liveScore.homeScore) && Number.isFinite(row.liveScore.awayScore) && (live || finished)
  ? `${row.liveScore.homeScore} – ${row.liveScore.awayScore}` : (typeof row.score==='string'?row.score:undefined);
 return {id:fixtureKey(sport,home,away,kickoff,row.matchId ?? row.id),home,away,homeId:row.homeTeamId,awayId:row.awayTeamId,league:String(row.competitionName ?? row.league ?? ''),sport,kickoff,status:unavailable?'unavailable':archived?'archived':live?'live':finished?'finished':'upcoming',score};
}
export function dedupeFixtures(rows:Fixture[]):Fixture[] {
 return [...new Map(rows.map(f=>[f.id,f])).values()];
}
export function isUpcoming(f:Fixture, now=Date.now()):boolean {return f.status === 'upcoming' && kickoffMs(f) > now;}
export function followsFixture(f:Fixture, teams:Team[]):boolean {return teams.some(t=>t.key===teamKey(f,'home') || t.key===teamKey(f,'away'));}
export function rankFixtures(fixtures:Fixture[],teams:Team[],now=Date.now()):Fixture[] {
 return [...fixtures].sort((a,b)=>{
 const priority=(f:Fixture)=>isUpcoming(f,now)&&followsFixture(f,teams)?0:f.status==='live'?1:isUpcoming(f,now)?2:3;
 const rank=priority(a)-priority(b); if(rank)return rank;
 const at=kickoffMs(a), bt=kickoffMs(b);
 const time = (Number.isFinite(at)?at:Number.MAX_SAFE_INTEGER)-(Number.isFinite(bt)?bt:Number.MAX_SAFE_INTEGER);
 return time || a.id.localeCompare(b.id);
 });
}
export type Filters={query:string;sport:Sport|'all';league:string;date:'all'|'today'|'tomorrow';favoritesOnly:boolean};
export function filterFixtures(fixtures:Fixture[],filter:Filters,teams:Team[],saved:string[],now=new Date()):Fixture[] {
 const query=filter.query.normalize('NFKC').trim().toLocaleLowerCase();
 const target = new Date(now); if(filter.date==='tomorrow')target.setDate(target.getDate()+1);
 return fixtures.filter(f=>{
 const time=new Date(kickoffMs(f));
 return (!query || `${f.home} ${f.away} ${f.league}`.normalize('NFKC').toLocaleLowerCase().includes(query))
 && (filter.sport==='all'||filter.sport===f.sport) && (!filter.league||filter.league===f.league)
 && (filter.date==='all'||(time.getFullYear()===target.getFullYear()&&time.getMonth()===target.getMonth()&&time.getDate()===target.getDate()))
 && (!filter.favoritesOnly||saved.includes(f.id)||followsFixture(f,teams));
 });
}
export function reminderAt(f:Fixture,minutes:number,now=Date.now()):number {
 const time=kickoffMs(f); if(!Number.isFinite(time))throw new Error('unknownTime');
 const alarm=time-minutes*60000; if(!isUpcoming(f,now)||alarm<=now)throw new Error('tooLate');return alarm;
}
