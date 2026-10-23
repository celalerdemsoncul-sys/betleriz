<?php

require_once __DIR__ . '/vendor/autoload.php';

class CronRunner
{
    public function __construct()
    {
    }
    
    public function run(): bool
    {
        try {
            $categoryAdders = [
                'category_adder_today.php',
                'category_adder_yesterday.php', 
                'category_adder_tomorrow.php',
                'category_adder_after_tomorrow.php'
            ];
            
            $allCategorySuccess = true;
            
            foreach ($categoryAdders as $adder) {
                $result = $this->runScript("scrapers/category_adders/$adder");
                if (!$result) {
                    $allCategorySuccess = false;
                }
                sleep(1);
            }
            
            return $allCategorySuccess;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function runScript(string $scriptPath): bool
    {
        $fullPath = __DIR__ . '/' . $scriptPath;
        
        if (!file_exists($fullPath)) {
            return false;
        }
        
        $output = [];
        $returnCode = 0;
        
        exec("php \"$fullPath\" 2>&1", $output, $returnCode);
        
        return $returnCode === 0;
    }
    
}

$cron = new CronRunner();
$result = $cron->run();

if ($result) {
    exit(0);
} else {
    exit(1);
}
