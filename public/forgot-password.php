<?php
session_start();
require_once __DIR__ . '/../src/includes/db_connect.php';

$message = '';
$error = '';

if ($_POST) {
    $email = trim($_POST['email'] ?? '');
    
    if (empty($email)) {
        $error = 'Please enter your email address';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address';
    } else {
        try {
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id, first_name FROM users WHERE email = ? AND status = 'active'");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if ($user) {
                // In a real application, you would:
                // 1. Generate a secure reset token
                // 2. Store it in the database with expiration
                // 3. Send an email with the reset link
                
                // For demo purposes, we'll just show a message
                $message = "If an account with that email exists, we've sent password reset instructions to $email. For demo purposes, the reset functionality is not fully implemented.";
            } else {
                // Don't reveal if email exists or not for security
                $message = "If an account with that email exists, we've sent password reset instructions to $email.";
            }
        } catch (PDOException $e) {
            error_log("Password reset error: " . $e->getMessage());
            $error = 'An error occurred. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - ANMS</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, var(--blue-600), var(--indigo-600));
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .forgot-container {
            background: white;
            border-radius: var(--radius-2xl);
            padding: var(--space-8);
            box-shadow: var(--shadow-2xl);
            width: 100%;
            max-width: 400px;
        }
        
        .forgot-header {
            text-align: center;
            margin-bottom: var(--space-8);
        }
        
        .forgot-header h1 {
            color: var(--gray-900);
            font-size: 1.875rem;
            font-weight: 700;
            margin-bottom: var(--space-2);
        }
        
        .forgot-header p {
            color: var(--gray-600);
        }
        
        .form-group {
            margin-bottom: var(--space-4);
        }
        
        .form-group label {
            display: block;
            margin-bottom: var(--space-2);
            font-weight: 600;
            color: var(--gray-900);
        }
        
        .form-group input {
            width: 100%;
            padding: 12px var(--space-4);
            border: 2px solid var(--gray-200);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            box-sizing: border-box;
            transition: border-color 0.2s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: var(--blue-600);
        }
        
        .btn-full {
            width: 100%;
            justify-content: center;
            margin-top: var(--space-4);
        }
        
        .error {
            background: #fee2e2;
            color: #dc2626;
            padding: var(--space-3);
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-4);
            text-align: center;
        }
        
        .success {
            background: #d1fae5;
            color: #065f46;
            padding: var(--space-4);
            border-radius: var(--radius-lg);
            margin-bottom: var(--space-4);
            text-align: center;
            line-height: 1.5;
        }
        
        .auth-links {
            text-align: center;
            margin-top: var(--space-6);
            padding-top: var(--space-4);
            border-top: 1px solid var(--gray-200);
        }
        
        .auth-links a {
            color: var(--blue-600);
            text-decoration: none;
            font-weight: 500;
            margin: 0 var(--space-2);
        }
        
        .auth-links a:hover {
            text-decoration: underline;
        }
        
        .back-link {
            text-align: center;
            margin-top: var(--space-4);
        }
        
        .back-link a {
            color: var(--gray-600);
            text-decoration: none;
            font-size: 0.875rem;
        }
        
        .back-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="forgot-container">
        <div class="forgot-header">
            <h1>Reset Password</h1>
            <p>Enter your email to receive reset instructions</p>
        </div>
        
        <?php if ($error): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($message): ?>
            <div class="success"><?php echo htmlspecialchars($message); ?></div>
        <?php else: ?>
            <form method="POST">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" required>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Send Reset Instructions</button>
            </form>
        <?php endif; ?>
        
        <div class="auth-links">
            <a href="login.php">Back to Login</a>
            <a href="register.php">Create Account</a>
        </div>
        
        <div class="back-link">
            <a href="index.php">← Back to Home</a>
        </div>
    </div>
</body>
</html>