<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../libraries/simple_html_dom.php';

use GuzzleHttp\Client;
use GuzzleHttp\Pool;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Exception\RequestException;

class CompleteScraper
{
    private $client;
    private $urls = [
        'today' => 'https://www.mybets.today/soccer-predictions/',
        'yesterday' => 'https://www.mybets.today/soccer-predictions/yesterday/',
        'tomorrow' => 'https://www.mybets.today/soccer-predictions/tomorrow/',
        'after-tomorrow' => 'https://www.mybets.today/soccer-predictions/after-tomorrow/'
    ];
    private $results = [];
    private $yesterdayResults = [];
    private $tomorrowResults = [];
    private $afterTomorrowResults = [];
    private $maxConcurrent = 20;
    
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
    
    private function getNextMatchId($day)
    {
        $jsonFiles = [
            'today' => __DIR__ . '/../tips/bettingtips_today.json',
            'yesterday' => __DIR__ . '/../tips/bettingtips_yesterday.json',
            'tomorrow' => __DIR__ . '/../tips/bettingtips_tomorrow.json',
            'after-tomorrow' => __DIR__ . '/../tips/bettingtips_after_tomorrow.json'
        ];
        
        $filePath = $jsonFiles[$day] ?? $jsonFiles['today'];
        
        if (!file_exists($filePath)) {
            return 1;
        }
        
        $json = file_get_contents($filePath);
        $matches = json_decode($json, true);
        
        if (!$matches || !is_array($matches)) {
            return 1;
        }
        
        $maxId = 0;
        foreach ($matches as $match) {
            if (isset($match['matchId']) && $match['matchId'] > $maxId) {
                $maxId = $match['matchId'];
            }
        }
        
        return $maxId + 1;
    }
    
    public function scrapeAll()
    {
        $todayHtml = $this->getHtml($this->urls['today']);
        if ($todayHtml) {
            $this->extractAllData($todayHtml, 'today');
        }
        
        $yesterdayHtml = $this->getHtml($this->urls['yesterday']);
        if ($yesterdayHtml) {
            $this->extractAllData($yesterdayHtml, 'yesterday');
        }
        
        $tomorrowHtml = $this->getHtml($this->urls['tomorrow']);
        if ($tomorrowHtml) {
            $this->extractAllData($tomorrowHtml, 'tomorrow');
        }
        
        $afterTomorrowHtml = $this->getHtml($this->urls['after-tomorrow']);
        if ($afterTomorrowHtml) {
            $this->extractAllData($afterTomorrowHtml, 'after-tomorrow');
        }
        
        $this->ensureMinimumMatches();
        
        return true;
    }
    
    private function getHtml($url)
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            CURLOPT_HTTPHEADER => [
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: en-US,en;q=0.5',
                'Accept-Encoding: gzip, deflate',
                'Connection: keep-alive',
                'Content-Type: text/html; charset=UTF-8'
            ],
            CURLOPT_ENCODING => 'gzip,deflate'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        return $response;
    }
    
    private function extractAllData($html, $day = 'today')
    {
        $this->extractMatchesWithLeagues($html, $day);
    }
    
    private function extractMatchesWithLeagues($html, $day = 'today')
    {
        $dom = str_get_html($html);
        if (!$dom) return;
        
        $allLinks = [];
        $matchId = $this->getNextMatchId($day);
        $matchLinks = $dom->find('a.linkgames');
        
        foreach ($matchLinks as $matchLink) {
            $url = trim($matchLink->href);
            $timeDiv = $matchLink->find('div.timediv time', 0);
            $matchTime = $timeDiv ? trim($timeDiv->plaintext) : '00:00';
            
            $matchDate = '';
            $realMatchId = '';
            if ($timeDiv) {
                $matchDate = $timeDiv->getAttribute('datetime') ?: '';
            }
            
            if ($url) {
                if (preg_match('/(?:-dii)?(\d+)\/?$/', $url, $matches)) {
                    $realMatchId = (int)$matches[1];
                }
            }
            
            if (empty($realMatchId)) {
                $realMatchId = $matchId;
            }
            
            $homeSpan = $matchLink->find('div.homediv span.homespan', 0);
            $homeTeam = $homeSpan ? trim($homeSpan->plaintext) : '';
            $awaySpan = $matchLink->find('div.awaydiv span.awayspan', 0);
            $awayTeam = $awaySpan ? trim($awaySpan->plaintext) : '';
            
            if (!$url || !$homeTeam || !$awayTeam) continue;
            
            $currentLeague = 'Unknown League';
            $currentLeagueFlag = '';
            $parent = $matchLink->parent();
            
            while ($parent) {
                $prevSibling = $parent->prev_sibling();
                while ($prevSibling) {
                    if ($prevSibling->class == 'titlegames') {
                        $leagueImg = $prevSibling->find('img.imgleaguelogo', 0);
                        $leagueName = $prevSibling->find('div.leaguename a', 0);
                        
                        if ($leagueImg && $leagueName) {
                            $currentLeague = trim($leagueName->plaintext);
                            $currentLeagueFlag = trim($leagueImg->src);
                            break 2;
                        }
                    }
                    $prevSibling = $prevSibling->prev_sibling();
                }
                $parent = $parent->parent();
            }
            
            
            $allLinks[] = [
                'matchId' => $realMatchId,
                'url' => $url,
                'homeTeam' => $homeTeam,
                'awayTeam' => $awayTeam,
                'matchTime' => $matchTime,
                'matchDate' => $matchDate,
                'competitionName' => $currentLeague,
                'leagueFlag' => $currentLeagueFlag,
                'day' => $day
            ];
            $matchId++;
        }
        
        $dom->clear();
        unset($dom);
        
        $allLinks = array_slice($allLinks, 0, 200);
        
        $this->scrapeDetails($allLinks, $day);
    }
    
    
    private function extractMatchesAlternative($html)
    {
        $urlPattern = '/<a class=\'linkgames\'[^>]*href=\'([^\']+)\'/';
        $timePattern = '/<div class=\'timediv\'><time[^>]*>([^<]+)<\/time><\/div>/';
        $homePattern = '/<div class=\'homediv\'><span[^>]*><span[^>]*class=\'homespan\'>([^<]+)<\/span><\/span><\/div>/';
        $awayPattern = '/<div class=\'awaydiv\'><span[^>]*><span[^>]*class=\'awayspan\'>([^<]+)<\/span><\/span><\/div>/';
        
        preg_match_all($urlPattern, $html, $urlMatches);
        preg_match_all($timePattern, $html, $timeMatches);
        preg_match_all($homePattern, $html, $homeMatches);
        preg_match_all($awayPattern, $html, $awayMatches);
        
        $links = [];
        $maxMatches = min(count($urlMatches[1]), count($timeMatches[1]), count($homeMatches[1]), count($awayMatches[1]));
        
        for ($i = 0; $i < $maxMatches; $i++) {
            $links[] = [
                'matchId' => $i + 1,
                'url' => trim($urlMatches[1][$i]),
                'homeTeam' => trim($homeMatches[1][$i]),
                'awayTeam' => trim($awayMatches[1][$i]),
                'matchTime' => trim($timeMatches[1][$i]),
                'competitionName' => 'Unknown League',
                'leagueFlag' => ''
            ];
        }
        
        $this->scrapeDetails($links, $day);
    }
    
    private function scrapeDetails($links, $day = 'today')
    {
        if (empty($links)) return;
        
        $requests = [];
        foreach ($links as $index => $linkData) {
            $requests[] = new Request('GET', $linkData['url']);
        }
        
        $pool = new Pool($this->client, $requests, [
            'concurrency' => $this->maxConcurrent,
            'fulfilled' => function ($response, $index) use ($links, $day) {
                $this->processResponse($response, $index, $links, $day);
            },
            'rejected' => function ($reason, $index) {
            }
        ]);
        
        $promise = $pool->promise();
        $promise->wait();
    }
    
    private function processResponse($response, $index, $links, $day = 'today')
    {
        $html = $response->getBody()->getContents();
        $linkData = $links[$index];
        $matchData = $this->extractMatchData($html, $linkData, true);
        
        if ($matchData) {
            if ($day === 'yesterday') {
                $this->yesterdayResults[] = $matchData;
            } elseif ($day === 'tomorrow') {
                $this->tomorrowResults[] = $matchData;
            } elseif ($day === 'after-tomorrow') {
                $this->afterTomorrowResults[] = $matchData;
            } else {
                $this->results[] = $matchData;
            }
        }
    }
    
    private function extractMatchData($html, $linkData, $useStrictFilter = true)
    {
        $homeTeam = $linkData['homeTeam'];
        $awayTeam = $linkData['awayTeam'];
        $matchTime = $linkData['matchTime'];
        $matchDate = $linkData['matchDate'] ?? '';
        $predictions = [];
        
        if (preg_match('/<div class="marketpredi"><h2 class="title">Winner<\/h2><div class="tipmarket">([^<]+)<\/div><\/div>.*?<div class="predictionvalue">(\d+)%<\/div>/is', $html, $matches)) {
            $percentage = (int)$matches[2];
            if (!$useStrictFilter || $percentage >= 65) {
                $predictions['winner'] = [
                    'type' => 'Winner',
                    'prediction' => trim($matches[1]),
                    'percentage' => $percentage
                ];
            }
        }
        
        if (preg_match('/<div class="marketpredi"><h2 class="title">Total Goals<\/h2><div class="tipmarket">([^<]+)<\/div><\/div>.*?<div class="predictionvalue">(\d+)%<\/div>/is', $html, $matches)) {
            $predictions['totalgoals'] = [
                'type' => 'Total Goals',
                'prediction' => trim($matches[1]),
                'percentage' => (int)$matches[2]
            ];
        }
        
        if (preg_match('/<div class="marketpredi"><h2 class="title">HT\/FT<\/h2><div class="tipmarket">([^<]+)<\/div><\/div>.*?<div class="predictionvalue">(\d+)%<\/div>/is', $html, $matches)) {
            $predictions['htft'] = [
                'type' => 'HT/FT',
                'prediction' => trim($matches[1]),
                'percentage' => (int)$matches[2]
            ];
        }
        
        if (preg_match('/<div class="marketpredi"><h2 class="title">Correct Score<\/h2><div class="tipmarket">([^<]+)<\/div><\/div>.*?<div class="predictionvalue">(\d+)%<\/div>/is', $html, $matches)) {
            $predictions['correctscore'] = [
                'type' => 'Correct Score',
                'prediction' => trim($matches[1]),
                'percentage' => (int)$matches[2]
            ];
        }
        
        if (preg_match('/<div class="marketpredi"><h2 class="title">Both Teams To Score<\/h2><div class="tipmarket">([^<]+)<\/div><\/div>.*?<div class="predictionvalue">(\d+)%<\/div>/is', $html, $matches)) {
            $predictions['btts'] = [
                'type' => 'Both Teams To Score',
                'prediction' => trim($matches[1]),
                'percentage' => (int)$matches[2]
            ];
        }
        
        if (empty($predictions) || !isset($predictions['winner'])) return null;
        
        $teamFlags = [];
        preg_match_all('/<img[^>]*src="([^"]*\/clubes\/[^\"]+)"[^>]*alt="([^"]+)"/i', $html, $teamFlagMatches);
        for ($i = 0; $i < count($teamFlagMatches[1]); $i++) {
            $teamFlags[trim($teamFlagMatches[2][$i])] = $teamFlagMatches[1][$i];
        }
        
        return [
            'matchId' => $linkData['matchId'],
            'homeTeam' => $homeTeam,
            'awayTeam' => $awayTeam,
            'matchTime' => $matchTime,
            'matchDate' => $matchDate,
            'competitionName' => $linkData['competitionName'],
            'leagueFlag' => $linkData['leagueFlag'],
            'predictions' => $predictions,
            'teamFlags' => $teamFlags
        ];
    }
    
    public function saveToJson()
    {
        $saved = false;
        
        if (!empty($this->results)) {
            usort($this->results, function($a, $b) {
                return strcmp($a['matchTime'], $b['matchTime']);
            });
            
            
            $json = json_encode($this->results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            file_put_contents(__DIR__ . '/../tips/bettingtips_today.json', $json);
            chmod(__DIR__ . '/../tips/bettingtips_today.json', 0777);
            $saved = true;
        }
        
        if (!empty($this->yesterdayResults)) {
            usort($this->yesterdayResults, function($a, $b) {
                return strcmp($a['matchTime'], $b['matchTime']);
            });
            
            
            $json = json_encode($this->yesterdayResults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            file_put_contents(__DIR__ . '/../tips/bettingtips_yesterday.json', $json);
            chmod(__DIR__ . '/../tips/bettingtips_yesterday.json', 0777);
            $saved = true;
        }
        
        if (!empty($this->tomorrowResults)) {
            usort($this->tomorrowResults, function($a, $b) {
                return strcmp($a['matchTime'], $b['matchTime']);
            });
            
            
            $json = json_encode($this->tomorrowResults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            file_put_contents(__DIR__ . '/../tips/bettingtips_tomorrow.json', $json);
            chmod(__DIR__ . '/../tips/bettingtips_tomorrow.json', 0777);
            $saved = true;
        }
        
        if (!empty($this->afterTomorrowResults)) {
            usort($this->afterTomorrowResults, function($a, $b) {
                return strcmp($a['matchTime'], $b['matchTime']);
            });
            
            
            $json = json_encode($this->afterTomorrowResults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            file_put_contents(__DIR__ . '/../tips/bettingtips_after_tomorrow.json', $json);
            chmod(__DIR__ . '/../tips/bettingtips_after_tomorrow.json', 0777);
            $saved = true;
        }
        
        return $saved;
    }
    
    private function ensureMinimumMatches()
    {
        $days = [
            'today' => $this->results,
            'yesterday' => $this->yesterdayResults,
            'tomorrow' => $this->tomorrowResults,
            'after-tomorrow' => $this->afterTomorrowResults
        ];
        
        foreach ($days as $day => $results) {
            if (count($results) < 20) {
                $this->refetchAllMatches($day);
            }
        }
    }
    
    private function refetchAllMatches($day)
    {
        $html = $this->getHtml($this->urls[$day]);
        if (!$html) return;
        
        switch ($day) {
            case 'today':
                $this->results = [];
                break;
            case 'yesterday':
                $this->yesterdayResults = [];
                break;
            case 'tomorrow':
                $this->tomorrowResults = [];
                break;
            case 'after-tomorrow':
                $this->afterTomorrowResults = [];
                break;
        }
        
        $this->extractAllDataWithoutFilter($html, $day);
    }
    
    private function extractAllDataWithoutFilter($html, $day = 'today')
    {
        $this->extractMatchesWithLeaguesWithoutFilter($html, $day);
    }
    
    private function extractMatchesWithLeaguesWithoutFilter($html, $day = 'today')
    {
        $dom = str_get_html($html);
        if (!$dom) return;
        
        $allLinks = [];
        $matchId = $this->getNextMatchId($day);
        $matchLinks = $dom->find('a.linkgames');
        
        foreach ($matchLinks as $matchLink) {
            $url = trim($matchLink->href);
            $timeDiv = $matchLink->find('div.timediv time', 0);
            $matchTime = $timeDiv ? trim($timeDiv->plaintext) : '00:00';
            
            $matchDate = '';
            $realMatchId = '';
            if ($timeDiv) {
                $matchDate = $timeDiv->getAttribute('datetime') ?: '';
            }
            
            if ($url) {
                if (preg_match('/(?:-dii)?(\d+)\/?$/', $url, $matches)) {
                    $realMatchId = (int)$matches[1];
                }
            }
            
            if (empty($realMatchId)) {
                $realMatchId = $matchId;
            }
            
            $homeSpan = $matchLink->find('div.homediv span.homespan', 0);
            $homeTeam = $homeSpan ? trim($homeSpan->plaintext) : '';
            $awaySpan = $matchLink->find('div.awaydiv span.awayspan', 0);
            $awayTeam = $awaySpan ? trim($awaySpan->plaintext) : '';
            
            if (!$url || !$homeTeam || !$awayTeam) continue;
            
            $currentLeague = 'Unknown League';
            $currentLeagueFlag = '';
            $parent = $matchLink->parent();
            
            while ($parent) {
                $prevSibling = $parent->prev_sibling();
                while ($prevSibling) {
                    if ($prevSibling->class == 'titlegames') {
                        $leagueImg = $prevSibling->find('img.imgleaguelogo', 0);
                        $leagueName = $prevSibling->find('div.leaguename a', 0);
                        
                        if ($leagueImg && $leagueName) {
                            $currentLeague = trim($leagueName->plaintext);
                            $currentLeagueFlag = trim($leagueImg->src);
                            break 2;
                        }
                    }
                    $prevSibling = $prevSibling->prev_sibling();
                }
                $parent = $parent->parent();
            }
            
            $allLinks[] = [
                'matchId' => $realMatchId,
                'url' => $url,
                'homeTeam' => $homeTeam,
                'awayTeam' => $awayTeam,
                'matchTime' => $matchTime,
                'matchDate' => $matchDate,
                'competitionName' => $currentLeague,
                'leagueFlag' => $currentLeagueFlag,
                'day' => $day
            ];
            $matchId++;
        }
        
        $dom->clear();
        unset($dom);
        
        $allLinks = array_slice($allLinks, 0, 200);
        
        $this->scrapeDetailsWithoutFilter($allLinks, $day);
    }
    
    private function scrapeDetailsWithoutFilter($links, $day = 'today')
    {
        if (empty($links)) return;
        
        $requests = [];
        foreach ($links as $index => $linkData) {
            $requests[] = new Request('GET', $linkData['url']);
        }
        
        $pool = new Pool($this->client, $requests, [
            'concurrency' => $this->maxConcurrent,
            'fulfilled' => function ($response, $index) use ($links, $day) {
                $this->processResponseWithoutFilter($response, $index, $links, $day);
            },
            'rejected' => function ($reason, $index) {
            }
        ]);
        
        $promise = $pool->promise();
        $promise->wait();
    }
    
    private function processResponseWithoutFilter($response, $index, $links, $day = 'today')
    {
        $html = $response->getBody()->getContents();
        $linkData = $links[$index];
        $matchData = $this->extractMatchData($html, $linkData, false);
        
        if ($matchData) {
            if ($day === 'yesterday') {
                $this->yesterdayResults[] = $matchData;
            } elseif ($day === 'tomorrow') {
                $this->tomorrowResults[] = $matchData;
            } elseif ($day === 'after-tomorrow') {
                $this->afterTomorrowResults[] = $matchData;
            } else {
                $this->results[] = $matchData;
            }
        }
    }
}

$scraper = new CompleteScraper();
$scraper->scrapeAll();
$result = $scraper->saveToJson();

if ($result) {
    exit(0);
} else {
    exit(1);
}

?>