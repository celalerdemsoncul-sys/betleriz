<?php

require_once __DIR__ . '/vendor/autoload.php';

class DailyCronRunner
{
    public function run(): bool
    {
        try {
            $scraperResult = $this->runScript("scrapers/daily_match_scraper.php");
            if (!$scraperResult) {
                return false;
            }
            
            sleep(5);
            
            $cronResult = $this->runScript("cron_runner.php");
            if (!$cronResult) {
                return false;
            }
            
            return true;
            
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

$runner = new DailyCronRunner();
$result = $runner->run();

if ($result) {
    exit(0);
} else {
    exit(1);
}

?>
