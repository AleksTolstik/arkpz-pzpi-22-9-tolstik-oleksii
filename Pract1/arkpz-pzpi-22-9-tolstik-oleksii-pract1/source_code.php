<?php
// src/App/Customer/CustomerData.php
namespace App\Customer;

class CustomerData {
    const MAX_CONNECTIONS = 100;

    public function getCustomerInfo($id) {
        return "Інформація про користувача з ID: $id";
    }
}
?>

<?php
// src/App/Logger/LoggerInterface.php
namespace App\Logger;

interface LoggerInterface {
    public function log(string $message);
}
?>

<?php
// src/App/Logger/Logger.php
namespace App\Logger;

class Logger implements LoggerInterface {
    public function log(string $message) {
        echo $message;
    }
}
?>

<?php
// src/App/Services/UserService.php
namespace App\Services;

use App\Logger\LoggerInterface;

class UserService {
    private $logger;

    public function __construct(LoggerInterface $logger) {
        $this->logger = $logger;
    }

    public function createUser(string $username) {
        $this->logger->log("User $username created.");
    }
}
?>

<?php
// src/helpers.php
function calculateTotalWithTax(float $productPrice, float $taxRate): float {
    return $productPrice + ($productPrice * $taxRate);
}

function calculateDiscount(float $price, float $discountRate): float {
    return $price - ($price * $discountRate);
}
?>

<?php
// src/config/config.php
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'test_db',
        'user' => 'root',
        'pass' => ''
    ]
];
?>

<?php
// index.php
require_once 'vendor/autoload.php';

use App\Logger\Logger;
use App\Services\UserService;

$config = require 'src/config/config.php';
try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['name']}",
        $config['db']['user'],
        $config['db']['pass']
    );
} catch (PDOException $e) {
    die('Помилка підключення: ' . $e->getMessage());
}

$logger = new Logger();
$userService = new UserService($logger);
$userService->createUser("JohnDoe");

require_once 'src/helpers.php';
$totalCost = calculateTotalWithTax(100, 0.5);
echo "Загальна вартість з податком: " . $totalCost;
echo "Ціна зі знижкою: " . calculateDiscount(100, 0.2);
?>