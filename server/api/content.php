<?php
declare(strict_types=1);
require_once __DIR__.'/../lib/AppContent.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');header('Access-Control-Allow-Methods: GET, OPTIONS');header('X-Content-Type-Options: nosniff');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);return;}
if($_SERVER['REQUEST_METHOD']!=='GET'){http_response_code(405);echo '{"success":false,"error":"method_not_allowed"}';return;}
try{
 $data=(new AppContent())->read();$lang=AppContent::language((string)($_GET['lang']??$data['defaultLanguage']),$data);$pages=AppContent::pages($data,$lang);
 if($path==='/api/app-config.php')$result=['revision'=>$data['revision'],'updatedAt'=>$data['updatedAt'],'language'=>$lang,'stores'=>$data['stores'],'supportEmail'=>$data['supportEmail'],'pages'=>array_map(static function($p){unset($p['content']);return $p;},$pages)];
 elseif($path==='/api/pages.php'){
  $id=(string)($_GET['page_id']??$_GET['id']??'');$result=$pages;
  if($id!==''){$result=null;foreach($pages as $p)if($p['id']===$id)$result=$p;if($result===null){http_response_code(404);echo '{"success":false,"error":"page_not_found"}';return;}}
 }else $result=['email'=>$data['supportEmail'],'stores'=>$data['stores']];
 echo json_encode(['success'=>true,'data'=>$result],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
}catch(Throwable $e){error_log('Content API: '.$e->getMessage());http_response_code(503);echo '{"success":false,"error":"content_unavailable"}';}
