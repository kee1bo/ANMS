# Design Document

## Overview

The modernized Animal Nutrition Management System (ANMS) will be built as a progressive web application using a modern PHP backend with MySQL database, enhanced with contemporary frontend technologies. The system architecture follows a modular, scalable design pattern that supports both current requirements and future expansion.

The design emphasizes user experience through responsive design, real-time interactions, and intelligent automation while maintaining the scientific rigor required for animal nutrition management. The system will serve multiple user types including pet owners, veterinarians, and animal care professionals with role-based access and specialized features.

## Architecture

### System Architecture Overview

The ANMS follows a three-tier architecture pattern:

1. **Presentation Layer**: Modern responsive web interface with progressive enhancement
2. **Application Layer**: PHP-based business logic with RESTful API endpoints
3. **Data Layer**: MySQL database with optimized schema and caching layer

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile App]  // There is no mobile app, basically it has to be also optimized for mobile phones, the design and interactions. 
        C[PWA]
    end
    
    subgraph "Application Layer"
        D[PHP Application Server]
        E[API Gateway]
        F[Authentication Service]
        G[Nutrition Engine]
        H[Notification Service]
    end
    
    subgraph "Data Layer"
        I[MySQL Database]
        J[Redis Cache]
        K[File Storage]
    end
    
    subgraph "External Services"
        L[Email Service]
        M[SMS Service]
        N[IoT Device APIs]
    end
    
    A --> E
    B --> E
    C --> E
    E --> D
    D --> F
    D --> G
    D --> H
    D --> I
    D --> J
    D --> K
    H --> L
    H --> M
    G --> N
```

### Technology Stack

**Frontend Technologies:**
- HTML5 with semantic markup
- CSS3 with custom properties and modern layout techniques
- Vanilla JavaScript with ES6+ features
- Progressive Web App capabilities
- Service Workers for offline functionality

**Backend Technologies:**
- PHP 8.2+ with modern features and type declarations
- Composer for dependency management
- PSR-4 autoloading and PSR-12 coding standards
- RESTful API design with JSON responses

**Database and Storage:**
- MySQL 8.0+ with InnoDB engine
- Redis for session management and caching
- File system storage for images with CDN integration
- Database migrations and seeding system

**Development and Deployment:**
- Docker containerization for consistent environments
- Git version control with feature branch workflow
- Automated testing with PHPUnit
- CI/CD pipeline for deployment automation

## Components and Interfaces

### Core Application Components

#### 1. User Management System

**Purpose**: Handle user authentication, authorization, and profile management

**Key Features:**
- Secure user registration and login
- Role-based access control (Pet Owner, Veterinarian, Admin)
- Profile management with preferences
- Password reset and account recovery
- Two-factor authentication support

**Interfaces:**
```php
interface UserServiceInterface
{
    public function authenticate(string $email, string $password): ?User;
    public function register(UserRegistrationData $data): User;
    public function updateProfile(int $userId, UserProfileData $data): User;
    public function resetPassword(string $email): bool;
    public function enableTwoFactor(int $userId): string;
}
```

#### 2. Pet Profile Management

**Purpose**: Comprehensive pet information management with health tracking

**Key Features:**
- Detailed pet profiles with photos
- Health history and medical records
- Weight and body condition tracking
- Activity level monitoring
- Behavioral trait documentation

**Interfaces:**
```php
interface PetServiceInterface
{
    public function createPet(int $userId, PetData $data): Pet;
    public function updatePet(int $petId, PetData $data): Pet;
    public function getPetsByUser(int $userId): array;
    public function logHealthMetric(int $petId, HealthMetric $metric): void;
    public function getHealthHistory(int $petId, DateRange $range): array;
}
```

#### 3. Nutrition Planning Engine

**Purpose**: Generate scientifically-based nutrition plans using advanced algorithms

**Key Features:**
- Species-specific nutritional calculations
- Age and life stage considerations
- Activity level adjustments
- Health condition modifications
- Food recommendation system

**Interfaces:**
```php
interface NutritionEngineInterface
{
    public function calculateDailyNeeds(Pet $pet): NutritionalRequirements;
    public function generateMealPlan(Pet $pet, array $preferences): MealPlan;
    public function suggestFoodOptions(NutritionalRequirements $needs): array;
    public function validateNutrition(MealPlan $plan): ValidationResult;
    public function adjustForHealthConditions(Pet $pet, MealPlan $plan): MealPlan;
}
```

#### 4. Health Monitoring System

**Purpose**: Track and analyze pet health metrics over time

**Key Features:**
- Weight tracking with trend analysis
- Body condition scoring
- Activity monitoring integration
- Health alert system
- Progress reporting

**Interfaces:**
```php
interface HealthMonitorInterface
{
    public function recordWeight(int $petId, float $weight, DateTime $date): void;
    public function calculateTrends(int $petId, string $metric): TrendAnalysis;
    public function generateHealthReport(int $petId, DateRange $range): HealthReport;
    public function checkHealthAlerts(Pet $pet): array;
    public function setHealthGoals(int $petId, array $goals): void;
}
```

#### 5. Educational Content System

**Purpose**: Provide curated, science-based educational resources

**Key Features:**
- Species-specific care guides
- Nutrition education articles
- Interactive learning modules
- Personalized content recommendations
- Expert-reviewed information

**Interfaces:**
```php
interface EducationServiceInterface
{
    public function getContentByCategory(string $category): array;
    public function getPersonalizedContent(Pet $pet): array;
    public function searchContent(string $query): array;
    public function trackContentEngagement(int $userId, int $contentId): void;
    public function getRecommendedContent(int $userId): array;
}
```

### Frontend Component Architecture

#### 1. Dashboard Components

**Main Dashboard:**
- Welcome banner with personalized greeting
- Pet overview cards with quick stats
- Recent activity timeline
- Quick action buttons
- Health alerts and notifications

**Pet Management Dashboard:**
- Pet profile cards with photos
- Health status indicators
- Quick access to nutrition plans
- Add/edit pet functionality
- Search and filter capabilities

#### 2. Nutrition Planning Interface

**Plan Generation:**
- Step-by-step pet information input
- Real-time calculation display
- Interactive meal planning calendar
- Portion size calculators
- Food substitution suggestions

**Plan Management:**
- Daily feeding schedules
- Meal tracking checkboxes
- Progress monitoring charts
- Plan adjustment tools
- Sharing capabilities

#### 3. Health Tracking Interface

**Data Entry:**
- Weight logging with date picker
- Body condition assessment tools
- Activity level tracking
- Health observation notes
- Photo documentation

**Analytics Dashboard:**
- Interactive weight charts
- Trend analysis graphs
- Goal progress indicators
- Health milestone tracking
- Comparative analysis tools

## Data Models

### Core Entity Models

#### User Model
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('pet_owner', 'veterinarian', 'admin') DEFAULT 'pet_owner',
    location VARCHAR(255),
    phone VARCHAR(20),
    email_verified_at TIMESTAMP NULL,
    two_factor_secret VARCHAR(255) NULL,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

#### Pet Model
```sql
CREATE TABLE pets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    species ENUM('dog', 'cat', 'rabbit', 'bird', 'other') NOT NULL,
    breed VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown',
    is_neutered BOOLEAN DEFAULT FALSE,
    microchip_id VARCHAR(50),
    current_weight DECIMAL(5,2),
    ideal_weight DECIMAL(5,2),
    activity_level ENUM('low', 'moderate', 'high') DEFAULT 'moderate',
    body_condition_score TINYINT CHECK (body_condition_score BETWEEN 1 AND 9),
    health_conditions JSON,
    allergies JSON,
    medications JSON,
    personality_traits JSON,
    photo_url VARCHAR(500),
    veterinarian_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinarian_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Nutrition Plan Model
```sql
CREATE TABLE nutrition_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id BIGINT NOT NULL,
    plan_name VARCHAR(200) NOT NULL,
    daily_calories INT NOT NULL,
    daily_protein_grams DECIMAL(6,2),
    daily_fat_grams DECIMAL(6,2),
    daily_carb_grams DECIMAL(6,2),
    daily_fiber_grams DECIMAL(6,2),
    meals_per_day TINYINT DEFAULT 2,
    feeding_schedule JSON,
    food_recommendations JSON,
    special_instructions TEXT,
    created_by_user_id BIGINT NOT NULL,
    veterinarian_approved BOOLEAN DEFAULT FALSE,
    approved_by_user_id BIGINT NULL,
    approved_at TIMESTAMP NULL,
    active_from DATE NOT NULL,
    active_until DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
);
```

#### Health Records Model
```sql
CREATE TABLE health_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id BIGINT NOT NULL,
    record_type ENUM('weight', 'body_condition', 'activity', 'health_note', 'medication', 'vet_visit') NOT NULL,
    recorded_date DATE NOT NULL,
    recorded_time TIME NULL,
    numeric_value DECIMAL(10,3) NULL,
    text_value TEXT NULL,
    json_data JSON NULL,
    recorded_by_user_id BIGINT NOT NULL,
    veterinarian_verified BOOLEAN DEFAULT FALSE,
    verified_by_user_id BIGINT NULL,
    verified_at TIMESTAMP NULL,
    attachments JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id),
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id),
    INDEX idx_pet_date (pet_id, recorded_date),
    INDEX idx_record_type (record_type)
);
```

### Nutritional Database Models

#### Food Database Model
```sql
CREATE TABLE food_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    category ENUM('dry_kibble', 'wet_food', 'raw_food', 'treats', 'supplements') NOT NULL,
    target_species SET('dog', 'cat', 'rabbit', 'bird') NOT NULL,
    life_stage SET('puppy', 'adult', 'senior', 'kitten', 'all_life_stages') NOT NULL,
    calories_per_100g INT NOT NULL,
    protein_percentage DECIMAL(5,2),
    fat_percentage DECIMAL(5,2),
    fiber_percentage DECIMAL(5,2),
    moisture_percentage DECIMAL(5,2),
    ash_percentage DECIMAL(5,2),
    carbohydrate_percentage DECIMAL(5,2),
    detailed_nutrition JSON,
    ingredients TEXT,
    feeding_guidelines JSON,
    aafco_approved BOOLEAN DEFAULT FALSE,
    organic_certified BOOLEAN DEFAULT FALSE,
    grain_free BOOLEAN DEFAULT FALSE,
    allergen_info JSON,
    price_per_unit DECIMAL(8,2),
    unit_size VARCHAR(50),
    availability_status ENUM('available', 'limited', 'discontinued') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_species_category (target_species, category),
    INDEX idx_life_stage (life_stage),
    FULLTEXT idx_name_brand (name, brand)
);
```

## Error Handling

### Error Classification System

**1. User Input Errors (400-level)**
- Invalid form data
- Missing required fields
- Data format violations
- Business rule violations

**2. Authentication/Authorization Errors (401/403)**
- Invalid credentials
- Expired sessions
- Insufficient permissions
- Account lockouts

**3. System Errors (500-level)**
- Database connection failures
- External service unavailability
- File system errors
- Unexpected exceptions

### Error Response Format

```json
{
    "success": false,
    "error": {
        "code": "INVALID_PET_DATA",
        "message": "Pet weight must be a positive number",
        "details": {
            "field": "weight",
            "value": "-5.2",
            "constraint": "minimum_value"
        },
        "timestamp": "2024-06-15T10:30:00Z",
        "request_id": "req_abc123"
    }
}
```

### Error Handling Strategy

**Frontend Error Handling:**
- Graceful degradation for network failures
- User-friendly error messages
- Retry mechanisms for transient failures
- Offline mode for core functionality

**Backend Error Handling:**
- Comprehensive logging with context
- Error categorization and routing
- Automatic error reporting for critical issues
- Circuit breaker pattern for external services

## Testing Strategy

### Testing Pyramid Approach

**1. Unit Tests (70%)**
- Individual function testing
- Business logic validation
- Data model testing
- Utility function verification

**2. Integration Tests (20%)**
- Database interaction testing
- API endpoint testing
- Service integration testing
- External service mocking

**3. End-to-End Tests (10%)**
- User journey testing
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarking

### Testing Tools and Frameworks

**Backend Testing:**
- PHPUnit for unit and integration tests
- Mockery for test doubles
- Database testing with transactions
- API testing with HTTP clients

**Frontend Testing:**
- Jest for JavaScript unit tests
- Cypress for end-to-end testing
- Lighthouse for performance testing
- Accessibility testing with axe-core

### Test Data Management

**Test Database Strategy:**
- Separate test database instances
- Database seeding for consistent test data
- Transaction rollback for test isolation
- Factory patterns for test data generation

**Mock Data Services:**
- External API mocking
- File system mocking
- Email service mocking
- Time-based testing utilities

## Security Considerations

### Authentication and Authorization

**Multi-Factor Authentication:**
- TOTP-based 2FA implementation
- SMS backup codes
- Recovery key generation
- Biometric authentication support (future)

**Session Management:**
- Secure session storage with Redis
- Session timeout and renewal
- Concurrent session limiting
- Device tracking and management

### Data Protection

**Encryption Standards:**
- AES-256 for data at rest
- TLS 1.3 for data in transit
- Bcrypt for password hashing
- Key rotation policies

**Privacy Controls:**
- GDPR compliance features
- Data anonymization tools
- User consent management
- Data retention policies

### Security Monitoring

**Threat Detection:**
- Failed login attempt monitoring
- Unusual access pattern detection
- SQL injection prevention
- XSS protection mechanisms

**Audit Logging:**
- User action logging
- Administrative action tracking
- Data access logging
- Security event monitoring

## Performance Optimization

### Database Optimization

**Query Optimization:**
- Proper indexing strategy
- Query execution plan analysis
- N+1 query prevention
- Database connection pooling

**Caching Strategy:**
- Redis for session and application caching
- Query result caching
- Static asset caching
- CDN integration for media files

### Frontend Performance

**Asset Optimization:**
- CSS and JavaScript minification
- Image optimization and lazy loading
- Critical CSS inlining
- Progressive image loading

**Runtime Performance:**
- Virtual scrolling for large lists
- Debounced search inputs
- Optimistic UI updates
- Service worker caching

### Scalability Considerations

**Horizontal Scaling:**
- Load balancer configuration
- Database read replicas
- Microservice architecture preparation
- Container orchestration readiness

**Monitoring and Metrics:**
- Application performance monitoring
- Database performance tracking
- User experience metrics
- Error rate monitoring

This comprehensive design provides the foundation for building a modern, scalable, and user-friendly Animal Nutrition Management System that meets all specified requirements while maintaining flexibility for future enhancements.