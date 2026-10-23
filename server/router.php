<?php
declare(strict_types=1);
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if ($path==='/admin') { require __DIR__.'/public/admin.php'; return true; }
if ($path==='/admin/tips/source') { require __DIR__.'/public/admin-source.php'; return true; }
if ($path==='/admin/tips') { require __DIR__.'/public/admin-tips.php'; return true; }
if (in_array($path,['/api/app-config.php','/api/pages.php','/api/support.php'],true)) {require __DIR__.'/api/content.php';return true;}
$aliases=['/privacy-policy.html'=>'privacy-policy','/privacy-policy'=>'privacy-policy','/terms-of-service'=>'terms-of-service','/cookie-policy'=>'cookie-policy'];
if(isset($aliases[$path]))$path='/pages/'.$aliases[$path];
if(strncmp($path,'/pages/',7)===0){require __DIR__.'/public/page.php';return true;}
// Root the web server at server/public, not at the project or legacy panel.
$public=['/api/fixtures.php','/api/version.php'];
if(in_array($path,$public,true)){require dirname(__DIR__).'/panel'.$path;return true;}
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
if(strncmp($path,'/v1/',4)!==0){http_response_code(404);echo json_encode(['success'=>false,'error'=>'not_found']);return true;}
require __DIR__.'/api/credits.php';return true;
