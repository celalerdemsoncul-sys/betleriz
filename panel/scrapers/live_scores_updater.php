<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../libraries/simple_html_dom.php';

use GuzzleHttp\Client;
use GuzzleHttp\Pool;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Exception\RequestException;

class LiveScoresUpdater
{
    private $client;
    private $url = 'https://www.mybets.today/livescores/';
    private $jsonPath = __DIR__ . '/../tips/bettingtips_today.json';
    private $maxConcurrent = 20;
    
    public function __construct()
    {
        
        $this->client = new Client([
            'timeout' => 5,
            'connect_timeout' => 3,
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
    
    public function updateAll(): bool
    {
        try {
            $success = true;
            
            $todayPath = __DIR__ . '/../tips/bettingtips_today.json';
            $ourTodayMatches = $this->loadOurMatches($todayPath);
            
            if (!empty($ourTodayMatches)) {
                $html = $this->getHtml($this->url);
                if (!empty($html)) {
                    $liveMatches = $this->parseMatches($html);
                    
                    if (!empty($liveMatches)) {
                        $updatedTodayMatches = $this->updateMatches($ourTodayMatches, $liveMatches);
                        $todayResult = $this->saveMatches($updatedTodayMatches, $todayPath);
                        $success = $success && $todayResult;
                    }
                }
            }
            
            $yesterdayPath = __DIR__ . '/../tips/bettingtips_yesterday.json';
            $ourYesterdayMatches = $this->loadOurMatches($yesterdayPath);
            
            if (!empty($ourYesterdayMatches)) {
                $yesterdayUrl = 'https://www.mybets.today/livescores/yesterday/';
                $yesterdayHtml = $this->getHtml($yesterdayUrl);
                if (!empty($yesterdayHtml)) {
                    $yesterdayLiveMatches = $this->parseMatches($yesterdayHtml);
                    
                    if (!empty($yesterdayLiveMatches)) {
                        $updatedYesterdayMatches = $this->updateMatches($ourYesterdayMatches, $yesterdayLiveMatches);
                        $yesterdayResult = $this->saveMatches($updatedYesterdayMatches, $yesterdayPath);
                        $success = $success && $yesterdayResult;
                    }
                }
            }
            
            return $success;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function getHtml(string $url): string
    {
        $timestamp = time();
        $random = mt_rand(1000, 9999);
        $urlWithParams = $url . '?t=' . $timestamp . '&r=' . $random;
        
        try {
            $response = $this->client->get($urlWithParams);
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
        if (!empty($fixtures)) {
            foreach ($fixtures as $fixture) {
                $match = $this->parseEventFixture($fixture);
                if ($match) {
                    $matches[] = $match;
                }
            }
        } else {
            $fixtures = $dom->find('.match-row, .prediction-row, .fixture-row');
            foreach ($fixtures as $fixture) {
                $match = $this->parseFixture($fixture);
                if ($match) {
                    $matches[] = $match;
                }
            }
        }
        
        $dom->clear();
        return $matches;
    }
    
    private function parseEventFixture($fixture): ?array
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
        
        $status = 'SCHEDULED';
        $minute = 0;
        
        $liveGame = $fixture->find('.livegame', 0);
        if ($liveGame) {
            $liveText = trim($liveGame->plaintext);
            $liveText = preg_replace('/[^\w\s]/', '', $liveText);
            $liveText = trim($liveText);
            
            if (strtoupper($liveText) === 'HT') {
                $status = 'HT';
            } elseif (strtoupper($liveText) === 'FT') {
                $status = 'FT';
            } elseif (preg_match('/(\d+)/', $liveText, $timeMatches)) {
                $status = 'LIVE';
                $minute = (int)$timeMatches[1];
            }
        } else {
            $timeSpan = $fixture->find('time span', 0);
            if ($timeSpan) {
                $timeText = trim($timeSpan->plaintext);
                if (strtoupper($timeText) === 'FT') {
                    $status = 'FT';
                } elseif (strtoupper($timeText) === 'HT') {
                    $status = 'HT';
                } elseif (preg_match('/(\d+)/', $timeText, $timeMatches)) {
                    $status = 'LIVE';
                    $minute = (int)$timeMatches[1];
                }
            }
        }
        
        if (empty($homeTeam) || empty($awayTeam) || $homeScore === null || $awayScore === null) {
            return null;
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
    
    private function parseFixture($fixture): ?array
    {
        $homeTeam = $fixture->find('.homespan, .home-team, .team-home', 0);
        $awayTeam = $fixture->find('.awayspan, .away-team, .team-away', 0);
        
        if (!$homeTeam || !$awayTeam) {
            $text = $fixture->plaintext;
            if (preg_match('/([A-Za-z\s]+)\s*-\s*([A-Za-z\s]+)/', $text, $teamMatches)) {
                $homeTeamName = trim($teamMatches[1]);
                $awayTeamName = trim($teamMatches[2]);
            } else {
                return null;
            }
        } else {
            $homeTeamName = trim($homeTeam->plaintext);
            $awayTeamName = trim($awayTeam->plaintext);
        }
        
        $scoreDiv = $fixture->find('.vsdiv, .score, .result, .match-score', 0);
        $score = $scoreDiv ? trim($scoreDiv->plaintext) : '';
        
        if (empty($score)) {
            if (preg_match('/(\d+)\s*-\s*(\d+)/', $fixture->plaintext, $scoreMatches)) {
                $score = $scoreMatches[0];
            }
        }
        
        $timeText = '';
        
        $liveGame = $fixture->find('.livegame', 0);
        if ($liveGame) {
            $liveText = trim($liveGame->plaintext);
            $liveText = preg_replace('/[^\w\s]/', '', $liveText);
            $liveText = trim($liveText);
            
            if (strtoupper($liveText) === 'HT') {
                $timeText = 'HT';
            }
            elseif (strtoupper($liveText) === 'FT') {
                $timeText = 'FT';
            }
            elseif (preg_match('/(\d+)/', $liveText, $timeMatches)) {
                $timeText = $liveText;
            }
        }
        
        if (empty($timeText)) {
            $timeDiv = $fixture->find('time, .time, .status', 0);
            if ($timeDiv) {
                $timeText = trim($timeDiv->plaintext);
                $timeText = preg_replace('/[^\w\s]/', '', $timeText);
                $timeText = trim($timeText);
            }
        }
        
        $homeScore = null;
        $awayScore = null;
        $status = 'SCHEDULED';
        $minute = 0;
        
        if (preg_match('/(\d+)\s*-\s*(\d+)/', $score, $scoreMatches)) {
            $homeScore = (int)$scoreMatches[1];
            $awayScore = (int)$scoreMatches[2];
            
            if (strtoupper($timeText) === 'FT') {
                $status = 'FT';
            } elseif (strtoupper($timeText) === 'HT') {
                $status = 'HT';
            } elseif (preg_match('/(\d+)/', $timeText, $timeMatches)) {
                $status = 'LIVE';
                $minute = (int)$timeMatches[1];
            } else {
                $status = 'LIVE';
                $minute = 0;
            }
        }
        
        return [
            'homeTeam' => $homeTeamName,
            'awayTeam' => $awayTeamName,
            'homeScore' => $homeScore,
            'awayScore' => $awayScore,
            'status' => $status,
            'minute' => $minute
        ];
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
                if (!isset($ourMatch['liveScore'])) {
                    $ourMatch['liveScore'] = [];
                }
                
                
                $ourMatch['liveScore']['homeScore'] = $foundMatch['homeScore'];
                $ourMatch['liveScore']['awayScore'] = $foundMatch['awayScore'];
                $ourMatch['liveScore']['status'] = $foundMatch['status'];
                $ourMatch['liveScore']['minute'] = $foundMatch['minute'];
                
                if ($foundMatch['status'] === 'HT') {
                    $ourMatch['liveScore']['htScore'] = [
                        'homeScore' => $foundMatch['homeScore'],
                        'awayScore' => $foundMatch['awayScore']
                    ];
                } 
                elseif ($foundMatch['status'] === 'FT') {
                    $ourMatch['liveScore']['ftScore'] = [
                        'homeScore' => $foundMatch['homeScore'],
                        'awayScore' => $foundMatch['awayScore']
                    ];
                    
                    if (!isset($ourMatch['liveScore']['htScore'])) {
                        $ourMatch['liveScore']['htScore'] = [
                            'homeScore' => $foundMatch['homeScore'],
                            'awayScore' => $foundMatch['awayScore']
                        ];
                    }
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
            $result = $htResult . '/HT';
            return $result;
        }
        
        return null;
    }
    
    private function calculateHTFTForFT(array $liveScore): ?string
    {
        if (isset($liveScore['htScore']) && isset($liveScore['ftScore'])) {
            $htResult = $this->getResult($liveScore['htScore']);
            $ftResult = $this->getResult($liveScore['ftScore']);
            $result = $htResult . '/' . $ftResult;
            return $result;
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
        $draw = $homeScore === $awayScore;
        
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
    
    private function loadOurMatches(string $path): array
    {
        if (!file_exists($path)) {
            return [];
        }
        
        $json = file_get_contents($path);
        $matches = json_decode($json, true);
        
        return $matches ?: [];
    }
    
    private function saveMatches(array $matches, string $path): bool
    {
        $json = json_encode($matches, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $result = file_put_contents($path, $json);
        
        return $result !== false;
    }
}

$updater = new LiveScoresUpdater();
$result = $updater->updateAll();

if ($result) {
    exit(0);
} else {
    exit(1);
}