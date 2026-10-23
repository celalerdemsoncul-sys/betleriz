<?php
declare(strict_types=1);
require __DIR__.'/../server/lib/AppContent.php';
function check(bool $v,string $label):void{if(!$v)throw new RuntimeException($label);}
$file=sys_get_temp_dir().'/betleriz-content-'.bin2hex(random_bytes(6)).'.json';copy(__DIR__.'/../server/content/app.json',$file);
try{
 $store=new AppContent($file);$d=$store->read();$revision=$d['revision'];
 foreach(AppContent::LANGUAGES as $lang){$pages=AppContent::pages($d,$lang);check(count($pages)===3,'page count');foreach($pages as $p){check($p['language']===$lang&&$p['content']!=='','localized content');}}
 $bad=$d;$bad['stores']['android']=['status'=>'available','url'=>'https://evil.example/pay'];try{AppContent::validate($bad);throw new LogicException('invalid link accepted');}catch(RuntimeException $e){check($e->getMessage()==='invalid_store_url','invalid store blocked');}
 $bad=$d;$bad['stores']['ios']=['status'=>'available','url'=>''];try{AppContent::validate($bad);throw new LogicException('empty link accepted');}catch(RuntimeException $e){check($e->getMessage()==='store_url_required','missing store URL blocked');}
 $d['pages'][0]['translations']['tr']['title']='QA edit';$saved=$store->save($d,$revision);check($saved['revision']===$revision+1&&$store->read()['pages'][0]['translations']['tr']['title']==='QA edit','saved');
 try{$store->save($d,$revision);throw new LogicException('stale write accepted');}catch(RuntimeException $e){check($e->getMessage()==='revision_conflict','revision guard');}
 $d=$store->read();$d['pages'][1]['active']=false;check(count(AppContent::pages($d,'en'))===2,'hidden page');
 $d['pages'][0]['translations']['ar']['content']='';check(AppContent::pages($d,'ar')[0]['language']==='tr','explicit fallback');
 $d['pages'][0]['status']='published';try{AppContent::validate($d);throw new LogicException('incomplete publication accepted');}catch(RuntimeException $e){check($e->getMessage()==='published_translation_required','publish translation guard');}
 echo "PASS content: 9 languages, 3 pages, stores, atomic save, stale-write rejection, hidden pages, fallback, publication guard\n";
}finally{unlink($file);if(file_exists($file.'.lock'))unlink($file.'.lock');}
