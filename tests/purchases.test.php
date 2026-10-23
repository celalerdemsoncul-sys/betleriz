<?php
declare(strict_types=1);
require_once __DIR__.'/../server/lib/CreditStore.php';
require_once __DIR__.'/../server/lib/PlayCredits.php';
require_once __DIR__.'/../server/lib/TipCatalog.php';
require_once __DIR__.'/../server/lib/TipPublisher.php';
function check(bool $value,string $message):void{if(!$value)throw new RuntimeException($message);}
function fails(callable $call,string $expected):void{try{$call();}catch(RuntimeException $e){check($e->getMessage()===$expected,$e->getMessage());return;}throw new RuntimeException('Expected '.$expected);}
$dir=sys_get_temp_dir().'/betleriz-shop-'.bin2hex(random_bytes(5));mkdir($dir,0700,true);
try{
 $store=new CreditStore($dir.'/db.sqlite','UTC');$now=time();$a=$store->register('shop',$now);$b=$store->register('shop',$now);
 $receipt=['purchaseState'=>0,'obfuscatedExternalAccountId'=>$a['id'],'productId'=>'betleriz_credits_50','quantity'=>1];
 $amount=PlayCredits::validate($receipt,$a['id'],'betleriz_credits_50');check($amount===50,'server pack size');
 fails(fn()=>PlayCredits::validate(array_replace($receipt,['purchaseState'=>2]),$a['id'],'betleriz_credits_50'),'invalid_purchase');
 fails(fn()=>PlayCredits::validate(array_replace($receipt,['purchaseState'=>1]),$a['id'],'betleriz_credits_50'),'invalid_purchase');
 fails(fn()=>PlayCredits::validate($receipt,$b['id'],'betleriz_credits_50'),'invalid_purchase');
 fails(fn()=>PlayCredits::validate($receipt,$a['id'],'attacker-product'),'invalid_purchase');
 fails(fn()=>PlayCredits::validate(array_replace($receipt,['quantity'=>2]),$a['id'],'betleriz_credits_50'),'invalid_purchase');
 fails(fn()=>PlayCredits::validate(array_replace($receipt,['refundableQuantity'=>0]),$a['id'],'betleriz_credits_50'),'invalid_purchase');
 $store->grantPurchase($a['id'],'purchase-token','betleriz_credits_50',$amount,$now);
 $state=$store->grantPurchase($a['id'],'purchase-token','betleriz_credits_50',$amount,$now);
 check($state['balance']===50&&$state['paidBalance']===50,'idempotent payment');
 fails(fn()=>$store->grantPurchase($b['id'],'purchase-token','betleriz_credits_50',50,$now),'invalid_purchase');
 for($i=0;$i<5;$i++)$state=$store->unlock($a['id'],'paid-tip-'.$i,$now);
 check($state['balance']===0&&$state['paidBalance']===0&&$state['singleUnlocksToday']===0,'paid unlocks do not consume daily ad entitlement');
 for($i=0;$i<10;$i++){$ad=$store->beginAd($a['id'],$now);$store->grant($ad['nonce'],$a['id'],'reward-'.$i,$now,$now);}
 $state=$store->unlock($a['id'],'reward-tip',$now);check($state['balance']===0&&$state['singleUnlocksToday']===1,'reward unlock still works');
 fails(fn()=>$store->unlock($a['id'],'second-reward-tip',$now),'daily_single_limit');
 $store->grantPurchase($a['id'],'next-payment','betleriz_credits_10',10,$now);$store->unlock($a['id'],'after-reward-paid',$now);
 check($store->wallet($a['id'],$now)['balance']===0,'paid unlock after reward limit');
 mkdir($dir.'/tips');$rows=[];
 foreach([-1,1,2] as $day)$rows[]=['homeTeam'=>'Home '.$day,'awayTeam'=>'Away','matchDate'=>gmdate('c',strtotime(gmdate('Y-m-d').' 12:00:00 UTC')+$day*86400),'predictions'=>['winner'=>['type'=>'Winner','prediction'=>'Home','cardType'=>['special']]]];
 file_put_contents($dir.'/tips/today.json',json_encode($rows));$catalog=new TipCatalog($dir.'/tips');
 $archive=$catalog->listing('special','archive',$store,$a['id']);check(count($archive)===1&&$archive[0]['access']==='archive'&&isset($archive[0]['prediction'])&&!$archive[0]['canUnlock'],'archive cannot include future tips or charge credits');
 $tomorrow=$catalog->listing('special','tomorrow',$store,$a['id']);check(count($tomorrow)===1&&!isset($tomorrow[0]['prediction']),'future content stays locked');
 check(count($catalog->listing('special','yesterday',$store,$a['id']))===1,'yesterday selector');
 check(count($catalog->listing('special','after-tomorrow',$store,$a['id']))===1,'after tomorrow selector');
 $input=['homeTeam'=>'Home','awayTeam'=>'Away','competitionName'=>'Test league','matchDate'=>gmdate('c',time()+86400),'type'=>'Winner','prediction'=>'Home','category'=>'football','percentage'=>65];
 TipPublisher::save($dir.'/tips',$input);TipPublisher::save($dir.'/tips',$input);
 $managed=json_decode(file_get_contents($dir.'/tips/bettingtips_managed.json'),true);check(count($managed)===1,'publishing retry does not duplicate match');
 check(count($managed[0]['predictions'])===1,'publishing retry replaces same category');
 $input['category']='special';TipPublisher::save($dir.'/tips',$input);$managed=json_decode(file_get_contents($dir.'/tips/bettingtips_managed.json'),true);check(count($managed[0]['predictions'])===2,'categories on same match are retained');
 try{TipPublisher::row(array_replace($input,['matchDate'=>gmdate('c',time()-86400)]));throw new LogicException('old date accepted');}catch(RuntimeException $e){}
 try{TipPublisher::row(array_replace($input,['category'=>'../attack']));throw new LogicException('invalid category accepted');}catch(RuntimeException $e){}
 echo "PASS purchases: completed-only, account binding, SKU allowlist, no duplicate credit, cross-wallet replay, quantity/refund guard, paid vs reward spending and daily limits\nPASS tips: yesterday, after tomorrow, past-only readable archive, future prediction redaction\nPASS publisher: no duplicate match/category, preserves other categories, rejects expired dates and invalid category\n";
}finally{unset($store);if(is_file($dir.'/tips/.publisher.lock'))unlink($dir.'/tips/.publisher.lock');foreach(glob($dir.'/tips/*')?:[] as $p)unlink($p);if(is_dir($dir.'/tips'))rmdir($dir.'/tips');foreach(glob($dir.'/*')?:[] as $p)if(is_file($p))unlink($p);rmdir($dir);}
