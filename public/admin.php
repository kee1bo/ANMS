<?php
// Simple admin interface for development
session_start();
require_once __DIR__ . '/../src/includes/db_connect.php';

// Simple password protection for admin
$admin_password = 'admin123';
$is_admin = false;

if (isset($_POST['admin_password'])) {
    if ($_POST['admin_password'] === $admin_password) {
        $_SESSION['is_admin'] = true;
        $is_admin = true;
    } else {
        $error = 'Invalid admin password';
    }
} elseif (isset($_SESSION['is_admin'])) {
    $is_admin = true;
}

if (isset($_GET['logout'])) {
    unset($_SESSION['is_admin']);
    $is_admin = false;
}

// Handle user deletion
if ($is_admin && isset($_GET['delete_user'])) {
    $userId = (int)$_GET['delete_user'];
    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $success = "User deleted successfully";
    } catch (Exception $e) {
        $error = "Failed to delete user: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANMS Admin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .btn { padding: 8px 16px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn-primary { background: #007cba; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 600; }
        .form-group input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .alert { padding: 15px; margin: 15px 0; border-radius: 4px; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; color: #007cba; }
        .stat-label { color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐾 ANMS Admin Panel</h1>
        
        <?php if (!$is_admin): ?>
            <div style="max-width: 400px; margin: 50px auto;">
                <h2>Admin Login</h2>
                <?php if (isset($error)): ?>
                    <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
                <?php endif; ?>
                <form method="POST">
                    <div class="form-group">
                        <label for="admin_password">Admin Password:</label>
                        <input type="password" id="admin_password" name="admin_password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
                <p style="margin-top: 20px; color: #666; font-size: 0.9rem;">
                    <strong>Development Password:</strong> admin123
                </p>
            </div>
        <?php else: ?>
            <div style="text-align: right; margin-bottom: 20px;">
                <a href="index.php" class="btn btn-secondary">← Back to Site</a>
                <a href="?logout=1" class="btn btn-danger">Logout</a>
            </div>
            
            <?php if (isset($success)): ?>
                <div class="alert alert-success"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>
            
            <?php if (isset($error)): ?>
                <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <?php
            // Get statistics
            $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
            $petCount = $pdo->query("SELECT COUNT(*) FROM pets")->fetchColumn();
            $recentUsers = $pdo->query("SELECT COUNT(*) FROM users WHERE created_at > datetime('now', '-7 days')")->fetchColumn();
            ?>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number"><?php echo $userCount; ?></div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo $petCount; ?></div>
                    <div class="stat-label">Total Pets</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number"><?php echo $recentUsers; ?></div>
                    <div class="stat-label">New Users (7 days)</div>
                </div>
            </div>
            
            <h2>User Management</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Created</th>
                        <th>Last Login</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $stmt = $pdo->query("
                        SELECT id, first_name, last_name, email, created_at, last_login, status 
                        FROM users 
                        ORDER BY created_at DESC
                    ");
                    while ($user = $stmt->fetch()):
                    ?>
                    <tr>
                        <td><?php echo $user['id']; ?></td>
                        <td><?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?></td>
                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                        <td><?php echo date('M j, Y', strtotime($user['created_at'])); ?></td>
                        <td><?php echo $user['last_login'] ? date('M j, Y H:i', strtotime($user['last_login'])) : 'Never'; ?></td>
                        <td>
                            <span style="color: <?php echo $user['status'] === 'active' ? 'green' : 'red'; ?>">
                                <?php echo ucfirst($user['status']); ?>
                            </span>
                        </td>
                        <td>
                            <?php if ($user['email'] !== 'test@example.com'): ?>
                                <a href="?delete_user=<?php echo $user['id']; ?>" 
                                   class="btn btn-danger" 
                                   onclick="return confirm('Are you sure you want to delete this user?')">Delete</a>
                            <?php else: ?>
                                <span style="color: #666;">Protected</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
            
            <h2>Recent Activity</h2>
            <table>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Pets</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $stmt = $pdo->query("
                        SELECT u.first_name, u.last_name, u.email, u.created_at,
                               COUNT(p.id) as pet_count
                        FROM users u
                        LEFT JOIN pets p ON u.id = p.user_id
                        GROUP BY u.id
                        ORDER BY u.created_at DESC
                        LIMIT 10
                    ");
                    while ($user = $stmt->fetch()):
                    ?>
                    <tr>
                        <td><?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?></td>
                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                        <td><?php echo $user['pet_count']; ?></td>
                        <td><?php echo date('M j, Y H:i', strtotime($user['created_at'])); ?></td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</body>
</html>