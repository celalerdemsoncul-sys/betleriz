<?php

require_once __DIR__ . '/notification_sender.php';

class NotificationManager
{
    private $notification;
    private $randMin = 1.5;
    private $randMax = 15.0;

    private array $morningMessages = [
        [
            'title' => '🌅 Daily Tips Ready!',
            'body' => 'Good morning everyone! 🌞 Today\'s odds are {{rand}}x in the VIP section. Join us now to start winning! 🎉',
        ],
        [
            'title' => '☀️ Rise & Win!',
            'body' => 'Rise and shine! ☀️ VIP offers today have odds of {{rand}}x! Don\'t miss out on your chance to win big! 💰',
        ],
        [
            'title' => '🚀 Boost Your Luck!',
            'body' => 'Hello there! ☀️ Ready to boost your luck? VIP predictions offer {{rand}}x odds today. Let\'s make it a winning day together! 🚀'
        ],
        [
            'title' => '☕️ Wake Up & Win!',
            'body' => 'Wake up and smell the odds! ☕️ In the VIP section, we\'ve got {{rand}}x odds today. It\'s time to turn your bets into gold! ✨'
        ],
        [
            'title' => '🍀 Lucky Morning!',
            'body' => 'Good morning, bettors! 🌅 Feeling lucky today? Our VIP predictions come with {{rand}}x odds. Let\'s turn those odds in your favor! 🍀'
        ],
        [
            'title' => '🐦 Early Bird Special!',
            'body' => 'Hey, early birds! 🐦 VIP is heating up with {{rand}}x odds today. Join us now for a winning streak! 🏆'
        ],
        [
            'title' => 'Good morning, winners!',
            'body' => 'Rise and conquer! 🌞 Today in the VIP section, odds are {{rand}}x. Join us now and unleash your winning potential! 🚀'
        ],
        [
            'title' => 'Start Your Winning Streak!',
            'body' => 'Hello winners! ☀️ VIP predictions today come with {{rand}}x odds. Let\'s kickstart your winning streak! 🏆'
        ],
        [
            'title' => 'Hello Winners',
            'body' => 'Embrace the magic of the morning! 🌅 VIP offers {{rand}}x odds today. Join us and let\'s create some winning moments! 🌟'
        ],
        [
            'title' => 'Elevate Your Bets!',
            'body' => 'Greetings, betting champions! 🌟 Today in the VIP section, odds are {{rand}}x. Elevate your bets and seize the day! 💰'
        ],
        [
            'title' => 'Start Winning!',
            'body' => 'Dive into the day with confidence! 🌞 VIP predictions offer {{rand}}x odds today. It\'s time to turn your bets into victories! 🏆'
        ],
    ];

    private array $eveningMessages = [
        [
            'title' => '🌆 Evening Victory!',
            'body' => 'Good evening, winners! 🌆 We just hit {{rand}}x in our VIP predictions today! It\'s time to celebrate your incredible victory! 🥳',
        ],
        [
            'title' => '🚀 We Scored Big!',
            'body' => 'Guess what? We\'ve scored {{rand}}x in our VIP bets! Your winnings are soaring high tonight! 🚀',
        ],
        [
            'title' => '💰 Struck Gold!',
            'body' => 'Our VIP predictions struck gold with {{rand}}x odds! Time to cash in on your fantastic success! 💰',
        ],
        [
            'title' => '🌟 Unbelievable Win!',
            'body' => 'You won\'t believe it - {{rand}}x is what we\'ve won with our VIP picks! Your betting journey just got even more exciting! 🌟',
        ],
        [
            'title' => '🏆 Champions Unite!',
            'body' => 'Hello champions! 🏆 It\'s official: {{rand}}x has been conquered in our VIP section! Your victories know no bounds! 🎉',
        ],
        [
            'title' => '✨ Evening Glow!',
            'body' => 'Good evening, bettors! $$ Our VIP predictions have reached {{rand}}x tonight! Get ready to bask in the glow of your winnings! ✨',
        ],
        [
            'title' => '🎥 Lights, Camera, Action!',
            'body' => 'Lights, camera, action! 🎥 Tonight in our VIP section, we\'ve got {{rand}}x odds! Get ready to take center stage and win big! 🏆',
        ],
        [
            'title' => '🔥 On Fire Tonight!',
            'body' => 'Greetings! Our VIP predictions are on fire with {{rand}}x odds tonight. Let\'s make this night one for the record books! 🔥',
        ],
        [
            'title' => '🌠 Night Potential!',
            'body' => 'Unleash the night\'s potential! In our VIP section, we\'ve got {{rand}}x odds waiting for you. Get in and seize the night! 🌠',
        ],
        [
            'title' => '⭐ Evening Champions!',
            'body' => 'Evening champions! 🌟 Our VIP predictions have achieved {{rand}}x odds tonight. Your victories are in the stars! ✨',
        ],
    ];

    public function __construct()
    {
        $this->notification = new Notification();
    }

    public function sendMorningNotification()
    {
        $message = $this->getRandomMessage($this->morningMessages);
        return $this->notification->sendNotificationWithServiceAccount($message);
    }

    public function sendEveningNotification()
    {
        $message = $this->getRandomMessage($this->eveningMessages);
        return $this->notification->sendNotificationWithServiceAccount($message);
    }

    private function getRandomMessage($messages)
    {
        $randomMessage = $messages[array_rand($messages)];
        $randomOdds = number_format(mt_rand($this->randMin * 10, $this->randMax * 10) / 10, 1);
        
        return [
            'title' => $randomMessage['title'],
            'body' => str_replace('{{rand}}', $randomOdds, $randomMessage['body'])
        ];
    }
}