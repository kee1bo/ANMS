<?php
// TEMPORARY legacy router to keep existing ?action= login / register etc. until full migration

require_once __DIR__ . '/../src/includes/db_connect.php';

$action = $_GET['action'] ?? '';
$page   = $_GET['page']   ?? 'dashboard';

if (!isset($_SESSION['user_id'])) {
    switch ($action) {
        case 'login':
            include __DIR__ . '/../src/templates/auth/login.php';
            return;
        case 'register':
            include __DIR__ . '/../src/templates/auth/register.php';
            return;
        default:
            include __DIR__ . '/../src/templates/landing.php';
            return;
    }
}

include __DIR__ . '/../src/templates/partials/header.php';

switch ($page) {
    case 'dashboard':
        include __DIR__ . '/../src/templates/dashboard.php';
        break;
    case 'pets':
        include __DIR__ . '/../src/templates/pets.php';
        break;
    case 'nutrition':
        include __DIR__ . '/../src/templates/nutrition.php';
        break;
    case 'progress':
        include __DIR__ . '/../src/templates/progress.php';
        break;
    case 'education':
        include __DIR__ . '/../src/templates/education.php';
        break;
    case 'settings':
        include __DIR__ . '/../src/templates/settings.php';
        break;
    default:
        include __DIR__ . '/../src/templates/dashboard.php';
        break;
}

include __DIR__ . '/../src/templates/partials/footer.php';
