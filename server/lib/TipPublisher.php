<?php
declare(strict_types=1);
final class TipPublisher {
    public const CATEGORIES=['daily-sure','football','over-under','single','daily-odds','bonus','basketball','tennis','special','fixed','correct-score','ht-ft','multi-50','multi-10','single-vip','mixed'];
    public static function row(array $input):array {
        $strings=[];foreach(['homeTeam','awayTeam','competitionName','prediction','type'] as $key){$v=trim((string)($input[$key]??''));if($v===''||strlen($v)>300)throw new RuntimeException('Takım, lig ve tahmin alanlarını doldurun.');$strings[$key]=$v;}
        $raw=(string)($input['matchDate']??'');if(!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(Z|[+-]\d{2}:\d{2})$/D',$raw)||($time=strtotime($raw))===false||$time<=time())throw new RuntimeException('Saat dilimi içeren gelecekteki bir maç tarihi girin.');
        $category=(string)($input['category']??'');if(!in_array($category,self::CATEGORIES,true))throw new RuntimeException('Geçerli bir kategori seçin.');
        $percentage=$input['percentage']??null;if($percentage!==null&&$percentage!==''&&(!is_numeric($percentage)||(float)$percentage<0||(float)$percentage>100))throw new RuntimeException('Yüzde 0–100 arasında olmalı.');
        return ['matchId'=>'editor-'.hash('sha256',$strings['homeTeam'].'|'.$strings['awayTeam'].'|'.$raw),'homeTeam'=>$strings['homeTeam'],'awayTeam'=>$strings['awayTeam'],'competitionName'=>$strings['competitionName'],'matchDate'=>gmdate('c',$time),'predictions'=>['editor-'.$category=>['type'=>$strings['type'],'prediction'=>$strings['prediction'],'percentage'=>$percentage===''||$percentage===null?null:(float)$percentage,'cardType'=>[$category]]]];
    }
    public static function save(string $directory,array $input):void {
        $row=self::row($input);$sport=$input['category']==='basketball'?'basketball':($input['category']==='tennis'?'tennis':'bettingtips');
        if(!is_dir($directory))throw new RuntimeException('İçerik dizini bulunamadı.');$path=$directory.'/'.$sport.'_managed.json';
        $lock=fopen($directory.'/.publisher.lock','c');if(!$lock||!flock($lock,LOCK_EX))throw new RuntimeException('İçerik kilitlenemedi.');
        $tmp=null;
        try{
            $rows=is_file($path)?json_decode(file_get_contents($path),true):[];if(!is_array($rows))throw new RuntimeException('Mevcut içerik okunamadı.');
            $merged=false;foreach($rows as &$old){if($old['matchId']===$row['matchId']){$old['predictions']=array_replace($old['predictions'],$row['predictions']);$merged=true;break;}}unset($old);if(!$merged)$rows[]=$row;
            $tmp=tempnam($directory,'.tips-');if($tmp===false||file_put_contents($tmp,json_encode($rows,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR))===false||!rename($tmp,$path))throw new RuntimeException('Kaydedilemedi.');$tmp=null;
        }finally{if($tmp&&is_file($tmp))unlink($tmp);flock($lock,LOCK_UN);fclose($lock);}
    }
}
