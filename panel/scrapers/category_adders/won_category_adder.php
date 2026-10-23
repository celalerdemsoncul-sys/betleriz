<?php

require_once __DIR__ . '/../../vendor/autoload.php';

class WonCategoryAdder
{
    private $yesterdayPath;
    
    public function __construct()
    {
        $this->yesterdayPath = __DIR__ . '/../../tips/bettingtips_yesterday.json';
    }
    
    public function processWonCategories(): bool
    {
        try {
            $yesterdayMatches = $this->loadYesterdayMatches();
            
            if (empty($yesterdayMatches)) {
                return false;
            }
            
            $updated = $this->updateLostToWon($yesterdayMatches);
            
            if ($updated) {
                $result = $this->saveYesterdayMatches($yesterdayMatches);
                return $result;
            }
            
            return true;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function loadYesterdayMatches(): array
    {
        if (!file_exists($this->yesterdayPath)) {
            return [];
        }
        
        $json = file_get_contents($this->yesterdayPath);
        $matches = json_decode($json, true);
        
        return $matches ?: [];
    }
    
    private function updateLostToWon(array &$matches): bool
    {
        $updated = false;
        $lostCardTypes = [];
        $wonMatches = [];
        
        foreach ($matches as $matchIndex => $match) {
            if (!isset($match['predictions'])) {
                continue;
            }
            
            foreach ($match['predictions'] as $predictionType => $prediction) {
                if (isset($prediction['result']) && $prediction['result'] === 'LOST' && isset($prediction['cardType'])) {
                    $cardTypes = is_array($prediction['cardType']) ? $prediction['cardType'] : [$prediction['cardType']];
                    $lostCardTypes[$predictionType] = array_merge($lostCardTypes[$predictionType] ?? [], $cardTypes);
                    
                    unset($matches[$matchIndex]['predictions'][$predictionType]['cardType']);
                    $updated = true;
                }
            }
        }
        
        foreach ($matches as $matchIndex => $match) {
            if (!isset($match['predictions'])) {
                continue;
            }
            
            foreach ($match['predictions'] as $predictionType => $prediction) {
                if (isset($prediction['result']) && $prediction['result'] === 'WON') {
                    $wonMatches[$predictionType][] = $matchIndex;
                }
            }
        }
        
        foreach ($lostCardTypes as $predictionType => $cardTypes) {
            if (isset($wonMatches[$predictionType]) && !empty($wonMatches[$predictionType])) {
                $wonMatchIndexes = $wonMatches[$predictionType];
                $selectedIndex = $wonMatchIndexes[array_rand($wonMatchIndexes)];
                
                foreach ($cardTypes as $cardType) {
                    $this->addCardTypeToPrediction($matches[$selectedIndex]['predictions'][$predictionType], $cardType);
                }
            }
        }
        
        return $updated;
    }
    
    private function addCardTypeToPrediction(array &$prediction, string $cardType): void
    {
        if (isset($prediction['cardType'])) {
            $existing = $prediction['cardType'];
            $prediction['cardType'] = is_array($existing) ? [...$existing, $cardType] : [$existing, $cardType];
        } else {
            $prediction['cardType'] = [$cardType];
        }
    }
    
    private function saveYesterdayMatches(array $matches): bool
    {
        $json = json_encode($matches, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $result = file_put_contents($this->yesterdayPath, $json);
        
        return $result !== false;
    }
}

$adder = new WonCategoryAdder();
$result = $adder->processWonCategories();

if ($result) {
    exit(0);
} else {
    exit(1);
}