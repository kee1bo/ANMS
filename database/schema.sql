-- ANMS Database Schema - MySQL Version
-- Version 1.0
--
-- This script creates the necessary tables for the Animal Nutrition Management System.

--
-- Drop tables in correct order (reverse dependency)
--
DROP TABLE IF EXISTS `diet_plan_recommendations`;
DROP TABLE IF EXISTS `diet_plans`;
DROP TABLE IF EXISTS `pets`;
DROP TABLE IF EXISTS `users`;

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `member_since` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `pets`
--
CREATE TABLE `pets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `species` varchar(100) NOT NULL,
  `breed` varchar(100) DEFAULT NULL,
  `age` int(3) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `ideal_weight` decimal(5,2) DEFAULT NULL,
  `activity_level` enum('Low','Medium','High') NOT NULL,
  `health_status` varchar(255) DEFAULT 'Healthy',
  `last_weighed_date` date DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `personality` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `pets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `diet_plans`
--
CREATE TABLE `diet_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pet_id` int(11) NOT NULL,
  `daily_calories` int(11) NOT NULL,
  `meals_per_day` int(2) NOT NULL,
  `protein_percentage` decimal(5,2) DEFAULT NULL,
  `fat_percentage` decimal(5,2) DEFAULT NULL,
  `fiber_percentage` decimal(5,2) DEFAULT NULL,
  `moisture_percentage` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pet_id` (`pet_id`),
  CONSTRAINT `diet_plans_ibfk_1` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `diet_plan_recommendations`
--
CREATE TABLE `diet_plan_recommendations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `diet_plan_id` int(11) NOT NULL,
  `time` varchar(50) NOT NULL,
  `meal` varchar(100) NOT NULL,
  `food` varchar(255) NOT NULL,
  `portion` varchar(100) NOT NULL,
  `calories` int(11) DEFAULT NULL,
  `tips` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `diet_plan_id` (`diet_plan_id`),
  CONSTRAINT `diet_plan_recommendations_ibfk_1` FOREIGN KEY (`diet_plan_id`) REFERENCES `diet_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert a default user for testing (password is 'password')
INSERT INTO `users` (`name`, `email`, `password`, `location`) 
VALUES ('Test User', 'test@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Location');

-- Insert sample pets for testing
INSERT INTO `pets` (`user_id`, `name`, `species`, `breed`, `age`, `weight`, `ideal_weight`, `activity_level`, `health_status`, `photo`, `personality`) 
VALUES 
(1, 'Buddy', 'Dog', 'Golden Retriever', 3, 25.5, 24.0, 'Medium', 'Healthy', '🐕', 'Friendly and energetic'),
(1, 'Whiskers', 'Cat', 'Persian', 2, 4.2, 4.0, 'Low', 'Healthy', '🐱', 'Calm and loves to sleep');

