<?php

require_once __DIR__ . '/vendor/autoload.php';

class CategoryProcessor
{
    public function run(): bool
    {
        try {
            $lostResult = $this->runScript("scrapers/category_adders/lost_category_adder.php");
            if (!$lostResult) {
                return false;
            }
            
            sleep(3);
            
            $wonResult = $this->runScript("scrapers/category_adders/won_category_adder.php");
            if (!$wonResult) {
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

$processor = new CategoryProcessor();
$result = $processor->run();

if ($result) {
    exit(0);
} else {
    exit(1);
}

?>
