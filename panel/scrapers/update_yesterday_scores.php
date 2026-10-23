<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../libraries/simple_html_dom.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class YesterdayScoresUpdater
{
    private $client;
    private $yesterdayUrl = 'https://www.mybets.today/livescores/yesterday/';
    private $yesterdayJsonPath = __DIR__ . '/../tips/bettingtips_yesterday.json';
    
    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 10,
            'connect_timeout' => 5,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'en-US,en;q=0.5',
                'Accept-Encoding' => 'gzip, deflate',
                'Connection' => 'keep-alive'
            ],
            'curl' => [
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_ENCODING => 'gzip,deflate',
                CURLOPT_HTTPHEADER => [
                    'Content-Type: text/html; charset=UTF-8'
                ]
            ]
        ]);
    }
    
    public function updateYesterdayScores(): bool
    {
        
        try {
            $yesterdayMatches = $this->loadYesterdayMatches();
            if (empty($yesterdayMatches)) {
                return false;
            }
            
            
            $html = $this->getHtml($this->yesterdayUrl);
            if (empty($html)) {
                return false;
            }
            
            $liveMatches = $this->parseMatches($html);
            
            if (empty($liveMatches)) {
                return false;
            }
            
            $updatedMatches = $this->updateMatches($yesterdayMatches, $liveMatches);
            
            $result = $this->saveMatches($updatedMatches, $this->yesterdayJsonPath);
            
            return $result;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function getHtml(string $url): string
    {
        try {
            $response = $this->client->get($url);
            $html = $response->getBody()->getContents();
            return $html;
        } catch (RequestException $e) {
            return '';
        }
    }
    
    private function parseMatches(string $html): array
    {
        $dom = str_get_html($html);
        if (!$dom) {
            return [];
        }
        
        $matches = [];
        $fixtures = $dom->find('.event-fixtures');
        
        foreach ($fixtures as $index => $fixture) {
            $match = $this->parseEventFixture($fixture, $index);
            if ($match) {
                $matches[] = $match;
            }
        }
        
        $dom->clear();
        return $matches;
    }
    
    private function parseEventFixture($fixture, $index): ?array
    {
        $homeTeam = '';
        $awayTeam = '';
        
        $metaName = $fixture->find('meta[itemprop="name"]', 0);
        if ($metaName && $metaName->content) {
            $content = $metaName->content;
            if (preg_match('/([^v]+)\s+vs\s+(.+)/', $content, $teamMatches)) {
                $homeTeam = trim($teamMatches[1]);
                $awayTeam = trim($teamMatches[2]);
            }
        }
        
        if (empty($homeTeam) || empty($awayTeam)) {
            $spans = $fixture->find('span');
            $teamSpans = [];
            
            foreach ($spans as $span) {
                $text = trim($span->plaintext);
                if (strlen($text) > 3 && !preg_match('/^\d+$/', $text) && !preg_match('/^FT$/', $text)) {
                    $teamSpans[] = $text;
                }
            }
            
            if (count($teamSpans) >= 2) {
                $homeTeam = $teamSpans[0];
                $awayTeam = $teamSpans[1];
            }
        }
        
        $scoreDiv = $fixture->find('.vsdiv', 0);
        $score = $scoreDiv ? trim($scoreDiv->plaintext) : '';
        
        $homeScore = null;
        $awayScore = null;
        
        if (preg_match('/(\d+)\s*-\s*(\d+)/', $score, $scoreMatches)) {
            $homeScore = (int)$scoreMatches[1];
            $awayScore = (int)$scoreMatches[2];
        }
        
        $status = 'FT';
        $minute = 0;
        
        $timeSpan = $fixture->find('time span', 0);
        if ($timeSpan) {
            $timeText = trim($timeSpan->plaintext);
            if (strtoupper($timeText) === 'FT') {
                $status = 'FT';
            } elseif (strtoupper($timeText) === 'HT') {
                $status = 'HT';
            } elseif (preg_match('/(\d+)/', $timeText, $timeMatches)) {
                $minute = (int)$timeMatches[1];
                if ($minute >= 90) {
                    $status = 'FT';
                } else {
                    $status = 'LIVE';
                }
            }
        }
        
        if (strpos($this->yesterdayUrl, 'yesterday') !== false) {
            $status = 'FT';
            $minute = 0;
        }
        
        if (empty($homeTeam) || empty($awayTeam) || $homeScore === null || $awayScore === null) {
            return null;
        }
        
        if ($index < 5) {
        }
        
        return [
            'homeTeam' => $homeTeam,
            'awayTeam' => $awayTeam,
            'homeScore' => $homeScore,
            'awayScore' => $awayScore,
            'status' => $status,
            'minute' => $minute
        ];
    }
    
    private function loadYesterdayMatches(): array
    {
        if (!file_exists($this->yesterdayJsonPath)) {
            return [];
        }
        
        $json = file_get_contents($this->yesterdayJsonPath);
        $matches = json_decode($json, true);
        
        if (!$matches) {
            return [];
        }
        
        return $matches;
    }
    
    private function updateMatches(array $ourMatches, array $liveMatches): array
    {
        $updatedMatches = [];
        $foundCount = 0;
        
        foreach ($ourMatches as $ourMatch) {
            $ourHomeTeam = $ourMatch['homeTeam'] ?? '';
            $ourAwayTeam = $ourMatch['awayTeam'] ?? '';
            
            $foundMatch = null;
            foreach ($liveMatches as $liveMatch) {
                if (is_array($liveMatch) && isset($liveMatch['homeTeam']) && isset($liveMatch['awayTeam'])) {
                    if ($this->isMatch($ourHomeTeam, $ourAwayTeam, $liveMatch['homeTeam'], $liveMatch['awayTeam'])) {
                        $foundMatch = $liveMatch;
                        $foundCount++;
                        break;
                    }
                }
            }
            
            if ($foundMatch) {
                $ourMatch['liveScore'] = [
                    'homeScore' => $foundMatch['homeScore'],
                    'awayScore' => $foundMatch['awayScore'],
                    'status' => $foundMatch['status'],
                    'minute' => $foundMatch['minute']
                ];
                
                if ($foundMatch['status'] === 'HT') {
                    $ourMatch['liveScore']['htScore'] = [
                        'homeScore' => $foundMatch['homeScore'],
                        'awayScore' => $foundMatch['awayScore']
                    ];
                } elseif ($foundMatch['status'] === 'FT') {
                    $ourMatch['liveScore']['ftScore'] = [
                        'homeScore' => $foundMatch['homeScore'],
                        'awayScore' => $foundMatch['awayScore']
                    ];
                }
                
                if ($foundMatch['status'] === 'HT') {
                    $htftResult = $this->calculateHTFT($ourMatch['liveScore']);
                    if ($htftResult) {
                        $ourMatch['liveScore']['htftResult'] = $htftResult;
                    }
                } elseif ($foundMatch['status'] === 'FT' && isset($ourMatch['liveScore']['htScore'])) {
                    $htftResult = $this->calculateHTFTForFT($ourMatch['liveScore']);
                    if ($htftResult) {
                        $ourMatch['liveScore']['htftResult'] = $htftResult;
                    }
                }
                
                if ($foundMatch['status'] === 'FT') {
                    $predictionResults = $this->checkPredictions($ourMatch, $ourMatch['liveScore']);
                    if (isset($ourMatch['predictions'])) {
                        foreach ($ourMatch['predictions'] as $type => $prediction) {
                            if (isset($predictionResults[$type]) && !empty($predictionResults[$type])) {
                                $ourMatch['predictions'][$type]['result'] = $predictionResults[$type];
                            }
                        }
                    }
                } elseif ($foundMatch['status'] === 'HT') {
                    $predictionResults = $this->checkPredictions($ourMatch, $ourMatch['liveScore']);
                    if (isset($ourMatch['predictions']['htft']) && isset($predictionResults['htft']) && !empty($predictionResults['htft'])) {
                        $ourMatch['predictions']['htft']['result'] = $predictionResults['htft'];
                    }
                }
                
            }
            
            $updatedMatches[] = $ourMatch;
        }
        
        return $updatedMatches;
    }
    
    private function isMatch(string $ourHome, string $ourAway, string $liveHome, string $liveAway): bool
    {
        $ourHome = strtolower(trim($ourHome));
        $ourAway = strtolower(trim($ourAway));
        $liveHome = strtolower(trim($liveHome));
        $liveAway = strtolower(trim($liveAway));
        
        if ($ourHome === $liveHome && $ourAway === $liveAway) {
            return true;
        }
        
        $ourHomeFirst = explode(' ', $ourHome)[0];
        $ourAwayFirst = explode(' ', $ourAway)[0];
        $liveHomeFirst = explode(' ', $liveHome)[0];
        $liveAwayFirst = explode(' ', $liveAway)[0];
        
        return $ourHomeFirst === $liveHomeFirst && $ourAwayFirst === $liveAwayFirst;
    }
    
    private function calculateHTFT(array $liveScore): ?string
    {
        if (isset($liveScore['htScore']) && !isset($liveScore['ftScore'])) {
            $htResult = $this->getResult($liveScore['htScore']);
            return $htResult . '/HT';
        }
        
        return null;
    }
    
    private function calculateHTFTForFT(array $liveScore): ?string
    {
        if (isset($liveScore['htScore']) && isset($liveScore['ftScore'])) {
            $htResult = $this->getResult($liveScore['htScore']);
            $ftResult = $this->getResult($liveScore['ftScore']);
            return $htResult . '/' . $ftResult;
        }
        
        return null;
    }
    
    private function getResult(array $score): string
    {
        if ($score['homeScore'] > $score['awayScore']) return '1';
        if ($score['awayScore'] > $score['homeScore']) return '2';
        return 'X';
    }
    
    private function checkPredictions(array $match, array $liveScore): array
    {
        $predictions = $match['predictions'] ?? [];
        $results = [];
        
        foreach ($predictions as $type => $prediction) {
            if (is_array($prediction)) {
                $prediction = $prediction['prediction'] ?? '';
            }
            
            if (empty($prediction)) continue;
            
            switch ($type) {
                case 'winner':
                    $results[$type] = $this->checkWinner($prediction, $liveScore['homeScore'], $liveScore['awayScore'], $match['homeTeam'], $match['awayTeam']);
                    break;
                case 'totalgoals':
                    $results[$type] = $this->checkTotalGoals($prediction, $liveScore['homeScore'], $liveScore['awayScore']);
                    break;
                case 'htft':
                    $results[$type] = $this->checkHTFT($prediction, $liveScore['htftResult'] ?? '');
                    break;
                case 'correctscore':
                    $results[$type] = $this->checkCorrectScore($prediction, $liveScore['homeScore'], $liveScore['awayScore']);
                    break;
                case 'btts':
                    $results[$type] = $this->checkBTTS($prediction, $liveScore['homeScore'], $liveScore['awayScore']);
                    break;
            }
        }
        
        return $results;
    }
    
    private function checkWinner(string $prediction, ?int $homeScore, ?int $awayScore, string $homeTeam, string $awayTeam): string
    {
        if ($homeScore === null || $awayScore === null) return 'LOST';
        
        $homeWon = $homeScore > $awayScore;
        $awayWon = $awayScore > $homeScore;
        
        $prediction = trim($prediction);
        
        if ($homeWon) {
            return (strtolower($prediction) === strtolower($homeTeam)) ? 'WON' : 'LOST';
        } elseif ($awayWon) {
            return (strtolower($prediction) === strtolower($awayTeam)) ? 'WON' : 'LOST';
        } else {
            return 'LOST';
        }
    }
    
    private function checkTotalGoals(string $prediction, ?int $homeScore, ?int $awayScore): string
    {
        if ($homeScore === null || $awayScore === null) return 'LOST';
        
        $total = $homeScore + $awayScore;
        $prediction = strtolower($prediction);
        
        if ($prediction === 'over 2.5' && $total > 2.5) return 'WON';
        if ($prediction === 'under 2.5' && $total < 2.5) return 'WON';
        return 'LOST';
    }
    
    private function checkHTFT(string $prediction, string $htftResult): string
    {
        if (empty($htftResult)) return '';
        
        $prediction = str_replace(['/', '-', ' '], '/', $prediction);
        $htftResult = str_replace(['/', '-', ' '], '/', $htftResult);
        
        if (strpos($htftResult, '/HT') !== false) {
            $htPart = explode('/', $htftResult)[0];
            $predictionHtPart = explode('/', $prediction)[0];
            return $htPart === $predictionHtPart ? 'WON' : 'LOST';
        }
        
        if (strpos($htftResult, '/HT') === false) {
            return $prediction === $htftResult ? 'WON' : 'LOST';
        }
        
        return '';
    }
    
    private function checkCorrectScore(string $prediction, ?int $homeScore, ?int $awayScore): string
    {
        if ($homeScore === null || $awayScore === null) return 'LOST';
        
        $score = $homeScore . '-' . $awayScore;
        return $prediction === $score ? 'WON' : 'LOST';
    }
    
    private function checkBTTS(string $prediction, ?int $homeScore, ?int $awayScore): string
    {
        if ($homeScore === null || $awayScore === null) return 'LOST';
        
        $btts = $homeScore > 0 && $awayScore > 0;
        $prediction = strtolower($prediction);
        
        if ($prediction === 'yes' && $btts) return 'WON';
        if ($prediction === 'no' && !$btts) return 'WON';
        return 'LOST';
    }
    
    private function saveMatches(array $matches, string $path): bool
    {
        $json = json_encode($matches, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $result = file_put_contents($path, $json);
        
        return $result !== false;
    }
}

$updater = new YesterdayScoresUpdater();
$result = $updater->updateYesterdayScores();

if ($result) {
    exit(0);
} else {
    exit(1);
}
