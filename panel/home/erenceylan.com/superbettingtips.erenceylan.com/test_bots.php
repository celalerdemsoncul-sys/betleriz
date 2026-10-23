<?php
require_once __DIR__ . '/libraries/Bot.php';
require_once __DIR__ . '/vendor/autoload.php';

$jar = new \GuzzleHttp\Cookie\CookieJar;
$client = new \GuzzleHttp\Client([
    'cookies' => $jar,
    'verify' => false,
    'timeout' => 30,
    'connect_timeout' => 10,
    'headers' => [
        'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language' => 'en-US,en;q=0.9',
        'accept-encoding' => 'gzip, deflate, br',
        'cache-control' => 'no-cache',
        'pragma' => 'no-cache'
    ]
]);

$bot = new Bot($client, $jar);

// Test edilecek bot metodları
$methods = [
    'betstudy' => 'BetStudy - Ana Sayfa',
    'betstudyComputer' => 'BetStudy - Computer Predictions',
    'sportytrader' => 'SportyTrader',
    'betstudyPredictions' => 'BetStudy - Predictions',
    'betstudyOverUnder' => 'BetStudy - Over/Under',
    'mybets' => 'MyBets - Ana Sayfa',
    'mybetsUnderOver' => 'MyBets - Under/Over',
    'mybetsCorrectScore' => 'MyBets - Correct Score',
    'mybetsHtFt' => 'MyBets - HT/FT',
    'tipsbetting' => 'TipsBetting',
    'tipsbet' => 'TipsBet',
    'vitibet' => 'VitiBet',
    'bettipsfootball' => 'BetTipsFootball',
    'tipSoccer' => 'TipSoccer'
];

?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bot Test Ekranı - SuperBettingTips</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .controls {
            padding: 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-right: 15px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .status {
            padding: 30px;
        }
        
        .bot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .bot-card {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .bot-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }
        
        .bot-card.running {
            border-color: #ffc107;
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        }
        
        .bot-card.success {
            border-color: #28a745;
            background: linear-gradient(135deg, #d4edda 0%, #a8e6cf 100%);
        }
        
        .bot-card.error {
            border-color: #dc3545;
            background: linear-gradient(135deg, #f8d7da 0%, #fab1a0 100%);
        }
        
        .bot-name {
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .bot-description {
            color: #6c757d;
            margin-bottom: 15px;
            font-size: 0.9rem;
        }
        
        .bot-status {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .status-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .status-icon.waiting {
            background: #6c757d;
        }
        
        .status-icon.running {
            background: #ffc107;
            animation: pulse 1.5s infinite;
        }
        
        .status-icon.success {
            background: #28a745;
        }
        
        .status-icon.error {
            background: #dc3545;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .bot-info {
            font-size: 0.9rem;
            color: #495057;
        }
        
        .bot-info strong {
            color: #2c3e50;
        }
        
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .summary h3 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .stat-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .stat-label {
            color: #6c757d;
            font-size: 0.9rem;
        }
        
        .log {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .log-entry {
            margin-bottom: 5px;
            padding: 5px 0;
        }
        
        .log-entry.success {
            color: #2ecc71;
        }
        
        .log-entry.error {
            color: #e74c3c;
        }
        
        .log-entry.info {
            color: #3498db;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Bot Test Ekranı</h1>
            <p>SuperBettingTips - Canlı Bot Test ve İzleme Sistemi</p>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="startTest()" id="startBtn">🚀 Test Başlat</button>
            <button class="btn" onclick="stopTest()" id="stopBtn" disabled>⏹️ Durdur</button>
            <button class="btn" onclick="clearLog()">🗑️ Log Temizle</button>
        </div>
        
        <div class="status">
            <div class="summary">
                <h3>📊 Test Özeti</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-number" id="totalBots"><?php echo count($methods); ?></div>
                        <div class="stat-label">Toplam Bot</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="successBots">0</div>
                        <div class="stat-label">Başarılı</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="errorBots">0</div>
                        <div class="stat-label">Hatalı</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="totalData">0</div>
                        <div class="stat-label">Toplam Veri</div>
                    </div>
                </div>
            </div>
            
            <div class="bot-grid" id="botGrid">
                <?php foreach ($methods as $method => $description): ?>
                <div class="bot-card" id="bot-<?php echo $method; ?>">
                    <div class="bot-name"><?php echo $description; ?></div>
                    <div class="bot-description">Method: <?php echo $method; ?></div>
                    <div class="bot-status">
                        <div class="status-icon waiting"></div>
                        <span class="status-text">Bekliyor</span>
                    </div>
                    <div class="bot-info">
                        <div><strong>Durum:</strong> <span class="status-detail">Hazır</span></div>
                        <div><strong>Veri Sayısı:</strong> <span class="data-count">-</span></div>
                        <div><strong>Süre:</strong> <span class="duration">-</span></div>
                        <div><strong>Hata:</strong> <span class="error-message">-</span></div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            
            <div class="log" id="logContainer">
                <div class="log-entry info">Sistem hazır. Test başlatmak için "Test Başlat" butonuna tıklayın.</div>
            </div>
        </div>
    </div>

    <script>
        let isRunning = false;
        let testStartTime = null;
        
        function addLog(message, type = 'info') {
            const logContainer = document.getElementById('logContainer');
            const timestamp = new Date().toLocaleTimeString('tr-TR');
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.textContent = `[${timestamp}] ${message}`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
        
        function updateBotStatus(botId, status, data = {}) {
            const botCard = document.getElementById(`bot-${botId}`);
            const statusIcon = botCard.querySelector('.status-icon');
            const statusText = botCard.querySelector('.status-text');
            const statusDetail = botCard.querySelector('.status-detail');
            const dataCount = botCard.querySelector('.data-count');
            const duration = botCard.querySelector('.duration');
            const errorMessage = botCard.querySelector('.error-message');
            
            // Kart rengini güncelle
            botCard.className = `bot-card ${status}`;
            
            // Status icon güncelle
            statusIcon.className = `status-icon ${status}`;
            
            // Status text güncelle
            const statusTexts = {
                'waiting': 'Bekliyor',
                'running': 'Çalışıyor...',
                'success': 'Başarılı',
                'error': 'Hata'
            };
            statusText.textContent = statusTexts[status] || 'Bilinmiyor';
            
            // Detayları güncelle
            if (data.detail) statusDetail.textContent = data.detail;
            if (data.count !== undefined) dataCount.textContent = data.count;
            if (data.duration) duration.textContent = data.duration;
            if (data.error) errorMessage.textContent = data.error;
        }
        
        function updateSummary() {
            const totalBots = document.querySelectorAll('.bot-card').length;
            const successBots = document.querySelectorAll('.bot-card.success').length;
            const errorBots = document.querySelectorAll('.bot-card.error').length;
            
            let totalData = 0;
            document.querySelectorAll('.data-count').forEach(el => {
                const count = parseInt(el.textContent);
                if (!isNaN(count)) totalData += count;
            });
            
            document.getElementById('successBots').textContent = successBots;
            document.getElementById('errorBots').textContent = errorBots;
            document.getElementById('totalData').textContent = totalData;
        }
        
        async function startTest() {
            if (isRunning) return;
            
            isRunning = true;
            testStartTime = Date.now();
            
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            
            addLog('Test başlatılıyor...', 'info');
            
            // Tüm botları bekliyor durumuna getir
            <?php foreach ($methods as $method => $description): ?>
            updateBotStatus('<?php echo $method; ?>', 'waiting', {
                detail: 'Hazır',
                count: '-',
                duration: '-',
                error: '-'
            });
            <?php endforeach; ?>
            
            updateSummary();
            
            // Botları sırayla çalıştır
            const methods = <?php echo json_encode(array_keys($methods)); ?>;
            
            for (let i = 0; i < methods.length; i++) {
                if (!isRunning) break;
                
                const method = methods[i];
                const startTime = Date.now();
                
                updateBotStatus(method, 'running', {
                    detail: 'Veri çekiliyor...',
                    duration: '0s'
                });
                
                addLog(`${method} botu başlatılıyor...`, 'info');
                
                try {
                    const response = await fetch('test_bot_single.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ method: method })
                    });
                    
                    const result = await response.json();
                    const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
                    
                    if (result.success) {
                        updateBotStatus(method, 'success', {
                            detail: 'Veri çekildi',
                            count: result.dataCount,
                            duration: duration,
                            error: '-'
                        });
                        addLog(`${method} başarılı - ${result.dataCount} veri çekildi (${duration})`, 'success');
                    } else {
                        updateBotStatus(method, 'error', {
                            detail: 'Hata oluştu',
                            count: '0',
                            duration: duration,
                            error: result.error
                        });
                        addLog(`${method} hata - ${result.error}`, 'error');
                    }
                } catch (error) {
                    const duration = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
                    updateBotStatus(method, 'error', {
                        detail: 'Bağlantı hatası',
                        count: '0',
                        duration: duration,
                        error: error.message
                    });
                    addLog(`${method} bağlantı hatası - ${error.message}`, 'error');
                }
                
                updateSummary();
                
                // Botlar arası bekleme
                if (i < methods.length - 1) {
                    addLog('Sonraki bot için bekleniyor...', 'info');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            const totalTime = ((Date.now() - testStartTime) / 1000).toFixed(1);
            addLog(`Test tamamlandı! Toplam süre: ${totalTime}s`, 'success');
            
            isRunning = false;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
        }
        
        function stopTest() {
            isRunning = false;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
            addLog('Test durduruldu', 'info');
        }
        
        function clearLog() {
            document.getElementById('logContainer').innerHTML = '';
            addLog('Log temizlendi', 'info');
        }
    </script>
</body>
</html>
