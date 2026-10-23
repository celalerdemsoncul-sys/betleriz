<?php
// Headers'ı ayarla
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Preflight request'i handle et
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Pages API'si JWT koruması gerektirmez - public endpoint

// Response gönder fonksiyonu
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Error response gönder fonksiyonu
function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit();
}

// Debug için basit test
if (isset($_GET['test'])) {
    sendResponse([
        'success' => true,
        'message' => 'API is working',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

function getPages() {
    $pages = [
        [
            'id' => 'privacy-policy',
            'title' => 'Privacy Policy',
            'icon' => 'privacy',
            'url' => '/privacy-policy',
            'order' => 1,
            'active' => true
        ],
        [
            'id' => 'terms-of-service',
            'title' => 'Terms of Service',
            'icon' => 'terms',
            'url' => '/terms-of-service',
            'order' => 2,
            'active' => true
        ]
    ];
    
    sendResponse([
        'success' => true,
        'data' => $pages,
        'message' => 'Pages retrieved successfully'
    ]);
}

// Sayfa içeriğini döndür
function getPageContent($pageId) {
    $pageContents = [
        'privacy-policy' => [
            'title' => 'Privacy Policy',
            'content' => 'PRIVACY POLICY

Last Updated: January 2025

1. INTRODUCTION
SuperBettingTips ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

2. INFORMATION WE COLLECT

2.1 Personal Information:
• Account information (email address, username)
• Device information (device ID, operating system, app version)
• Usage data and analytics
• Payment information (processed securely through third-party providers)
• Communication preferences

2.2 Automatically Collected Information:
• App usage statistics
• Crash reports and performance data
• Device characteristics and settings
• IP address and location data (if permitted)

3. HOW WE USE YOUR INFORMATION

We use your information to:
• Provide and maintain our services
• Process payments and subscriptions
• Send notifications and updates
• Improve app performance and user experience
• Analyze usage patterns and trends
• Provide customer support
• Comply with legal obligations

4. INFORMATION SHARING AND DISCLOSURE

We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

• With your explicit consent
• To comply with legal requirements
• To protect our rights and prevent fraud
• With trusted service providers who assist in app operations
• In case of business transfer or merger

5. DATA SECURITY

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.

6. DATA RETENTION

We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.

7. YOUR RIGHTS

You have the right to:
• Access your personal information
• Correct inaccurate data
• Delete your account and data
• Opt-out of marketing communications
• Withdraw consent at any time

8. CHILDREN\'S PRIVACY

Our app is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take steps to delete the information.

9. THIRD-PARTY SERVICES

Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties.

10. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app.

11. CONTACT US

If you have any questions about this Privacy Policy, please contact us at:
Email: privacy@superbettingtips.com

This Privacy Policy is effective as of January 2025.',
            'lastUpdated' => '2025-01-01'
        ],
        'terms-of-service' => [
            'title' => 'Terms of Service',
            'content' => 'TERMS OF SERVICE

Last Updated: January 2025

1. ACCEPTANCE OF TERMS

By downloading, installing, or using the SuperBettingTips mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.

2. DESCRIPTION OF SERVICE

SuperBettingTips provides sports betting predictions and tips for informational purposes only. Our predictions are based on statistical analysis and expert opinion, but we do not guarantee any specific outcomes.

3. ELIGIBILITY

• You must be at least 18 years old to use this App
• You must be legally permitted to engage in betting activities in your jurisdiction
• You are responsible for ensuring compliance with local laws
• You must provide accurate and complete information when creating an account

4. USER ACCOUNT

• You are responsible for maintaining the confidentiality of your account
• You must notify us immediately of any unauthorized use
• You are responsible for all activities under your account
• We reserve the right to suspend or terminate accounts that violate these Terms

5. ACCEPTABLE USE

You agree NOT to:
• Share your account with others
• Use automated tools to access our services
• Attempt to reverse engineer our algorithms
• Violate any applicable laws or regulations
• Transmit harmful or malicious code
• Interfere with the App\'s functionality
• Use the App for any illegal purposes

6. SUBSCRIPTION AND PAYMENTS

• Subscription fees are charged in advance
• All sales are final - no refunds unless required by law
• We may change subscription prices with 30 days notice
• You can cancel your subscription at any time
• Access to premium features ends upon cancellation

7. DISCLAIMER OF WARRANTIES

THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
• WARRANTIES OF MERCHANTABILITY
• FITNESS FOR A PARTICULAR PURPOSE
• NON-INFRINGEMENT
• ACCURACY OF PREDICTIONS

8. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
• ANY LOSSES INCURRED FROM FOLLOWING OUR PREDICTIONS
• INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES
• LOSS OF PROFITS, DATA, OR USE
• DAMAGES EXCEEDING THE AMOUNT PAID FOR THE SERVICE

9. BETTING RISKS

• Betting involves significant financial risk
• Past performance does not guarantee future results
• You should only bet what you can afford to lose
• We do not provide financial advice
• You are solely responsible for your betting decisions

10. INTELLECTUAL PROPERTY

• The App and its content are protected by copyright and trademark laws
• You may not copy, modify, or distribute our content
• All rights not expressly granted are reserved

11. PRIVACY

Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.

12. TERMINATION

We may terminate or suspend your access to the App at any time, with or without cause, with or without notice.

13. GOVERNING LAW

These Terms are governed by the laws of [Your Jurisdiction] without regard to conflict of law principles.

14. CHANGES TO TERMS

We reserve the right to modify these Terms at any time. We will notify users of significant changes through the App or email.

15. SEVERABILITY

If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.

16. CONTACT INFORMATION

For questions about these Terms, contact us at:
Email: legal@superbettingtips.com

By using the SuperBettingTips App, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.',
            'lastUpdated' => '2025-01-01'
        ]
    ];
    
    if (!isset($pageContents[$pageId])) {
        sendError('Page not found', 404);
        return;
    }
    
    sendResponse([
        'success' => true,
        'data' => $pageContents[$pageId],
        'message' => 'Page content retrieved successfully'
    ]);
}

// API endpoint'ini çalıştır
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'content' && isset($_GET['page_id'])) {
        getPageContent($_GET['page_id']);
    } else {
        getPages();
    }
} else {
    sendError('Method not allowed', 405);
}
?>
