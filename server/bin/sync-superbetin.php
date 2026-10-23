<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/../lib/SuperbetinSource.php';
$day=$argv[1]??'today';
try {
 $s=SuperbetinSource::action('status',$day);
 if(($s['status']??'')==='running'&&($s['day']??'')!==$day)throw new RuntimeException('Başka günün aktarımı sürüyor.');
 if(($s['status']??'')!=='running')$s=SuperbetinSource::action('start',$day);
 echo json_encode($s,JSON_UNESCAPED_UNICODE).PHP_EOL;
 while(($s['status']??'')==='running'){
  $attempt=0;
  while(true){try{$s=SuperbetinSource::action('step',$day);break;}catch(RuntimeException $e){if(++$attempt>=3)throw $e;fwrite(STDERR,'Yeniden deneniyor: '.$e->getMessage().PHP_EOL);usleep(1000000);}}
  echo json_encode($s,JSON_UNESCAPED_UNICODE).PHP_EOL;usleep(500000);
 }
 if(($s['status']??'')!=='complete')exit(1);
}catch(Throwable $e){fwrite(STDERR,$e->getMessage().PHP_EOL);exit(1);}
