<?php
declare(strict_types=1);
final class TipCatalog {
    private string $root;
    public function __construct(string $root){$this->root=$root;}
    public function all():array {
        $tips=[];
        foreach(glob($this->root.'/*.json') as $file){
            $rows=json_decode(file_get_contents($file),true);if(!is_array($rows))continue;
            foreach($rows as $row){
                if(!is_array($row)||!isset($row['homeTeam'],$row['awayTeam'],$row['predictions']))continue;
                foreach($row['predictions'] as $kind=>$prediction){
                    if(!is_array($prediction)||!isset($prediction['prediction']))continue;
                    $types=$prediction['cardType']??$row['cardType']??[];if(is_string($types))$types=[$types];if(!is_array($types))continue;
                    foreach($types as $category){
                        // IDs include content version: users never pay for a silently replaced tip.
                        $id=hash('sha256',json_encode([$row['homeTeam'],$row['awayTeam'],$row['matchDate']??null,$row['competitionName']??'',$kind,$prediction,$category],JSON_UNESCAPED_UNICODE));
                        $rawDate=$row['matchDate']??'';$time=is_string($rawDate)&&preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/D',$rawDate)?strtotime($rawDate):false;
                        $status=strtoupper((string)($row['liveScore']['status']??''));
                        $available=$time!==false&&$time>time()&&!in_array($status,['FT','LIVE','HT','CANC','PST','POSTPONED','CANCELLED','ABD'],true);
                        $tips[$id]=['id'=>$id,'category'=>(string)$category,'homeTeam'=>$row['homeTeam'],'awayTeam'=>$row['awayTeam'],'competitionName'=>$row['competitionName']??'','matchDate'=>$row['matchDate']??null,'canUnlock'=>$available,'historical'=>$time!==false&&$time<time(),'score'=>isset($row['liveScore']['homeScore'],$row['liveScore']['awayScore'])?$row['liveScore']['homeScore'].' – '.$row['liveScore']['awayScore']:null,'prediction'=>['type'=>$prediction['type']??(string)$kind,'prediction'=>(string)$prediction['prediction'],'percentage'=>$prediction['percentage']??null,'result'=>$prediction['result']??null]];
                    }
                }
            }
        }
        return $tips;
    }
    public function find(string $id):?array{return $this->all()[$id]??null;}
    public function listing(string $category,string $date,CreditStore $store,string $wallet,int $offset=0):array {
        if(!in_array($date,['yesterday','today','tomorrow','after-tomorrow','archive'],true))throw new RuntimeException('invalid_request');
        $result=[];$shift=max(-840,min(840,$offset))*60;$days=['yesterday'=>-1,'today'=>0,'tomorrow'=>1,'after-tomorrow'=>2,'archive'=>0];$day=gmdate('Y-m-d',time()+$shift+$days[$date]*86400);
        foreach($this->all() as $tip){
            if($category!=='all'&&$tip['category']!==$category)continue;
            $time=strtotime($tip['matchDate']??'');
            if($time===false||($date==='archive'?!$tip['historical']:gmdate('Y-m-d',$time+$shift)!==$day))continue;
            $permanent=$store->isUnlocked($wallet,$tip['id']);$unlocked=$permanent;
            // Expired content is clearly marked as an archive, never sold as a current tip.
            if(!$unlocked&&!$tip['historical'])unset($tip['prediction']);
            $tip['unlocked']=$unlocked||$tip['historical'];$tip['access']=$permanent?'permanent':($tip['historical']?'archive':'locked');$result[]=$tip;
        }
        usort($result,static fn($a,$b)=>$date==='archive'?strcmp($b['matchDate'],$a['matchDate']):strcmp($a['matchDate'],$b['matchDate']));
        return $result;
    }
}
