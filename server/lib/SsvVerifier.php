<?php
declare(strict_types=1);
final class SsvVerifier {
    /** Verify the exact signed bytes before decoding any application fields. */
    public static function verify(string $raw,array $keys):array {
        if(strlen($raw)>8192||!preg_match('/^(.+)&signature=([^&]+)&key_id=([0-9]+)$/D',$raw,$parts))throw new RuntimeException('invalid_signature');
        $signed=$parts[1];$signature=rawurldecode($parts[2]);$keyId=$parts[3];
        if(!preg_match('/^[A-Za-z0-9_\-=]+$/D',$signature)||!isset($keys[$keyId]))throw new RuntimeException('invalid_signature');
        $binary=base64_decode(strtr($signature,'-_','+/'),true);
        if($binary===false||openssl_verify($signed,$binary,$keys[$keyId],OPENSSL_ALGO_SHA256)!==1)throw new RuntimeException('invalid_signature');
        $params=[];
        foreach(explode('&',$signed) as $pair){
            $kv=explode('=',$pair,2);if(count($kv)!==2)throw new RuntimeException('invalid_signature');
            $key=rawurldecode($kv[0]);if(isset($params[$key]))throw new RuntimeException('invalid_signature');
            $params[$key]=rawurldecode($kv[1]);
        }
        foreach(['custom_data','user_id','transaction_id','timestamp','ad_unit','reward_amount','reward_item'] as $key)if(!isset($params[$key]))throw new RuntimeException('invalid_reward');
        return $params;
    }
    public static function googleKeys(string $cacheFile):array {
        $body=null;
        if(is_file($cacheFile)&&time()-filemtime($cacheFile)<3600)$body=file_get_contents($cacheFile);
        if($body===null){
            $context=stream_context_create(['http'=>['timeout'=>8,'follow_location'=>0],'ssl'=>['verify_peer'=>true,'verify_peer_name'=>true]]);
            $body=@file_get_contents('https://www.gstatic.com/admob/reward/verifier-keys.json',false,$context);
            if($body===false)throw new RuntimeException('key_service_unavailable');
            $decoded=json_decode($body,true);if(!isset($decoded['keys']))throw new RuntimeException('key_service_unavailable');
            file_put_contents($cacheFile,$body,LOCK_EX);@chmod($cacheFile,0600);
        }
        $decoded=json_decode($body,true);$keys=[];
        foreach($decoded['keys']??[] as $key){if(isset($key['keyId'],$key['pem']))$keys[(string)$key['keyId']]=$key['pem'];}
        if(!$keys)throw new RuntimeException('key_service_unavailable');return $keys;
    }
}
