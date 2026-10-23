<?php
declare(strict_types=1);
final class AppContent {
    public const LANGUAGES=['tr','en','az','ur','hi','th','id','ar','ku'];
    private string $file;
    public function __construct(?string $file=null){$this->file=$file??(getenv('BETLERIZ_CONTENT_FILE')?:dirname(__DIR__).'/content/app.json');}
    public function read():array {
        $data=json_decode((string)file_get_contents($this->file),true,512,JSON_THROW_ON_ERROR);
        self::validate($data);return $data;
    }
    public static function validate(array $d):void {
        if(!isset($d['revision'])||!is_int($d['revision'])||$d['revision']<1||!in_array($d['defaultLanguage']??'',self::LANGUAGES,true))throw new RuntimeException('invalid_content');
        foreach(['android'=>'play.google.com','ios'=>'apps.apple.com'] as $platform=>$host){
            $store=$d['stores'][$platform]??[];$url=$store['url']??null;
            if(!in_array($store['status']??'',['soon','available'],true)||!is_string($url))throw new RuntimeException('invalid_store');
            if($url!==''&&(parse_url($url,PHP_URL_SCHEME)!=='https'||parse_url($url,PHP_URL_HOST)!==$host||parse_url($url,PHP_URL_USER)!==null||parse_url($url,PHP_URL_PASS)!==null))throw new RuntimeException('invalid_store_url');
            if(($store['status']??'')==='available'&&$url==='')throw new RuntimeException('store_url_required');
        }
        if(!isset($d['supportEmail'])||!is_string($d['supportEmail'])||($d['supportEmail']!==''&&!filter_var($d['supportEmail'],FILTER_VALIDATE_EMAIL)))throw new RuntimeException('invalid_email');
        if(!isset($d['pages'])||!is_array($d['pages']))throw new RuntimeException('invalid_pages');
        $seen=[];
        foreach($d['pages'] as $page){
            $id=$page['id']??'';
            if(!is_string($id)||!preg_match('/^[a-z][a-z0-9-]{0,59}$/D',$id)||isset($seen[$id])||!is_bool($page['active']??null)||!in_array($page['status']??'',['draft','published'],true))throw new RuntimeException('invalid_page');
            $seen[$id]=true;
            foreach(self::LANGUAGES as $lang){
                $text=$page['translations'][$lang]??null;
                if(!is_array($text)||!is_string($text['title']??null)||!is_string($text['content']??null)||strlen($text['title'])>300||strlen($text['content'])>60000)throw new RuntimeException('invalid_translation');
                if($page['status']==='published'&&(trim($text['title'])===''||trim($text['content'])===''))throw new RuntimeException('published_translation_required');
            }
        }
        if(count($d['pages'])>20)throw new RuntimeException('too_many_pages');
    }
    public function save(array $data,int $expected):array {
        self::validate($data);$lock=fopen($this->file.'.lock','c');if(!$lock||!flock($lock,LOCK_EX))throw new RuntimeException('save_failed');
        try{
            if($this->read()['revision']!==$expected)throw new RuntimeException('revision_conflict');
            $data['revision']=$expected+1;$data['updatedAt']=gmdate('c');
            $tmp=tempnam(dirname($this->file),'.content-');if($tmp===false)throw new RuntimeException('save_failed');
            try{if(file_put_contents($tmp,json_encode($data,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR))===false||!rename($tmp,$this->file))throw new RuntimeException('save_failed');}finally{if(file_exists($tmp))unlink($tmp);}
            return $data;
        }finally{flock($lock,LOCK_UN);fclose($lock);}
    }
    public static function language(string $value,array $data):string{return in_array($value,self::LANGUAGES,true)?$value:$data['defaultLanguage'];}
    public static function pages(array $data,string $lang):array {
        $result=[];
        foreach($data['pages'] as $page){if(!$page['active'])continue;$text=$page['translations'][$lang];$used=$lang;
            if(trim($text['content'])===''){$used=$data['defaultLanguage'];$text=$page['translations'][$used];}
            $result[]=['id'=>$page['id'],'title'=>$text['title'],'content'=>$text['content'],'language'=>$used,'requestedLanguage'=>$lang,'status'=>$page['status'],'url'=>'/pages/'.$page['id'].'?lang='.rawurlencode($lang),'lastUpdated'=>$data['updatedAt']];
        }
        return $result;
    }
}
