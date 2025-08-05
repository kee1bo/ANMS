<!-- Navigation -->
<nav class="navbar">
    <div class="container">
        <div class="nav-brand">
            <i class="fas fa-paw"></i>
            <span>ANMS</span>
        </div>
        <div class="nav-menu">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
        </div>
        <div class="nav-actions">
            <button class="btn btn-outline" onclick="showLogin()">Sign In</button>
            <button class="btn btn-primary" onclick="showRegister()">Get Started</button>
        </div>
    </div>
</nav>

<!-- Hero Section -->
<section class="hero">
    <div class="container">
        <div class="hero-content">
            <h1>Animal Nutrition Management System</h1>
            <p>ANMS provides comprehensive nutrition management for your pets with scientific meal planning, health monitoring, and veterinary integration. Track your pet's dietary needs, monitor health progress, and ensure optimal nutrition for a healthier, happier life.</p>
            <div class="hero-actions">
                <button class="btn btn-primary btn-large" onclick="showRegister()">
                    <i class="fas fa-rocket"></i> Get Started Free
                </button>
                <button class="btn btn-outline btn-large" onclick="showLogin()">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            </div>
        </div>
        <div class="hero-image">
            <div class="pet-cards">
                <div class="pet-card">
                    <i class="fas fa-dog"></i>
                    <h3>Dogs</h3>
                    <p>Custom nutrition plans</p>
                </div>
                <div class="pet-card">
                    <i class="fas fa-cat"></i>
                    <h3>Cats</h3>
                    <p>Health monitoring</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Features Section -->
<section id="features" class="features">
    <div class="container">
        <h2>Everything Your Pet Needs</h2>
        <div class="features-grid">
            <div class="feature">
                <i class="fas fa-calculator"></i>
                <h3>Scientific Nutrition Planning</h3>
                <p>ANMS calculates precise nutritional requirements based on your pet's species, breed, age, weight, and activity level using veterinary-approved formulas.</p>
            </div>
            <div class="feature">
                <i class="fas fa-heartbeat"></i>
                <h3>Health & Weight Monitoring</h3>
                <p>Track your pet's weight, body condition, and health metrics over time with detailed charts and progress analytics.</p>
            </div>
            <div class="feature">
                <i class="fas fa-stethoscope"></i>
                <h3>Veterinary Integration</h3>
                <p>Share comprehensive nutrition and health reports with your veterinarian for better medical care and dietary recommendations.</p>
            </div>
            <div class="feature">
                <i class="fas fa-database"></i>
                <h3>Comprehensive Food Database</h3>
                <p>Access detailed nutritional information for thousands of pet foods with ingredient analysis and recommendation engine.</p>
            </div>
        </div>
    </div>
</section>

<!-- About Section -->
<section id="about" class="about">
    <div class="container">
        <div class="about-content">
            <div class="about-text">
                <h2>About ANMS</h2>
                <p>The Animal Nutrition Management System (ANMS) is a professional-grade platform that combines veterinary science with modern technology to optimize pet nutrition and health management.</p>
                <p>ANMS uses evidence-based nutritional calculations, comprehensive health tracking, and data-driven insights to help pet owners make informed decisions about their pets' dietary needs and overall wellness.</p>
                <div class="about-stats">
                    <div class="stat">
                        <h3>2,500+</h3>
                        <p>Food Items Analyzed</p>
                    </div>
                    <div class="stat">
                        <h3>15+</h3>
                        <p>Pet Species Supported</p>
                    </div>
                    <div class="stat">
                        <h3>50+</h3>
                        <p>Health Metrics Tracked</p>
                    </div>
                </div>
            </div>
            <div class="about-image">
                <div class="about-card">
                    <i class="fas fa-flask"></i>
                    <h4>Evidence-Based Algorithms</h4>
                    <p>ANMS uses peer-reviewed nutritional research and AAFCO guidelines to calculate precise dietary requirements for optimal pet health.</p>
                </div>
                <div class="about-card">
                    <i class="fas fa-chart-bar"></i>
                    <h4>Data-Driven Insights</h4>
                    <p>Advanced analytics track nutrition patterns, health trends, and provide actionable recommendations for improved pet wellness.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Contact Section -->
<section id="contact" class="contact">
    <div class="container">
        <h2>Get In Touch</h2>
        <div class="contact-content">
            <div class="contact-info">
                <div class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <div>
                        <h4>Email Us</h4>
                        <p>support@anms.com</p>
                        <p>info@anms.com</p>
                    </div>
                </div>
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <div>
                        <h4>Call Us</h4>
                        <p>+1 (555) 123-4567</p>
                        <p>Mon-Fri 9AM-6PM EST</p>
                    </div>
                </div>
                <div class="contact-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <h4>Visit Us</h4>
                        <p>123 Pet Care Avenue</p>
                        <p>New York, NY 10001</p>
                    </div>
                </div>
            </div>
            <div class="contact-form">
                <form onsubmit="handleContactForm(event)">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input" name="name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" name="email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Subject</label>
                        <input type="text" class="form-input" name="subject" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Message</label>
                        <textarea class="form-textarea" name="message" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Send Message
                    </button>
                </form>
            </div>
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <div class="footer-brand">
                    <i class="fas fa-paw"></i>
                    <span>ANMS</span>
                </div>
                <p>Professional pet nutrition management for healthier, happier pets.</p>
                <div class="social-links">
                    <a href="#"><i class="fab fa-facebook"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                    <a href="#"><i class="fab fa-linkedin"></i></a>
                </div>
            </div>
            <div class="footer-section">
                <h4>Product</h4>
                <ul>
                    <li><a href="#features">Features</a></li>
                    <li><a href="#" onclick="showRegister()">Get Started</a></li>
                    <li><a href="#" onclick="showLogin()">Sign In</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Company</h4>
                <ul>
                    <li><a href="#about">About</a></li>
                    <li><a href="#contact">Contact</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Terms of Service</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Support</h4>
                <ul>
                    <li><a href="#contact">Help Center</a></li>
                    <li><a href="mailto:support@anms.com">Email Support</a></li>
                    <li><a href="#">Documentation</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2024 Animal Nutrition Management System. All rights reserved.</p>
        </div>
    </div>
</footer>

<!-- Auth Modals -->
<div id="modal-overlay" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close" onclick="closeModal()">
            <i class="fas fa-times"></i>
        </button>
        <div id="modal-body"></div>
    </div>
</div>