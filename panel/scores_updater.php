<?php

require_once __DIR__ . '/vendor/autoload.php';

class ScoresUpdater
{
    public function __construct()
    {
    }
    
    public function run(): bool
    {
        try {
            $liveScoresResult = $this->runScript('scrapers/live_scores_updater.php');
            if (!$liveScoresResult) {
                return false;
            }
            
            $yesterdayScoresResult = $this->runScript('scrapers/update_yesterday_scores.php');
            if (!$yesterdayScoresResult) {
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

$updater = new ScoresUpdater();
$result = $updater->run();

if ($result) {
    exit(0);
} else {
    exit(1);
}
