<?php
declare(strict_types=1);
final class SuperbetinSource {
 const BASE='https://www.mybets.today/soccer-predictions/';
 const DAYS=['today'=>0,'yesterday'=>-1,'tomorrow'=>1,'after-tomorrow'=>2];
 static function date(string $day):string {if(!array_key_exists($day,self::DAYS))throw new RuntimeException('Geçersiz gün');return (new DateTimeImmutable('today',new DateTimeZone('Europe/London')))->modify(sprintf('%+d days',self::DAYS[$day]))->format('Y-m-d');}
 static function fetch(string $url):string {
  $u=parse_url($url);if(($u['scheme']??'')!=='https'||($u['host']??'')!=='www.mybets.today'||isset($u['user'])||isset($u['pass'])||isset($u['port'])||isset($u['query'])||isset($u['fragment'])||strncmp($u['path']??'','/soccer-predictions/',20)!==0)throw new RuntimeException('Kaynak adresi reddedildi');
  $body='';$c=curl_init($url);curl_setopt_array($c,[CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>25,CURLOPT_ENCODING=>'',CURLOPT_USERAGENT=>'BetlerizSource/1.0',CURLOPT_WRITEFUNCTION=>function($c,$s)use(&$body){if(strlen($body)+strlen($s)>2000000)return 0;$body.=$s;return strlen($s);}]);$ok=curl_exec($c);$status=curl_getinfo($c,CURLINFO_HTTP_CODE);unset($c);if(!$ok||$status!==200)throw new RuntimeException('Kaynak yanıt vermedi (HTTP '.$status.'); mevcut tahminler korundu.');return $body;
 }
 static function fetchBatch(array $urls):array {
  $multi=curl_multi_init();$handles=[];$bodies=array_fill(0,count($urls),'');
  try{
   foreach($urls as $i=>$url){
    // Only links produced by the fixed provider listing are accepted.
    if(strpos($url,self::BASE.'match-prediction-analysis-')!==0||preg_match('/[?#@]/',$url))throw new RuntimeException('Kaynak adresi reddedildi');
    $c=curl_init($url);curl_setopt_array($c,[CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>25,CURLOPT_ENCODING=>'',CURLOPT_USERAGENT=>'BetlerizSource/1.0',CURLOPT_WRITEFUNCTION=>function($c,$chunk)use(&$bodies,$i){if(strlen($bodies[$i])+strlen($chunk)>2000000)return 0;$bodies[$i].=$chunk;return strlen($chunk);}]);$handles[$i]=$c;curl_multi_add_handle($multi,$c);
   }
   do{$code=curl_multi_exec($multi,$active);if($code!==CURLM_OK)throw new RuntimeException('Kaynak bağlantı hatası');if($active&&curl_multi_select($multi,1.0)===-1)usleep(10000);}while($active);
   foreach($handles as $i=>$c){$status=curl_getinfo($c,CURLINFO_HTTP_CODE);if(curl_errno($c)!==0||$status!==200)throw new RuntimeException('Kaynak yanıt vermedi (HTTP '.$status.'); mevcut tahminler korundu.');}
   return $bodies;
  }finally{foreach($handles as $c)curl_multi_remove_handle($multi,$c);unset($handles,$multi);}
 }
 static function xpath(string $html):DOMXPath {$d=new DOMDocument();$before=libxml_use_internal_errors(true);$d->loadHTML('<?xml encoding="UTF-8">'.$html,LIBXML_NONET);libxml_clear_errors();libxml_use_internal_errors($before);return new DOMXPath($d);}
 static function cls(string $name):string{return "contains(concat(' ',normalize-space(@class),' '),' $name ')";}
 static function text(DOMXPath $x,string $q,DOMNode $n):string{return trim($x->evaluate('string('.$q.')',$n));}
 static function listing(string $html,string $date):array {
  $x=self::xpath($html);$out=[];foreach($x->query('//a['.self::cls('linkgames').']') as $a){$url=$a->getAttribute('href');if(strpos($url,self::BASE.'match-prediction-analysis-')!==0)continue;$dateRaw=self::text($x,'.//time/@datetime',$a);if(!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/D',$dateRaw)||substr($dateRaw,0,10)!==$date)continue;try{$dt=new DateTimeImmutable($dateRaw);if(DateTimeImmutable::getLastErrors()!==false)continue;}catch(Throwable $e){continue;}
  $h=self::text($x,'.//*['.self::cls('homespan').']',$a);$v=self::text($x,'.//*['.self::cls('awayspan').']',$a);if(!$h||!$v)continue;$league=self::text($x,'preceding::div['.self::cls('titlegames').'][1]//*['.self::cls('leaguename').']',$a);
  $out[$url]=['matchId'=>'mybets-'.substr(hash('sha256',$url),0,24),'homeTeam'=>$h,'awayTeam'=>$v,'matchDate'=>$dateRaw,'competitionName'=>$league?:'Football','url'=>$url];if(count($out)>=200)break;}return array_values($out);
 }
 static function detail(string $html,array $row):array {
  $x=self::xpath($html);$p=[];$types=['Winner'=>['winner',['football','single','daily-odds','bonus','single-vip']],'Total Goals'=>['totalgoals',['over-under','daily-odds']],'Both Teams To Score'=>['btts',['special']],'HT/FT'=>['htft',['ht-ft']],'Correct Score'=>['correctscore',['correct-score']]];
  foreach($x->query('//div['.self::cls('predictionsmarkets').']') as $n){$type=self::text($x,'.//h2',$n);if(!isset($types[$type]))continue;$tip=self::text($x,'.//*['.self::cls('tipmarket').']',$n);$percentage=self::text($x,'.//*['.self::cls('predictionfirst').']//*['.self::cls('predictionvalue').']',$n);if(!$tip||!preg_match('/^(100|[0-9]{1,2})%$/D',$percentage,$m))continue;[$key,$tags]=$types[$type];if((int)$m[1]>=65)$tags[]='daily-sure';$tags[]='mixed';$p[$key]=['type'=>$type,'prediction'=>$tip,'percentage'=>(int)$m[1],'cardType'=>$tags];}
  unset($row['url']);$row['predictions']=$p;return $row;
 }
 static function atomic(string $path,array $data):void {$t=tempnam(dirname($path),'.source-');try{if($t===false||file_put_contents($t,json_encode($data,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR))===false||!rename($t,$path))throw new RuntimeException('Kaydedilemedi');}finally{if($t&&is_file($t))unlink($t);}}
 static function action(string $action,string $day):array {
  $date=self::date($day);$dir=getenv('BETLERIZ_DATA_DIR')?:dirname(__DIR__).'/var';if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Durum dizini açılamadı');if($action==='status'){$p=$dir.'/source-job.json';$j=is_file($p)?json_decode(file_get_contents($p),true):['status'=>'idle'];unset($j['queue'],$j['rows']);return $j;}$lock=fopen($dir.'/.source.lock','c');if(!$lock||!flock($lock,LOCK_EX|LOCK_NB))throw new RuntimeException('Aktarım devam ediyor');
  try{$path=$dir.'/source-job.json';$job=is_file($path)?json_decode(file_get_contents($path),true):[];
   if($action==='test'||$action==='start'){
    if($action==='start'&&($job['status']??'')==='running')throw new RuntimeException('Önce mevcut aktarımı bitirin veya iptal edin.');
    $rows=self::listing(self::fetch(self::BASE.($day==='today'?'':$day.'/')),$date);if(!$rows)throw new RuntimeException('Seçili tarihte kaynak maçı bulunamadı.');
    if($action==='test')return ['status'=>'connected','total'=>count($rows),'date'=>$date];
    $job=['status'=>'running','day'=>$day,'date'=>$date,'queue'=>$rows,'processed'=>0,'rows'=>[],'total'=>count($rows)];
   }elseif($action==='step'&&($job['status']??'')==='running'){
    $batch=array_slice($job['queue'],$job['processed'],PHP_SAPI==='cli'?4:1);$html=self::fetchBatch(array_column($batch,'url'));foreach($batch as $i=>$r){$parsed=self::detail($html[$i],$r);if(!$parsed['predictions'])throw new RuntimeException('Tahmin ayrıştırılamadı; yayımlanmış içerik korunuyor.');$job['rows'][]=$parsed;$job['processed']++;}
    if($job['processed']===$job['total']){$tips=getenv('BETLERIZ_TIP_DIR')?:dirname(__DIR__,2).'/panel/tips';self::atomic($tips.'/bettingtips_source_'.$job['date'].'.json',$job['rows']);$job['status']='complete';$job['lastSuccess']=date('c');}
   }elseif($action==='cancel'){$job['status']='canceled';}elseif($action!=='status')throw new RuntimeException('Geçersiz işlem');
   self::atomic($path,$job);unset($job['queue'],$job['rows']);return $job;
  }finally{flock($lock,LOCK_UN);fclose($lock);}
 }
}
