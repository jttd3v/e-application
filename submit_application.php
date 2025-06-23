<?php
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

try {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!$payload) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
        exit;
    }

    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host = getenv('SMTP_HOST');
    $mail->SMTPAuth = true;
    $mail->Username = getenv('SMTP_USER');
    $mail->Password = getenv('SMTP_PASS');
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = getenv('SMTP_PORT') ?: 465;

    $from = getenv('SMTP_USER');
    $mail->setFrom($from, 'CAMII Application');
    $receiver = getenv('APPLICATION_RECEIVER');
    if ($receiver) {
        $mail->addAddress($receiver);
    } else {
        $mail->addAddress($from);
    }

    $mail->isHTML(true);
    $mail->Subject = 'New CAMII Application';

    ob_start();
    echo '<h2>Personal Information</h2>';
    if (!empty($payload['personal'])) {
        echo '<pre>' . htmlspecialchars(print_r($payload['personal'], true)) . '</pre>';
    }
    echo '<h2>Sea Experience</h2>';
    if (!empty($payload['experiences'])) {
        echo '<pre>' . htmlspecialchars(print_r($payload['experiences'], true)) . '</pre>';
    }
    $mail->Body = ob_get_clean();

    $mail->send();

    echo json_encode(['status' => 'ok']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
