<?php
declare(strict_types=1);
/** Server-owned wallet. Never trust an amount, day, or balance supplied by an app. */
final class CreditStore {
    public const DAILY_LIMIT=60;
    public const FULL_VIEW_THRESHOLD=60;
    public const SINGLE_THRESHOLD=10;
    public const UNLOCK_COST=10;
    private PDO $db;
    private DateTimeZone $zone;
    public function __construct(string $path,string $timeZone='Asia/Famagusta') {
        $this->zone=new DateTimeZone($timeZone);
        if(!is_dir(dirname($path)) && !mkdir(dirname($path),0700,true) && !is_dir(dirname($path))) throw new RuntimeException('storage_unavailable');
        $this->db=new PDO('sqlite:'.$path,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
        $this->db->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON');
        $this->db->exec('CREATE TABLE IF NOT EXISTS wallets(id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, balance INTEGER NOT NULL DEFAULT 0 CHECK(balance>=0));
CREATE TABLE IF NOT EXISTS sessions(nonce TEXT PRIMARY KEY,wallet TEXT NOT NULL REFERENCES wallets(id),created INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS rewards(tx TEXT PRIMARY KEY,wallet TEXT NOT NULL REFERENCES wallets(id),day TEXT NOT NULL,nonce TEXT UNIQUE NOT NULL REFERENCES sessions(nonce));
CREATE TABLE IF NOT EXISTS unlocks(wallet TEXT NOT NULL REFERENCES wallets(id),tip TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(wallet,tip));
CREATE TABLE IF NOT EXISTS registrations(ip_hash TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS full_views(wallet TEXT NOT NULL REFERENCES wallets(id),day TEXT NOT NULL,request_key TEXT NOT NULL,created INTEGER NOT NULL,closed INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(wallet,day));
CREATE INDEX IF NOT EXISTS daily_rewards ON rewards(wallet,day);
CREATE INDEX IF NOT EXISTS active_sessions ON sessions(wallet,created);');
        $this->migratePurchases();
    }
    private function migratePurchases():void {
        $walletColumns=$this->db->query('PRAGMA table_info(wallets)')->fetchAll(PDO::FETCH_COLUMN,1);
        if(!in_array('paid_balance',$walletColumns,true))$this->db->exec('ALTER TABLE wallets ADD COLUMN paid_balance INTEGER NOT NULL DEFAULT 0');
        $unlockColumns=$this->db->query('PRAGMA table_info(unlocks)')->fetchAll(PDO::FETCH_COLUMN,1);
        if(!in_array('source',$unlockColumns,true))$this->db->exec("ALTER TABLE unlocks ADD COLUMN source TEXT NOT NULL DEFAULT 'reward'");
        $this->db->exec('CREATE TABLE IF NOT EXISTS purchases(token_hash TEXT PRIMARY KEY, wallet TEXT NOT NULL REFERENCES wallets(id), product TEXT NOT NULL, credits INTEGER NOT NULL, created INTEGER NOT NULL)');
    }
    public function grantPurchase(string $id,string $token,string $product,int $credits,int $now):array {
        if($token===''||$credits<=0||$credits>10000)throw new RuntimeException('invalid_purchase');
        return $this->atomic(function()use($id,$token,$product,$credits,$now){
            $hash=hash('sha256',$token);$old=$this->query('SELECT * FROM purchases WHERE token_hash=?',[$hash])->fetch(PDO::FETCH_ASSOC);
            if($old){if($old['wallet']!==$id||$old['product']!==$product)throw new RuntimeException('invalid_purchase');return $this->wallet($id,$now);}
            $this->query('INSERT INTO purchases VALUES(?,?,?,?,?)',[$hash,$id,$product,$credits,$now]);
            $this->query('UPDATE wallets SET balance=balance+?,paid_balance=paid_balance+? WHERE id=?',[$credits,$credits,$id]);
            return $this->wallet($id,$now);
        });
    }
    private function day(int $timestamp):string{return (new DateTimeImmutable('@'.$timestamp))->setTimezone($this->zone)->format('Y-m-d');}
    private function dayStart(int $timestamp):int{return (new DateTimeImmutable('@'.$timestamp))->setTimezone($this->zone)->setTime(0,0)->getTimestamp();}
    private function midnight(int $timestamp):int{return (new DateTimeImmutable('@'.$timestamp))->setTimezone($this->zone)->modify('tomorrow')->setTime(0,0)->getTimestamp();}
    private function query(string $sql,array $params=[]):PDOStatement {$s=$this->db->prepare($sql);$s->execute($params);return $s;}
    private function atomic(callable $work) {
        $this->db->exec('BEGIN IMMEDIATE');
        try{$result=$work();$this->db->exec('COMMIT');return $result;}catch(Throwable $e){$this->db->exec('ROLLBACK');throw $e;}
    }
    public function register(string $ip,int $now):array {
        return $this->atomic(function() use($ip,$now){
            $this->query('DELETE FROM registrations WHERE created < ?',[$now-86400]);
            $hash=hash('sha256',$ip);
            if((int)$this->query('SELECT COUNT(*) FROM registrations WHERE ip_hash=? AND created>?',[$hash,$now-86400])->fetchColumn()>=20)throw new RuntimeException('registration_limit');
            $id=bin2hex(random_bytes(16));$token=bin2hex(random_bytes(32));
            $this->query('INSERT INTO wallets(id,token_hash) VALUES(?,?)',[$id,hash('sha256',$token)]);
            $this->query('INSERT INTO registrations VALUES(?,?)',[$hash,$now]);
            return ['id'=>$id,'token'=>$token];
        });
    }
    public function authenticate(string $token):string {
        if(!preg_match('/^[a-f0-9]{64}$/D',$token))throw new RuntimeException('unauthorized');
        $id=$this->query('SELECT id FROM wallets WHERE token_hash=?',[hash('sha256',$token)])->fetchColumn();
        if(!$id)throw new RuntimeException('unauthorized');return (string)$id;
    }
    public function wallet(string $id,int $now):array {
        $balance=$this->query('SELECT balance FROM wallets WHERE id=?',[$id])->fetchColumn();
        if($balance===false)throw new RuntimeException('unauthorized');
        $paid=(int)$this->query('SELECT paid_balance FROM wallets WHERE id=?',[$id])->fetchColumn();
        $day=$this->day($now);
        $views=(int)$this->query('SELECT COUNT(*) FROM rewards WHERE wallet=? AND day=?',[$id,$day])->fetchColumn();
        $singleUnlocks=(int)$this->query("SELECT COUNT(*) FROM unlocks WHERE source='reward' AND wallet=? AND created>=? AND created<?",[$id,$this->dayStart($now),$this->midnight($now)])->fetchColumn();
        $used=(bool)$this->query('SELECT 1 FROM full_views WHERE wallet=? AND day=?',[$id,$day])->fetchColumn();
        return ['accountId'=>$id,'paidBalance'=>$paid,'canUnlockTip'=>$paid>=self::UNLOCK_COST||((int)$balance-$paid>=self::UNLOCK_COST&&$singleUnlocks===0),'singleUnlocksToday'=>$singleUnlocks,'singleUnlockAvailable'=>(int)$balance-$paid>=self::UNLOCK_COST&&$singleUnlocks===0,'balance'=>(int)$balance,'videosToday'=>$views,'dailyLimit'=>self::DAILY_LIMIT,'unlockCost'=>self::UNLOCK_COST,'day'=>$day,'timeZone'=>$this->zone->getName(),'serverTime'=>gmdate('c',$now),'resetAt'=>gmdate('c',$this->midnight($now)),'fullViewAvailable'=>$views>=self::FULL_VIEW_THRESHOLD&&!$used,'fullViewUsed'=>$used,'fullViewExpiresAt'=>$views>=self::FULL_VIEW_THRESHOLD?gmdate('c',$this->midnight($now)):null,'fullViewThreshold'=>self::FULL_VIEW_THRESHOLD];
    }
    public function beginAd(string $id,int $now):array {
        return $this->atomic(function()use($id,$now){
            $wallet=$this->wallet($id,$now);if($wallet['videosToday']>=self::DAILY_LIMIT)throw new RuntimeException('daily_limit');
            // Reserve a slot for pending SSV callbacks and block accidental double taps.
            $active=(int)$this->query('SELECT COUNT(*) FROM sessions WHERE wallet=? AND used=0 AND created>?',[$id,$now-1800])->fetchColumn();
            if($active+$wallet['videosToday']>=self::DAILY_LIMIT)throw new RuntimeException('pending_limit');
            $nonce=bin2hex(random_bytes(24));$this->query('INSERT INTO sessions(nonce,wallet,created) VALUES(?,?,?)',[$nonce,$id,$now]);
            return ['nonce'=>$nonce,'userId'=>$id,'createdAt'=>$now];
        });
    }
    public function cancelAd(string $id,string $nonce):void {
        $this->query('UPDATE sessions SET used=1 WHERE nonce=? AND wallet=? AND used=0',[$nonce,$id]);
    }
    public function grant(string $nonce,string $userId,string $tx,int $eventTime,int $now):array {
        if($tx===''||strlen($tx)>256)throw new RuntimeException('invalid_reward');
        return $this->atomic(function()use($nonce,$userId,$tx,$eventTime,$now){
            // A retried callback must neither mint credits twice nor move a credit to another wallet.
            $existing=$this->query('SELECT wallet,nonce FROM rewards WHERE tx=?',[$tx])->fetch(PDO::FETCH_ASSOC);
            if($existing){if($existing['wallet']!==$userId||$existing['nonce']!==$nonce)throw new RuntimeException('invalid_reward');return $this->wallet($userId,$now);}
            $session=$this->query('SELECT * FROM sessions WHERE nonce=?',[$nonce])->fetch(PDO::FETCH_ASSOC);
            if(!$session||$session['wallet']!==$userId||$session['used']!=0||$eventTime<(int)$session['created']-5||$eventTime>(int)$session['created']+1800||$eventTime>$now+60||$now-$eventTime>86400)throw new RuntimeException('invalid_reward');
            $day=$this->day($eventTime);
            $count=(int)$this->query('SELECT COUNT(*) FROM rewards WHERE wallet=? AND day=?',[$userId,$day])->fetchColumn();
            if($count>=self::DAILY_LIMIT)throw new RuntimeException('daily_limit');
            $this->query('INSERT INTO rewards(tx,wallet,day,nonce) VALUES(?,?,?,?)',[$tx,$userId,$day,$nonce]);
            // Only the first ten videos earn credits. Videos 11–60 advance VIP only.
            if($count<self::SINGLE_THRESHOLD)$this->query('UPDATE wallets SET balance=balance+1 WHERE id=?',[$userId]);
            $this->query('UPDATE sessions SET used=1 WHERE nonce=?',[$nonce]);
            return $this->wallet($userId,$now);
        });
    }
    public function openFullView(string $id,string $key,int $now):array {
        if(!preg_match('/^[a-zA-Z0-9_-]{24,128}$/D',$key))throw new RuntimeException('invalid_request');
        return $this->atomic(function()use($id,$key,$now){
            $day=$this->day($now);$view=$this->query('SELECT * FROM full_views WHERE wallet=? AND day=?',[$id,$day])->fetch(PDO::FETCH_ASSOC);
            if($view){
                // Same-page network retries only, until the client acknowledges delivery.
                if($view['request_key']!==$key||(int)$view['closed']!==0||$now-(int)$view['created']>120)throw new RuntimeException('full_view_used');
                return $this->wallet($id,$now);
            }
            if(!$this->wallet($id,$now)['fullViewAvailable'])throw new RuntimeException('full_view_required');
            $this->query('INSERT INTO full_views(wallet,day,request_key,created) VALUES(?,?,?,?)',[$id,$day,$key,$now]);
            return $this->wallet($id,$now);
        });
    }
    public function acknowledgeFullView(string $id,string $key,int $now):void {
        $this->query('UPDATE full_views SET closed=1 WHERE wallet=? AND day=? AND request_key=?',[$id,$this->day($now),$key]);
    }
    public function isUnlocked(string $id,string $tip):bool{return (bool)$this->query('SELECT 1 FROM unlocks WHERE wallet=? AND tip=?',[$id,$tip])->fetchColumn();}
    public function unlock(string $id,string $tip,int $now):array {
        if($tip===''||strlen($tip)>512)throw new RuntimeException('invalid_tip');
        return $this->atomic(function()use($id,$tip,$now){
            if($this->isUnlocked($id,$tip))return $this->wallet($id,$now);
            $state=$this->wallet($id,$now);
            $paid=$state['paidBalance']>=self::UNLOCK_COST;
            if(!$paid&&$state['singleUnlocksToday']>=1)throw new RuntimeException('daily_single_limit');
            if(!$paid&&!$state['singleUnlockAvailable'])throw new RuntimeException('daily_single_required');
            $changed=$this->query('UPDATE wallets SET balance=balance-? WHERE id=? AND balance>=?',[self::UNLOCK_COST,$id,self::UNLOCK_COST]);
            if($changed->rowCount()!==1)throw new RuntimeException('insufficient_credits');
            $this->query('INSERT INTO unlocks(wallet,tip,created,source) VALUES(?,?,?,?)',[$id,$tip,$now,$paid?'paid':'reward']);
            if($paid)$this->query('UPDATE wallets SET paid_balance=paid_balance-? WHERE id=?',[self::UNLOCK_COST,$id]);
            return $this->wallet($id,$now);
        });
    }
}
