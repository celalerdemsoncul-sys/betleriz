<?php
// Public fixture metadata only. Never expose subscription/payment credentials or premium predictions.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['success'=>false]); exit; }
$root=__DIR__.'/../tips'; $data=[]; $updated=0;
foreach (glob($root.'/*.json') as $path) {
    $sport=strpos(basename($path),'basketball')===0?'basketball':(strpos(basename($path),'tennis')===0?'tennis':'football');
    $rows=json_decode(file_get_contents($path),true);
    if (!is_array($rows)) continue;
    $updated=max($updated,filemtime($path));
    foreach($rows as $row){
        if(!is_array($row)||!isset($row['homeTeam'],$row['awayTeam']))continue;
        $public=array_intersect_key($row,array_flip(['matchId','homeTeam','awayTeam','homeTeamId','awayTeamId','competitionName','matchDate','matchTime','liveScore','status']));
        $public['sport']=$sport;$data[]=$public;
    }
}
echo json_encode(['success'=>true,'updatedAt'=>$updated?gmdate('c',$updated):null,'data'=>$data],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
