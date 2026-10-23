<?php

require_once __DIR__ . '/../../vendor/autoload.php';

class CategoryAdderToday
{
    private $filePath;
    
    public function __construct()
    {
        $this->filePath = __DIR__ . '/../../tips/bettingtips_today.json';
    }
    
    public function addCategories(): bool
    {
        try {
            $matches = $this->loadMatches();
            if (empty($matches)) {
                return false;
            }
            
            $hasCategories = false;
            foreach ($matches as $match) {
                if (isset($match['predictions'])) {
                    foreach ($match['predictions'] as $prediction) {
                        if (isset($prediction['cardType']) && !empty($prediction['cardType'])) {
                            $hasCategories = true;
                            break 2;
                        }
                    }
                }
            }
            
            if ($hasCategories) {
                return true;
            }
            
            $updatedMatches = $this->addCategoriesToMatches($matches);
            return $this->saveMatches($updatedMatches);
            
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
    
    private function addCategoriesToMatches(array $matches): array
    {
        $categories = [
            ['daily-sure', 3, ['winner', 'totalgoals', 'btts']],
            ['football', 4, ['winner']],
            ['over-under', 4, ['totalgoals']],
            ['single', 1, ['winner']],
            ['daily-odds', 6, ['winner', 'totalgoals', 'btts']],
            ['bonus', 1, ['winner']],
            ['special', 6, ['btts', 'winner', 'totalgoals']],
            ['fixed', 3, ['btts', 'winner', 'totalgoals']],
            ['correct-score', 3, ['correctscore']],
            ['ht-ft', 7, ['htft']],
            ['multi-50', 50, ['htft', 'totalgoals', 'winner', 'btts']],
            ['mixed', 10, ['htft', 'winner', 'totalgoals', 'correctscore', 'btts']]
        ];
        
        foreach ($categories as [$category, $count, $types]) {
            $matches = $this->addCategoryToMatches($matches, $category, $count, $types);
        }
        
        $matches = $this->addCategoryToMatchesExcluding($matches, 'multi-10', 10, ['htft', 'totalgoals', 'winner', 'btts'], 'multi-50');
        $matches = $this->addCategoryToMatchesExcluding($matches, 'single-vip', 1, ['winner'], 'single');
        
        return $matches;
    }
    
    private function addCategoryToMatches(array $matches, string $category, int $count, array $predictionTypes): array
    {
        $allMatches = array_keys(array_filter($matches, fn($match) => isset($match['predictions'])));
        
        if (empty($allMatches)) return $matches;
        
        $availableMatches = [];
        foreach ($allMatches as $matchIndex) {
            $hasCategory = false;
            foreach ($matches[$matchIndex]['predictions'] as $prediction) {
                if (isset($prediction['cardType']) && is_array($prediction['cardType']) && in_array($category, $prediction['cardType'])) {
                    $hasCategory = true;
                    break;
                }
            }
            if (!$hasCategory) {
                $availableMatches[] = $matchIndex;
            }
        }
        
        
        if (empty($availableMatches)) return $matches;
        
        $selectedMatches = array_rand($availableMatches, min($count, count($availableMatches)));
        if (!is_array($selectedMatches)) $selectedMatches = [$selectedMatches];
        
        foreach ($selectedMatches as $matchIndex) {
            $actualIndex = $availableMatches[$matchIndex];
            $randomType = $predictionTypes[array_rand($predictionTypes)];
            
            if (isset($matches[$actualIndex]['predictions'][$randomType])) {
                $this->addCardTypeToPrediction($matches[$actualIndex]['predictions'][$randomType], $category);
            }
        }
        
        return $matches;
    }
    
    private function addCategoryToMatchesExcluding(array $matches, string $category, int $count, array $predictionTypes, string $excludeCategory): array
    {
        $allMatches = array_keys(array_filter($matches, fn($match) => isset($match['predictions'])));
        
        if (empty($allMatches)) return $matches;
        
        $selectedMatches = array_rand($allMatches, min($count, count($allMatches)));
        if (!is_array($selectedMatches)) $selectedMatches = [$selectedMatches];
        
        foreach ($selectedMatches as $matchIndex) {
            $actualIndex = $allMatches[$matchIndex];
            $randomType = $predictionTypes[array_rand($predictionTypes)];
            
            if (isset($matches[$actualIndex]['predictions'][$randomType])) {
                $prediction = &$matches[$actualIndex]['predictions'][$randomType];
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
            $existingArray = is_array($existing) ? $existing : [$existing];
            
            if (!in_array($cardType, $existingArray)) {
                $prediction['cardType'] = [...$existingArray, $cardType];
            }
        } else {
            $prediction['cardType'] = [$cardType];
        }
    }
    
    private function hasExcludeCardType(array $prediction, string $excludeCardType): bool
    {
        if (!isset($prediction['cardType'])) return false;
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

$adder = new CategoryAdderToday();
$result = $adder->addCategories();

if ($result) {
    exit(0);
} else {
    exit(1);
}
