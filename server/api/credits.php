<?php
declare(strict_types=1);
require_once __DIR__.'/../lib/CreditStore.php';require_once __DIR__.'/../lib/SsvVerifier.php';require_once __DIR__.'/../lib/TipCatalog.php';
require_once __DIR__.'/../lib/PlayCredits.php';
function send(array $payload,int $status=200):void{http_response_code($status);echo json_encode(['success'=>true]+$payload,JSON_UNESCAPED_UNICODE);exit;}
try {
    $mode=getenv('BETLERIZ_AD_MODE')?:'off';if(!in_array($mode,['off','test','production'],true))$mode='off';
    $directory=getenv('BETLERIZ_DATA_DIR')?:__DIR__.'/../var';
    $store=new CreditStore($directory.'/credits-'.$mode.'.sqlite',getenv('BETLERIZ_REWARD_TIMEZONE')?:'Asia/Famagusta');$catalog=new TipCatalog(getenv('BETLERIZ_TIP_DIR')?:dirname(__DIR__,2).'/panel/tips');
    $now=time();$method=$_SERVER['REQUEST_METHOD'];
    if($path==='/v1/config'&&$method==='GET')send(['adMode'=>$mode]);
    if($path==='/v1/test-complete'&&$mode!=='test')throw new RuntimeException('forbidden');
    if($path==='/v1/ssv'&&$method==='GET'){
        if($mode!=='production')throw new RuntimeException('ads_not_configured');
        $params=SsvVerifier::verify($_SERVER['QUERY_STRING']??'',SsvVerifier::googleKeys($directory.'/google-keys.json'));
        $unit=getenv('BETLERIZ_REWARDED_AD_UNIT')?:'';$unitSuffix=substr($unit,strrpos($unit,'/')+1);
        if($unit===''||!in_array($params['ad_unit'],[$unit,$unitSuffix],true)||$params['reward_amount']!=='1'||$params['reward_item']!=='video'||!ctype_digit($params['timestamp']))throw new RuntimeException('invalid_reward');
        $store->grant($params['custom_data'],$params['user_id'],$params['transaction_id'],(int)floor((float)$params['timestamp']/1000),$now);send(['verified'=>true]);
    }
    if($method==='POST'){
        if((int)($_SERVER['CONTENT_LENGTH']??0)>4096)throw new RuntimeException('invalid_request');
        $body=json_decode(file_get_contents('php://input'),true);if(!is_array($body))throw new RuntimeException('invalid_request');
    }else{$body=[];}
    if($path==='/v1/register'&&$method==='POST')send($store->register($_SERVER['REMOTE_ADDR']??'unknown',$now));
    $header=$_SERVER['HTTP_AUTHORIZATION']??'';
    if(!preg_match('/^Bearer ([a-f0-9]{64})$/D',$header,$auth))throw new RuntimeException('unauthorized');
    $wallet=$store->authenticate($auth[1]);
    $walletData=static fn()=> $store->wallet($wallet,time())+['adMode'=>$mode,'adUnitId'=>$mode==='test'?'ca-app-pub-3940256099942544/5224354917':(getenv('BETLERIZ_REWARDED_AD_UNIT')?:'')];
    if($path==='/v1/wallet'&&$method==='GET')send(['wallet'=>$walletData()]);
    if($path==='/v1/credit-products'&&$method==='GET')send(['enabled'=>PlayCredits::enabled(),'accountId'=>$wallet,'products'=>array_map(static fn($id,$credits)=>['id'=>$id,'credits'=>$credits],array_keys(PlayCredits::PRODUCTS),array_values(PlayCredits::PRODUCTS))]);
    if($path==='/v1/credit-purchase'&&$method==='POST'){
        $product=(string)($body['productId']??'');$token=(string)($body['purchaseToken']??'');
        $amount=PlayCredits::verify($wallet,$product,$token);
        $store->grantPurchase($wallet,$token,$product,$amount,$now);send(['wallet'=>$walletData()]);
    }
    if($path==='/v1/ad-session'&&$method==='POST'){
        if(!in_array($mode,['test','production'],true))throw new RuntimeException('ads_not_configured');
        if($mode==='production'&&!(getenv('BETLERIZ_REWARDED_AD_UNIT')?:''))throw new RuntimeException('ads_not_configured');
        send($store->beginAd($wallet,$now));
    }
    if($path==='/v1/ad-cancel'&&$method==='POST'){$store->cancelAd($wallet,(string)($body['nonce']??''));send(['wallet'=>$walletData()]);}
    if($path==='/v1/test-complete'&&$method==='POST'){
        // Development-only adapter. No client reward endpoint exists in production.
        if($mode!=='test'||!in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true))throw new RuntimeException('forbidden');
        $nonce=(string)($body['nonce']??'');$store->grant($nonce,$wallet,'test:'.$nonce,$now,$now);send(['wallet'=>$walletData()]);
    }
    if($path==='/v1/tips'&&$method==='GET')send(['data'=>$catalog->listing((string)($_GET['category']??'daily-sure'),(string)($_GET['date']??'today'),$store,$wallet,(int)($_GET['offset']??0))]);
    if($path==='/v1/full-view'&&$method==='POST'){
        $data=array_values(array_filter($catalog->all(),static fn($tip)=>$tip['canUnlock']));
        if(!$data)throw new RuntimeException('no_tips');
        $store->openFullView($wallet,(string)($body['requestKey']??''),$now);
        $data=array_map(static fn($tip)=>$tip+['unlocked'=>true,'access'=>'one-view'],$data);$state=$walletData();send(['wallet'=>$state,'data'=>$data,'expiresAt'=>$state['resetAt']]);
    }
    if($path==='/v1/full-view-ack'&&$method==='POST'){$store->acknowledgeFullView($wallet,(string)($body['requestKey']??''),$now);send(['wallet'=>$walletData()]);}
    if($path==='/v1/unlock'&&$method==='POST'){
        $id=(string)($body['tipId']??'');$tip=$catalog->find($id);if(!$tip)throw new RuntimeException('invalid_tip');
        if(!$tip['canUnlock']&&!$store->isUnlocked($wallet,$id))throw new RuntimeException('tip_expired');
        $store->unlock($wallet,$id,$now);$state=$walletData();send(['wallet'=>$state,'tip'=>$tip+['unlocked'=>true,'access'=>'permanent']]);
    }
    throw new RuntimeException('not_found');
}catch(Throwable $error){
    $known=['unauthorized'=>401,'forbidden'=>403,'invalid_request'=>400,'invalid_signature'=>403,'invalid_reward'=>403,'daily_limit'=>409,'pending_limit'=>409,'registration_limit'=>429,'full_view_used'=>409,'full_view_required'=>409,'no_tips'=>409,'daily_single_limit'=>409,'daily_single_required'=>409,'insufficient_credits'=>409,'invalid_tip'=>404,'tip_expired'=>409,'not_found'=>404,'ads_not_configured'=>503,'key_service_unavailable'=>503];
    $known+=['invalid_purchase'=>403,'purchases_not_configured'=>503,'purchase_verification_unavailable'=>503];
    $message=$error->getMessage();$status=$known[$message]??503;
    if(!isset($known[$message]))$message='service_unavailable';
    http_response_code($status);echo json_encode(['success'=>false,'error'=>$message]);
}
