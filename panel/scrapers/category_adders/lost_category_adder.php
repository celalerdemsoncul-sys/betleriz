<?php

require_once __DIR__ . '/../../vendor/autoload.php';

class LostCategoryAdder
{
    private $filePath;
    
    public function __construct()
    {
        $this->filePath = __DIR__ . '/../../tips/bettingtips_today.json';
    }
    
    public function processLostCategories(): bool
    {
        try {
            $matches = $this->loadMatches();
            if (empty($matches)) {
                return false;
            }
            
            $currentTime = date('H:i');
            
            $updatedMatches = $this->processMatches($matches, $currentTime);
            $result = $this->saveMatches($updatedMatches);
            
            return $result;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function loadMatches(): array
    {
        if (!file_exists($this->filePath)) {
            return [];
        }
        
        $json = file_get_contents($this->filePath);
        $matches = json_decode($json, true);
        
        return $matches ?: [];
    }
    
    private function processMatches(array $matches, string $currentTime): array
    {
        $lostMatches = [];
        $futureMatches = [];
        $removedCardTypes = [];
        
        foreach ($matches as $index => $match) {
            $matchTime = $match['matchTime'] ?? '';
            
            if ($this->isTimeBefore($matchTime, $currentTime)) {
                if ($this->hasLostPredictions($match)) {
                    $lostMatches[] = $index;
                    $removedCardTypes = array_merge($removedCardTypes, $this->getLostCardTypes($match));
                }
            } elseif ($this->isTimeAfter($matchTime, $currentTime)) {
                $futureMatches[] = $index;
            }
        }
        
        if (empty($lostMatches) || empty($futureMatches) || empty($removedCardTypes)) {
            return $matches;
        }
        
        $matches = $this->removeCategoriesFromLost($matches, $lostMatches);
        $matches = $this->addSpecificCategoriesToFuture($matches, $futureMatches, $removedCardTypes);
        
        return $matches;
    }
    
    private function isTimeBefore(string $matchTime, string $currentTime): bool
    {
        if (empty($matchTime) || empty($currentTime)) {
            return false;
        }
        
        return strtotime($matchTime) < strtotime($currentTime);
    }
    
    private function isTimeAfter(string $matchTime, string $currentTime): bool
    {
        if (empty($matchTime) || empty($currentTime)) {
            return false;
        }
        
        $futureTime = date('H:i', strtotime($currentTime . ' +1 minute'));
        
        return strtotime($matchTime) >= strtotime($futureTime);
    }
    
    private function hasLostPredictions(array $match): bool
    {
        if (!isset($match['predictions'])) {
            return false;
        }
        
        foreach ($match['predictions'] as $prediction) {
            if (isset($prediction['result']) && $prediction['result'] === 'LOST') {
                return true;
            }
        }
        
        return false;
    }
    
    private function getLostCardTypes(array $match): array
    {
        $lostCardTypes = [];
        
        if (!isset($match['predictions'])) {
            return $lostCardTypes;
        }
        
        foreach ($match['predictions'] as $prediction) {
            if (isset($prediction['result']) && $prediction['result'] === 'LOST' && isset($prediction['cardType'])) {
                $cardTypes = is_array($prediction['cardType']) ? $prediction['cardType'] : [$prediction['cardType']];
                $lostCardTypes = array_merge($lostCardTypes, $cardTypes);
            }
        }
        
        return array_unique($lostCardTypes);
    }
    
    private function hasCategories(array $match): bool
    {
        if (!isset($match['predictions'])) {
            return false;
        }
        
        foreach ($match['predictions'] as $prediction) {
            if (isset($prediction['cardType']) && !empty($prediction['cardType'])) {
                return true;
            }
        }
        
        return false;
    }
    
    private function removeCategoriesFromLost(array $matches, array $lostMatchIndexes): array
    {
        foreach ($lostMatchIndexes as $index) {
            if (isset($matches[$index]['predictions'])) {
                foreach ($matches[$index]['predictions'] as $predictionType => &$prediction) {
                    if (isset($prediction['result']) && $prediction['result'] === 'LOST') {
                        unset($prediction['cardType']);
                    }
                }
            }
        }
        
        return $matches;
    }
    
    private function addSpecificCategoriesToFuture(array $matches, array $futureMatchIndexes, array $removedCardTypes): array
    {
        $categoryMapping = [
            'daily-sure' => ['winner', 'totalgoals', 'btts'],
            'football' => ['winner'],
            'over-under' => ['totalgoals'],
            'single' => ['winner'],
            'daily-odds' => ['winner', 'totalgoals', 'btts'],
            'bonus' => ['winner'],
            'special' => ['btts', 'winner', 'totalgoals'],
            'fixed' => ['btts', 'winner', 'totalgoals'],
            'correct-score' => ['correctscore'],
            'ht-ft' => ['htft'],
            'multi-50' => ['htft', 'totalgoals', 'winner', 'btts'],
            'mixed' => ['htft', 'winner', 'totalgoals', 'correctscore', 'btts'],
            'multi-10' => ['htft', 'totalgoals', 'winner', 'btts'],
            'single-vip' => ['winner']
        ];
        
        foreach ($removedCardTypes as $cardType) {
            if (isset($categoryMapping[$cardType])) {
                $predictionTypes = $categoryMapping[$cardType];
                $matches = $this->addCategoryToFutureMatches($matches, $futureMatchIndexes, $cardType, 1, $predictionTypes);
            }
        }
        
        return $matches;
    }
    
    private function addCategoryToFutureMatches(array $matches, array $futureMatchIndexes, string $category, int $count, array $predictionTypes): array
    {
        if (empty($futureMatchIndexes)) {
            return $matches;
        }
        
        $selectedCount = min($count, count($futureMatchIndexes));
        $selectedIndexes = array_rand($futureMatchIndexes, $selectedCount);
        if (!is_array($selectedIndexes)) {
            $selectedIndexes = [$selectedIndexes];
        }
        
        foreach ($selectedIndexes as $selectedIndex) {
            $matchIndex = $futureMatchIndexes[$selectedIndex];
            $randomType = $predictionTypes[array_rand($predictionTypes)];
            
            if (isset($matches[$matchIndex]['predictions'][$randomType])) {
                $this->addCardTypeToPrediction($matches[$matchIndex]['predictions'][$randomType], $category);
            }
        }
        
        return $matches;
    }
    
    private function addCategoryToFutureMatchesExcluding(array $matches, array $futureMatchIndexes, string $category, int $count, array $predictionTypes, string $excludeCategory): array
    {
        if (empty($futureMatchIndexes)) {
            return $matches;
        }
        
        $selectedCount = min($count, count($futureMatchIndexes));
        $selectedIndexes = array_rand($futureMatchIndexes, $selectedCount);
        if (!is_array($selectedIndexes)) {
            $selectedIndexes = [$selectedIndexes];
        }
        
        foreach ($selectedIndexes as $selectedIndex) {
            $matchIndex = $futureMatchIndexes[$selectedIndex];
            $randomType = $predictionTypes[array_rand($predictionTypes)];
            
            if (isset($matches[$matchIndex]['predictions'][$randomType])) {
                $prediction = &$matches[$matchIndex]['predictions'][$randomType];
                if (!$this->hasExcludeCardType($prediction, $excludeCategory)) {
                    $this->addCardTypeToPrediction($prediction, $category);
                }
            }
        }
        
        return $matches;
    }
    
    private function addCardTypeToPrediction(array &$prediction, string $cardType): void
    {
        if (isset($prediction['cardType'])) {
            $existing = $prediction['cardType'];
            if (is_array($existing)) {
                if (!in_array($cardType, $existing)) {
                    $prediction['cardType'][] = $cardType;
                }
            } else {
                if ($existing !== $cardType) {
                    $prediction['cardType'] = [$existing, $cardType];
                }
            }
        } else {
            $prediction['cardType'] = [$cardType];
        }
    }
    
    private function hasExcludeCardType(array $prediction, string $excludeCardType): bool
    {
        if (!isset($prediction['cardType'])) {
            return false;
        }
        
        $cardType = $prediction['cardType'];
        return is_array($cardType) ? in_array($excludeCardType, $cardType) : $cardType === $excludeCardType;
    }
    
    private function saveMatches(array $matches): bool
    {
        $json = json_encode($matches, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $result = file_put_contents($this->filePath, $json);
        
        return $result !== false;
    }
}

$adder = new LostCategoryAdder();
$result = $adder->processLostCategories();

if ($result) {
    exit(0);
} else {
    exit(1);
}
