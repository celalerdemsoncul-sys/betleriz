<?php
declare(strict_types=1);
/** Google-only consumable credits. Never accept a client-supplied credit amount. */
final class PlayCredits {
    public const PRODUCTS=['betleriz_credits_10'=>10,'betleriz_credits_50'=>50,'betleriz_credits_100'=>100];
    public static function enabled():bool{return getenv('BETLERIZ_PLAY_CREDITS')==='on'&&is_file(getenv('BETLERIZ_PLAY_SERVICE_ACCOUNT')?:'');}
    private static function request(string $url,array $headers,?string $post=null):array {
        $ch=curl_init($url);curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>15,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_HTTPHEADER=>$headers,CURLOPT_FOLLOWLOCATION=>false]);
        if($post!==null)curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$post]);
        $raw=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
        if(!is_string($raw)||$code<200||$code>=300)throw new RuntimeException('purchase_verification_unavailable');
        $data=json_decode($raw,true);if(!is_array($data))throw new RuntimeException('purchase_verification_unavailable');return $data;
    }
    private static function accessToken():string {
        $key=json_decode(file_get_contents(getenv('BETLERIZ_PLAY_SERVICE_ACCOUNT')),true);
        if(!is_array($key)||empty($key['client_email'])||empty($key['private_key']))throw new RuntimeException('purchases_not_configured');
        $encode=static fn($v)=>rtrim(strtr(base64_encode($v),'+/','-_'),'=');$now=time();
        $jwt=$encode(json_encode(['alg'=>'RS256','typ'=>'JWT'])).'.'.$encode(json_encode(['iss'=>$key['client_email'],'scope'=>'https://www.googleapis.com/auth/androidpublisher','aud'=>'https://oauth2.googleapis.com/token','iat'=>$now,'exp'=>$now+3600]));
        if(!openssl_sign($jwt,$signature,$key['private_key'],OPENSSL_ALGO_SHA256))throw new RuntimeException('purchases_not_configured');
        $auth=self::request('https://oauth2.googleapis.com/token',['Content-Type: application/x-www-form-urlencoded'],http_build_query(['grant_type'=>'urn:ietf:params:oauth:grant-type:jwt-bearer','assertion'=>$jwt.'.'.$encode($signature)]));
        if(empty($auth['access_token']))throw new RuntimeException('purchase_verification_unavailable');return $auth['access_token'];
    }
    public static function validate(array $receipt,string $wallet,string $product):int {
        if(!isset(self::PRODUCTS[$product])||($receipt['purchaseState']??null)!==0||($receipt['obfuscatedExternalAccountId']??'')!==$wallet||(($receipt['productId']??$product)!==$product)||($receipt['quantity']??1)!==1||($receipt['refundableQuantity']??1)!==1)throw new RuntimeException('invalid_purchase');
        // Test purchases cannot fund a production wallet unless explicitly enabled.
        if(isset($receipt['purchaseType'])&&($receipt['purchaseType']!==0||getenv('BETLERIZ_PLAY_ALLOW_TEST')!=='on'))throw new RuntimeException('invalid_purchase');
        return self::PRODUCTS[$product];
    }
    public static function verify(string $wallet,string $product,string $token):int {
        if(!self::enabled())throw new RuntimeException('purchases_not_configured');
        if(!isset(self::PRODUCTS[$product])||$token===''||strlen($token)>2048)throw new RuntimeException('invalid_purchase');
        $url='https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.betleriz.app/purchases/products/'.rawurlencode($product).'/tokens/'.rawurlencode($token);
        return self::validate(self::request($url,['Authorization: Bearer '.self::accessToken(),'Accept: application/json']),$wallet,$product);
    }
}
