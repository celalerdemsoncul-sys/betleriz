<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class SupportApi {
    private $supportData;
    
    public function __construct() {
        // Her sayfa için farklı support bilgileri
        $this->supportData = [
            'daily-sure-tips' => [
                'title' => 'Daily Sure Tips Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '💎 DAILY SURE TIPS - GUARANTEED WINS! 💎

FREE users get basic tips, VIP members get:
🎯 200+ DAILY SURE TIPS (70%+ success rate!)
🎯 EXCLUSIVE FIXED MATCHES (97% win rate!)
🎯 LIVE SCORE MONITORING & ALERTS
🎯 PERSONALIZED BETTING STRATEGIES
🎯 EXPERT ANALYSIS & INSIGHTS

Join 400+ WINNING VIP members making CONSISTENT PROFITS daily!

⚡ START WINNING TODAY! ⚡'
            ],
            'daily-sure' => [
                'title' => 'Daily Sure Tips Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '💎 DAILY SURE TIPS - GUARANTEED WINS! 💎

FREE users get basic tips, VIP members get:
🎯 200+ DAILY SURE TIPS (70%+ success rate!)
🎯 EXCLUSIVE FIXED MATCHES (97% win rate!)
🎯 LIVE SCORE MONITORING & ALERTS
🎯 PERSONALIZED BETTING STRATEGIES
🎯 EXPERT ANALYSIS & INSIGHTS

Join 400+ WINNING VIP members making CONSISTENT PROFITS daily!

⚡ START WINNING TODAY! ⚡'
            ],
            'home' => [
                'title' => 'For Support & More',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Get help with your betting journey'
            ],
            'tips' => [
                'title' => 'Need Help with Tips?',
                'email' => 'superbettingtips@gmail.com',
                'description' => '🚀 FREE TIPS ARE JUST THE BEGINNING! 🚀

You\'re enjoying FREE tips, but VIP members get:
✅ 200+ DAILY HIGH-ODDS TIPS (20+ odds!)
✅ EXCLUSIVE FIXED MATCHES (97% success!)
✅ LIVE SCORE UPDATES & ALERTS
✅ PERSONAL BETTING STRATEGIES

Join 400+ successful VIP members making PROFITS daily!

🔥 LIMITED VIP SLOTS - JOIN NOW! 🔥'
            ],
            'daily' => [
                'title' => 'Daily Tips Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '💎 DAILY SURE TIPS - CONSISTENT WINS! 💎

FREE users get basic tips, VIP members get:
🎯 200+ DAILY SURE TIPS (65%+ success!)
🎯 EXCLUSIVE FIXED MATCHES (97% win rate!)
🎯 LIVE SCORE MONITORING & ALERTS
🎯 PERSONALIZED STRATEGIES

Join 400+ WINNING VIP members making REAL MONEY daily!

⚡ TRANSFORM YOUR BETTING TODAY! ⚡'
            ],
            'football' => [
                'title' => 'Football Tips Help',
                'email' => 'superbettingtips@gmail.com',
                'description' => '⚽ FOOTBALL BETTING MASTERY! ⚽

FREE users get basic tips, VIP members get:
🏆 200+ DAILY FOOTBALL TIPS (All major leagues!)
🏆 EXCLUSIVE FIXED MATCHES (97% success!)
🏆 LIVE MATCH ANALYSIS & UPDATES
🏆 TEAM STATISTICS & INJURY REPORTS

Join 400+ successful VIP members PROFITING daily!

🚀 BECOME A FOOTBALL CHAMPION! 🚀'
            ],
            'over-under' => [
                'title' => 'Over/Under Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '📊 OVER/UNDER BETTING EXPERTISE! 📊

FREE users get basic tips, VIP members get:
🎯 200+ DAILY OVER/UNDER TIPS (All leagues!)
🎯 EXCLUSIVE GOAL STATISTICS & ANALYSIS
🎯 TEAM FORM & INJURY ANALYSIS
🎯 LIVE MATCH MONITORING & ALERTS

Join 400+ WINNING VIP members making MASSIVE PROFITS!

⚡ DOMINATE THE GOALS MARKET! ⚡'
            ],
            'single' => [
                'title' => 'Single Tips Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '🎯 SINGLE BET MASTERY! 🎯

FREE users get basic tips, VIP members get:
💎 200+ DAILY SINGLE BET TIPS (High accuracy!)
💎 EXCLUSIVE ANALYSIS & INSIGHTS
💎 TEAM FORM & STATISTICAL ANALYSIS
💎 LIVE MATCH MONITORING & ALERTS

Join 400+ successful VIP members making CONSISTENT PROFITS!

🚀 BECOME A SINGLE BET CHAMPION! 🚀'
            ],
            'daily-20' => [
                'title' => 'High Odds Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '💰 HIGH ODDS MASTERY! 💰

FREE users get basic tips, VIP members get:
🎯 200+ DAILY HIGH ODDS TIPS (20+ odds!)
🎯 EXCLUSIVE FIXED MATCHES (97% success!)
🎯 ADVANCED ODDS ANALYSIS & INSIGHTS
🎯 LIVE MATCH MONITORING & ALERTS

Join 400+ successful VIP members making MASSIVE PROFITS!

🚀 BECOME A HIGH ODDS CHAMPION! 🚀'
            ],
            'daily-odds' => [
                'title' => 'High Odds Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '💰 HIGH ODDS MASTERY! 💰

FREE users get basic tips, VIP members get:
🎯 200+ DAILY HIGH ODDS TIPS (20+ odds!)
🎯 EXCLUSIVE FIXED MATCHES (97% success!)
🎯 ADVANCED ODDS ANALYSIS & INSIGHTS
🎯 LIVE MATCH MONITORING & ALERTS

Join 400+ successful VIP members making MASSIVE PROFITS!

🚀 BECOME A HIGH ODDS CHAMPION! 🚀'
            ],
            'bonus' => [
                'title' => 'Bonus & Surprise Help',
                'email' => 'superbettingtips@gmail.com',
                'description' => '🎁 BONUS & SURPRISE TIPS! 🎁

FREE users get basic tips, VIP members get:
🎁 200+ DAILY BONUS & SURPRISE TIPS (Exclusive!)
🎁 EXCLUSIVE FIXED BONUS MATCHES (97% success!)
🎁 SPECIAL PROMOTIONAL TIPS & OFFERS
🎁 LIVE BONUS ALERTS & NOTIFICATIONS

Join 400+ successful VIP members making EXTRA PROFITS!

🚀 MAXIMIZE YOUR BONUS EARNINGS! 🚀'
            ],
            'basketball' => [
                'title' => 'Basketball Tips Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '🏀 BASKETBALL BETTING DOMINANCE! 🏀

FREE users get basic tips, VIP members get:
🏆 200+ DAILY BASKETBALL TIPS (NBA, EuroLeague, NCAAB!)
🏆 EXCLUSIVE FIXED MATCHES (97% success!)
🏆 LIVE GAME ANALYSIS & UPDATES
🏆 TEAM STATISTICS & INJURY REPORTS

Join 400+ successful VIP members PROFITING daily!

🚀 BECOME A BASKETBALL CHAMPION! 🚀'
            ],
            'tennis' => [
                'title' => 'Tennis Tips Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => '🎾 TENNIS BETTING EXCELLENCE! 🎾

FREE users get basic tips, VIP members get:
🏆 200+ DAILY TENNIS TIPS (ATP, WTA, Grand Slams!)
🏆 EXCLUSIVE FIXED MATCHES (97% success!)
🏆 LIVE MATCH ANALYSIS & UPDATES
🏆 PLAYER FORM & INJURY REPORTS

Join 400+ successful VIP members PROFITING daily!

🚀 BECOME A TENNIS CHAMPION! 🚀'
            ],
            'special' => [
                'title' => 'VIP Special Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Premium support for VIP members'
            ],
            'fixed' => [
                'title' => 'Fixed VIP Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Exclusive support for Fixed VIP members'
            ],
            'correct-score' => [
                'title' => 'Correct Score Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Help with correct score predictions'
            ],
            'ht-ft' => [
                'title' => 'HT-FT Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Assistance with half-time/full-time tips'
            ],
            'multi-50' => [
                'title' => 'Multi 50+ Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Help with high-value multi bets'
            ],
            'multi-10' => [
                'title' => 'Multi 10+ Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Support for medium-value multi bets'
            ],
            'single-vip' => [
                'title' => 'Single VIP Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Premium support for single VIP tips'
            ],
            'mixed' => [
                'title' => 'Mixed Tips Support',
                'email' => 'superbettingtips@gmail.com',
                'description' => 'Help with mixed betting strategies'
            ],
            'vip-purchase' => [
                'pageTitle' => 'Join VIP & Start Winning!',
                'pageDescription' => '🔥 JOIN VIP & START WINNING! 🔥

✅ 200+ DAILY HIGH-ODDS TIPS (20+ odds!)
✅ EXCLUSIVE FIXED MATCHES (97% success!)
✅ LIVE SCORE UPDATES & ALERTS
✅ PERSONAL BETTING STRATEGIES

🏆 400+ VIP members making PROFITS daily!
🏆 97% SUCCESS RATE on fixed matches!

⚡ DON\'T MISS OUT! ⚡
Join the winning team today!

🔥 UPGRADE TO VIP NOW! 🔥'
            ]
        ];
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                $this->handleGetSupport();
                break;
            default:
                $this->sendError('Method not allowed', 405);
        }
    }
    
    private function handleGetSupport() {
        try {
            $page = $_GET['page'] ?? 'home';
            
            // Sayfa adını temizle ve küçük harfe çevir
            $page = strtolower(trim($page));
            
            // Desteklenen sayfaları kontrol et
            if (!isset($this->supportData[$page])) {
                // Varsayılan olarak home sayfasını kullan
                $page = 'home';
            }
            
            $supportInfo = $this->supportData[$page];
            
            $this->sendResponse([
                'success' => true,
                'data' => $supportInfo,
                'page' => $page,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            error_log("Support API Error: " . $e->getMessage());
            $this->sendError('Internal server error', 500);
        }
    }
    
    private function sendResponse($data) {
        http_response_code(200);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// API'yi çalıştır
$api = new SupportApi();
$api->handleRequest();
?>
