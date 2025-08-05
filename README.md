# Animal Nutrition Management System (ANMS)

A comprehensive, modern web-based platform for managing pet nutrition, health tracking, and veterinary care. Built with PHP 8.2+, MySQL, and modern web technologies following Domain-Driven Design principles.

## 🚀 Features

### ✅ Implemented
- **Modern PHP Architecture**: Built with PHP 8.2+ using Domain-Driven Design
- **Comprehensive Database Schema**: Advanced relational database with proper indexing
- **User Management**: JWT-based authentication with role-based access control
- **Pet Profile Management**: Complete pet information with health tracking
- **Repository Pattern**: Clean separation of concerns with interfaces
- **Testing Framework**: PHPUnit with comprehensive test coverage
- **Docker Environment**: Containerized development setup
- **Code Quality**: PHPStan, CodeSniffer, and automated testing

### 🔄 In Progress
- RESTful API endpoints
- Frontend user interface
- Nutrition planning engine
- Health monitoring system

### ⏳ Planned
- Educational content management
- Professional collaboration tools
- Mobile optimization
- Advanced analytics

## 🏗️ Architecture

The system follows a three-tier architecture:

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│     (Web Interface, API Routes)     │
├─────────────────────────────────────┤
│           Application Layer         │
│    (Services, Business Logic)      │
├─────────────────────────────────────┤
│            Domain Layer             │
│     (Entities, Value Objects)      │
├─────────────────────────────────────┤
│         Infrastructure Layer        │
│  (Database, External Services)     │
└─────────────────────────────────────┘
```

## 🛠️ Technology Stack

- **Backend**: PHP 8.2+, MySQL 8.0, Redis
- **Framework**: Custom lightweight framework with DI container
- **Authentication**: JWT with refresh tokens
- **Testing**: PHPUnit, Mockery
- **Quality**: PHPStan (Level 8), PHP CodeSniffer (PSR-12)
- **DevOps**: Docker, Docker Compose, Nginx
- **Frontend**: Modern HTML5, CSS3, Vanilla JavaScript (ES6+)

## 📦 Installation

### Prerequisites
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd anms
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

4. **Install dependencies**
   ```bash
   docker-compose exec app composer install
   ```

5. **Run database migrations**
   ```bash
   docker-compose exec app php database/migrate.php
   ```

6. **Seed the database**
   ```bash
   docker-compose exec app php database/seed.php
   ```

7. **Access the application**
   - Main application: http://localhost:8080
   - phpMyAdmin: http://localhost:8081

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
composer test

# Run tests with coverage
composer test-coverage

# Run code quality checks
composer cs-check
composer analyse
```

## 📊 Database Schema

The system includes comprehensive tables for:

- **Users**: Authentication, roles, preferences
- **Pets**: Complete pet profiles with health data
- **Nutrition Plans**: Personalized feeding recommendations
- **Health Records**: Time-series health tracking
- **Food Items**: Comprehensive nutritional database
- **Educational Content**: Articles, guides, and resources

## 🔐 Security Features

- **Password Hashing**: Bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Role-Based Access**: Pet owners, veterinarians, and administrators
- **Two-Factor Authentication**: TOTP support
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Prepared statements throughout

## 🏃‍♂️ Development

### Code Standards
- PSR-12 coding standard
- PHPStan level 8 static analysis
- 80%+ test coverage requirement
- Domain-Driven Design principles

### Project Structure
```
src/
├── Application/        # Application services
├── Domain/            # Domain entities and logic
├── Infrastructure/    # External concerns
└── Bootstrap/         # Application bootstrap

database/
├── migrations/        # Database migrations
└── seed.php          # Database seeding

tests/
├── Unit/             # Unit tests
├── Integration/      # Integration tests
└── Feature/          # Feature tests
```

## 📈 Performance

- **Database**: Optimized queries with proper indexing
- **Caching**: Redis for session and application caching
- **Response Times**: <2s for database operations, <5s for complex calculations
- **Scalability**: Designed for horizontal scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure code quality checks pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test cases for usage examples

## 🎯 Roadmap

See the [Implementation Plan](.kiro/specs/modern-anms-redesign/tasks.md) for detailed development roadmap and current progress.

---

**Built with ❤️ for better pet health and nutrition management.**