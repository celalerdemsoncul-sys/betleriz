<?php
declare(strict_types=1);
require_once __DIR__.'/../server/lib/CreditStore.php';
require_once __DIR__.'/../server/lib/SsvVerifier.php';
require_once __DIR__.'/../server/lib/TipCatalog.php';
function ok(bool $condition,string $message):void{if(!$condition)throw new RuntimeException('FAIL: '.$message);}
function rejects(callable $work,string $message):void{try{$work();}catch(RuntimeException $e){ok($e->getMessage()===$message,'expected '.$message.', got '.$e->getMessage());return;}throw new RuntimeException('FAIL: no error '.$message);}
$dir=sys_get_temp_dir().'/betleriz-credit-test-'.bin2hex(random_bytes(5));mkdir($dir,0700,true);
try{
 $store=new CreditStore($dir.'/db.sqlite','UTC');$now=strtotime('2030-11-01T12:00:00Z');
 $a=$store->register('test-ip',$now);$b=$store->register('test-ip',$now);$id=$store->authenticate($a['token']);ok($id===$a['id'],'auth token');rejects(fn()=>$store->authenticate(str_repeat('f',64)),'unauthorized');
 $first=null;
 for($n=0;$n<10;$n++){$session=$store->beginAd($id,$now+$n);$wallet=$store->grant($session['nonce'],$id,'tx'.$n,$now+$n+1,$now+$n+1);if($n===0)$first=$session;ok($wallet['balance']===$n+1,'one credit per event');}
 $wallet=$store->wallet($id,$now+100);ok($wallet['balance']===10&&$wallet['videosToday']===10,'daily cap and balance');
 $store->grant($first['nonce'],$id,'tx0',$now+1,$now+100);ok($store->wallet($id,$now+100)['balance']===10,'retry is idempotent');
 rejects(fn()=>$store->grant($first['nonce'],$id,'another-tx',$now+1,$now+100),'invalid_reward');
 rejects(fn()=>$store->grant($first['nonce'],$b['id'],'tx0',$now+1,$now+100),'invalid_reward');
 $wallet=$store->unlock($id,'tip-v1',$now+100);ok($wallet['balance']===0,'10 credits consumed');
 $wallet=$store->unlock($id,'tip-v1',$now+100);ok($wallet['balance']===0&&$store->isUnlocked($id,'tip-v1'),'same tip never charged twice');
 rejects(fn()=>$store->unlock($id,'tip-v2',$now+100),'daily_single_limit');
 for($n=10;$n<60;$n++){$session=$store->beginAd($id,$now+100+$n);$state=$store->grant($session['nonce'],$id,'extra'.$n,$now+101+$n,$now+101+$n);if($n===58)ok(!$state['fullViewAvailable'],'59 videos do not earn a full view');}
 ok($state['fullViewAvailable']&&$state['videosToday']===60&&$state['balance']===0,'extra 50 videos grant VIP only, no credits');
 rejects(fn()=>$store->beginAd($id,$now+200),'daily_limit');
 rejects(fn()=>$store->unlock($id,'another-single',$now+200),'daily_single_limit');
 $viewKey=str_repeat('a',32);$view=$store->openFullView($id,$viewKey,$now+200);
 ok($view['balance']===0&&$view['fullViewUsed']&&!$view['fullViewAvailable'],'full page consumes one view, not credits');
 $store->openFullView($id,$viewKey,$now+201);
 rejects(fn()=>$store->openFullView($id,str_repeat('b',32),$now+201),'full_view_used');
 $store->acknowledgeFullView($id,$viewKey,$now+201);
 rejects(fn()=>$store->openFullView($id,$viewKey,$now+202),'full_view_used');
 ok($store->wallet($id,$now+86400)['videosToday']===0,'UTC day reset');
 $tomorrow=$store->beginAd($id,$now+86400);$store->grant($tomorrow['nonce'],$id,'tomorrow',$now+86401,$now+86401);ok($store->wallet($id,$now+86401)['balance']===1,'new-day credits');
 $pending=$store->beginAd($b['id'],$now);rejects(fn()=>$store->grant($pending['nonce'],$id,'forged',$now+1,$now+1),'invalid_reward');
 $store->cancelAd($b['id'],$pending['nonce']);rejects(fn()=>$store->grant($pending['nonce'],$b['id'],'canceled',$now+1,$now+1),'invalid_reward');
 $pending=$store->beginAd($b['id'],$now);rejects(fn()=>$store->grant($pending['nonce'],$b['id'],'expired',$now+1801,$now+1801),'invalid_reward');
 for($n=0;$n<59;$n++)$store->beginAd($b['id'],$now);
 rejects(fn()=>$store->beginAd($b['id'],$now),'pending_limit');
 echo "PASS wallet: auth, 60 rewards, replay defense, cap, carry-over, atomic/idempotent unlock, pending slots, cancellation, expiry, one-time full view\n";
 $zone=new DateTimeZone('Asia/Famagusta');$vipStore=new CreditStore($dir.'/vip.sqlite','Asia/Famagusta');
 $late=(new DateTimeImmutable('2030-11-01 23:50:00',$zone))->getTimestamp();$midnight=(new DateTimeImmutable('2030-11-02 00:00:00',$zone))->getTimestamp();
 $v=$vipStore->register('vip',$late);$delayed=$vipStore->register('delayed',$late);
 for($n=0;$n<60;$n++){$session=$vipStore->beginAd($v['id'],$late);$state=$vipStore->grant($session['nonce'],$v['id'],'vip'.$n,$late+1,$late+1);}
 ok($state['fullViewExpiresAt']===gmdate('c',$midnight),'full-view pass expires at Cyprus midnight');
 ok($vipStore->wallet($v['id'],$midnight-1)['fullViewAvailable'],'unused full view available before midnight');
 $expired=$vipStore->wallet($v['id'],$midnight);ok(!$expired['fullViewAvailable']&&$expired['videosToday']===0&&$expired['balance']===10,'exact midnight expires full view and resets quota, not credits');
 $vipStore->unlock($v['id'],'after-midnight',$midnight);ok($vipStore->wallet($v['id'],$midnight)['balance']===0,'only the original ten credits can be spent after VIP expiry');
 for($n=0;$n<59;$n++){$session=$vipStore->beginAd($delayed['id'],$late);$vipStore->grant($session['nonce'],$delayed['id'],'delayed'.$n,$late+1,$late+1);}
 $session=$vipStore->beginAd($delayed['id'],$midnight-20);$state=$vipStore->grant($session['nonce'],$delayed['id'],'delayed-final',$midnight-1,$midnight+5);
 ok(!$state['fullViewAvailable']&&$state['videosToday']===0,'late yesterday callback cannot grant today full view');
 unset($vipStore);
 echo "PASS full-view midnight: Asia/Famagusta boundary, no 24-hour duration, credit carry-over, no delayed-callback next-day full view\n";
 $fixture=json_decode(file_get_contents(__DIR__.'/fixtures/ssv-valid.json'),true);$public=$fixture['publicKey'];$payload=$fixture['payload'];$b64=$fixture['signature'];
 $raw=$payload.'&signature='.$b64.'&key_id=1';$verified=SsvVerifier::verify($raw,['1'=>$public]);ok($verified['custom_data']==='abc','valid ECDSA callback');
 rejects(fn()=>SsvVerifier::verify(str_replace('reward_amount=1','reward_amount=100',$raw),['1'=>$public]),'invalid_signature');
 rejects(fn()=>SsvVerifier::verify($raw,['2'=>$public]),'invalid_signature');
 rejects(fn()=>SsvVerifier::verify($raw.'&user_id=attacker',['1'=>$public]),'invalid_signature');
 echo "PASS SSV: valid ECDSA signature, tamper rejection, unknown key, appended parameters\n";
 $fixtures=$dir.'/tips';mkdir($fixtures);
 $date=gmdate('c',time()+3600);
 file_put_contents($fixtures.'/today.json',json_encode([['homeTeam'=>'Test home','awayTeam'=>'Test away','matchDate'=>$date,'predictions'=>['winner'=>['prediction'=>'Test home','percentage'=>60,'cardType'=>['daily-sure']]]]]));
 $catalog=new TipCatalog($fixtures);$listing=$catalog->listing('daily-sure',gmdate('Y-m-d',time()+3600)===gmdate('Y-m-d')?'today':'tomorrow',$store,$id);ok(count($listing)===1&&!isset($listing[0]['prediction']),'locked prediction not returned');
 $tomorrowDay=gmdate('Y-m-d',time()+3600)!==gmdate('Y-m-d');
 $all=$catalog->all();$tipId=array_key_first($all);ok(strlen($tipId)===64,'versioned tip ID');
 echo "PASS catalogue: locked content redacted and versioned IDs\n";
}finally{unset($store);foreach(glob($dir.'/tips/*')?:[] as $f)unlink($f);if(is_dir($dir.'/tips'))rmdir($dir.'/tips');foreach(glob($dir.'/*')?:[] as $f)if(is_file($f))unlink($f);rmdir($dir);}
