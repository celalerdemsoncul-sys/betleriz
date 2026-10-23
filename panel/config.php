<?php

require_once dirname(__DIR__) . '/EnvLoader.php';
EnvLoader::load(dirname(__DIR__) . '/.env');

return [
    'google_play' => [
        'package_name' => EnvLoader::get('GOOGLE_PLAY_PACKAGE_NAME', 'com.betleriz.app'),
        'service_account_key' => EnvLoader::path(
            'PANEL_GOOGLE_PLAY_SA_JSON',
            'panel/configs/google-play-service-account.json',
        ),
    ],
    'webhook' => [
        'secret_token' => EnvLoader::get('WEBHOOK_SECRET_TOKEN', ''),
    ],
    'football_api' => [
        'key' => EnvLoader::get('FOOTBALL_API_KEY', ''),
        'base_url' => EnvLoader::get('FOOTBALL_API_BASE_URL', 'https://v3.football.api-sports.io'),
        'rate_limit' => 0.1,
        'cache_ttl' => [
            'fixtures' => 600,
            'predictions' => 3600,
            'odds' => 300,
            'standings' => 3600,
            'leagues' => 86400,
            'teams' => 86400,
        ],
    ],
    'is_production' => EnvLoader::bool('PANEL_IS_PRODUCTION', false),
    'debug' => EnvLoader::bool('PANEL_DEBUG', true),
    'log_level' => EnvLoader::get('PANEL_LOG_LEVEL', 'debug'),
];
