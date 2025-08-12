# Pet Management System Design

## Overview

The Pet Management System serves as the foundational data layer for the ANMS application, providing comprehensive pet profile creation, management, and integration capabilities. The system is designed with a modern, responsive interface that seamlessly integrates with the existing authentication system and database structure while providing the foundation for nutrition planning and health tracking features.

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API   │    │    Database     │
│                 │    │                 │    │                 │
│ • Pet Forms     │◄──►│ • Pet CRUD      │◄──►│ • pets table    │
│ • Pet List      │    │ • Validation    │    │ • users table   │
│ • Photo Upload  │    │ • File Upload   │    │ • pet_photos    │
│ • Search/Filter │    │ • Integration   │    │ • audit_log     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema Extensions
```sql
-- Extend existing pets table
ALTER TABLE pets ADD COLUMN gender TEXT CHECK(gender IN ('male', 'female', 'unknown'));
ALTER TABLE pets ADD COLUMN birth_date DATE;
ALTER TABLE pets ADD COLUMN body_condition_score INTEGER CHECK(body_condition_score BETWEEN 1 AND 9);
ALTER TABLE pets ADD COLUMN spay_neuter_status TEXT CHECK(spay_neuter_status IN ('spayed', 'neutered', 'intact', 'unknown'));
ALTER TABLE pets ADD COLUMN microchip_id TEXT;
ALTER TABLE pets ADD COLUMN emergency_contact TEXT;

-- New pet_photos table
CREATE TABLE pet_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- New pet_health_conditions table
CREATE TABLE pet_health_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    condition_name TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('mild', 'moderate', 'severe')),
    diagnosed_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- New pet_allergies table
CREATE TABLE pet_allergies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    allergen TEXT NOT NULL,
    reaction_type TEXT,
    severity TEXT CHECK(severity IN ('mild', 'moderate', 'severe')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Audit log for pet changes
CREATE TABLE pet_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Components and Interfaces

### Frontend Components

#### 1. Pet Dashboard Component
- **Purpose**: Main interface for viewing and managing all pets
- **Features**: Grid/list view toggle, search, filtering, quick actions
- **Integration**: Connects to pets API, handles navigation to detail views

#### 2. Pet Form Component
- **Purpose**: Create and edit pet profiles
- **Features**: Multi-step form, real-time validation, photo upload
- **Validation**: Client-side validation with server-side verification

#### 3. Pet Profile Component
- **Purpose**: Display comprehensive pet information
- **Features**: Tabbed interface, edit mode, photo gallery, health timeline
- **Integration**: Links to nutrition and health tracking features

#### 4. Photo Upload Component
- **Purpose**: Handle pet photo management
- **Features**: Drag-and-drop upload, image preview, crop/resize, multiple photos
- **Technical**: File validation, progress indicators, error handling

#### 5. Pet Search Component
- **Purpose**: Advanced search and filtering
- **Features**: Text search, filter by species/breed/age, sorting options
- **Performance**: Debounced search, pagination, caching

### Backend API Endpoints

#### Pet CRUD Operations
```javascript
// Get all pets for user
GET /api/pets
Response: { success: true, pets: [...], total: number }

// Get single pet
GET /api/pets/{id}
Response: { success: true, pet: {...}, photos: [...], health: [...] }

// Create new pet
POST /api/pets
Body: { name, species, breed, age, weight, ... }
Response: { success: true, pet: {...}, id: number }

// Update pet
PUT /api/pets/{id}
Body: { field updates... }
Response: { success: true, pet: {...}, changes: [...] }

// Delete pet (soft delete)
DELETE /api/pets/{id}
Response: { success: true, message: "Pet archived successfully" }
```

#### Photo Management
```javascript
// Upload pet photo
POST /api/pets/{id}/photos
Body: FormData with image file
Response: { success: true, photo: {...}, url: string }

// Set primary photo
PUT /api/pets/{id}/photos/{photoId}/primary
Response: { success: true, message: "Primary photo updated" }

// Delete photo
DELETE /api/pets/{id}/photos/{photoId}
Response: { success: true, message: "Photo deleted" }
```

#### Health Information
```javascript
// Add health condition
POST /api/pets/{id}/health-conditions
Body: { condition_name, severity, diagnosed_date, notes }
Response: { success: true, condition: {...} }

// Add allergy
POST /api/pets/{id}/allergies
Body: { allergen, reaction_type, severity, notes }
Response: { success: true, allergy: {...} }
```

## Data Models

### Pet Model
```javascript
class Pet {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.name = data.name;
        this.species = data.species;
        this.breed = data.breed;
        this.gender = data.gender;
        this.birthDate = data.birth_date;
        this.age = this.calculateAge(data.birth_date);
        this.weight = data.weight;
        this.idealWeight = data.ideal_weight;
        this.activityLevel = data.activity_level;
        this.bodyConditionScore = data.body_condition_score;
        this.healthStatus = data.health_status;
        this.spayNeuterStatus = data.spay_neuter_status;
        this.microchipId = data.microchip_id;
        this.personality = data.personality;
        this.emergencyContact = data.emergency_contact;
        this.photos = data.photos || [];
        this.healthConditions = data.health_conditions || [];
        this.allergies = data.allergies || [];
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    calculateAge(birthDate) {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        return Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
    }

    getPrimaryPhoto() {
        return this.photos.find(photo => photo.is_primary) || this.photos[0] || null;
    }

    getHealthSummary() {
        return {
            activeConditions: this.healthConditions.filter(c => c.is_active).length,
            allergies: this.allergies.length,
            lastUpdated: this.updatedAt
        };
    }
}
```

### Validation Rules
```javascript
const petValidationRules = {
    name: {
        required: true,
        minLength: 1,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9\s\-']+$/
    },
    species: {
        required: true,
        enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'other']
    },
    weight: {
        required: true,
        type: 'number',
        min: 0.1,
        max: 200,
        precision: 1
    },
    age: {
        type: 'integer',
        min: 0,
        max: 30
    },
    activityLevel: {
        required: true,
        enum: ['low', 'medium', 'high']
    },
    bodyConditionScore: {
        type: 'integer',
        min: 1,
        max: 9
    }
};
```

## Error Handling

### Client-Side Error Handling
```javascript
class PetErrorHandler {
    static handleValidationErrors(errors) {
        // Display field-specific error messages
        Object.keys(errors).forEach(field => {
            const fieldElement = document.getElementById(field);
            const errorElement = document.getElementById(`${field}-error`);
            
            if (fieldElement && errorElement) {
                fieldElement.classList.add('error');
                errorElement.textContent = errors[field];
                errorElement.style.display = 'block';
            }
        });
    }

    static handleApiErrors(error) {
        // Display user-friendly error messages
        const errorMessages = {
            400: 'Please check your input and try again.',
            401: 'Please log in to continue.',
            403: 'You don\'t have permission to perform this action.',
            404: 'Pet not found.',
            413: 'File too large. Please choose a smaller image.',
            500: 'Something went wrong. Please try again later.'
        };

        const message = errorMessages[error.status] || 'An unexpected error occurred.';
        this.showNotification(message, 'error');
    }
}
```

### Server-Side Error Handling
```php
class PetController {
    public function validatePetData($data) {
        $errors = [];
        
        // Name validation
        if (empty($data['name'])) {
            $errors['name'] = 'Pet name is required';
        } elseif (strlen($data['name']) > 50) {
            $errors['name'] = 'Pet name must be less than 50 characters';
        }
        
        // Weight validation
        if (!isset($data['weight']) || !is_numeric($data['weight'])) {
            $errors['weight'] = 'Valid weight is required';
        } elseif ($data['weight'] < 0.1 || $data['weight'] > 200) {
            $errors['weight'] = 'Weight must be between 0.1 and 200 kg';
        }
        
        // Species validation
        $validSpecies = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'other'];
        if (!in_array($data['species'], $validSpecies)) {
            $errors['species'] = 'Please select a valid species';
        }
        
        return $errors;
    }
}
```

## Testing Strategy

### Unit Tests
- **Pet Model Tests**: Validation, calculations, data transformations
- **API Endpoint Tests**: CRUD operations, error handling, authentication
- **Validation Tests**: Input validation, edge cases, security

### Integration Tests
- **Database Integration**: Pet CRUD operations, relationships, constraints
- **File Upload Integration**: Photo upload, storage, retrieval
- **API Integration**: Frontend-backend communication, error handling

### End-to-End Tests
- **Pet Creation Flow**: Complete pet registration process
- **Pet Management Flow**: Edit, update, delete operations
- **Photo Upload Flow**: Upload, set primary, delete photos
- **Search and Filter Flow**: Find pets by various criteria

### Performance Tests
- **Load Testing**: Multiple concurrent pet operations
- **File Upload Testing**: Large image uploads, multiple files
- **Database Performance**: Query optimization, indexing effectiveness

## Security Considerations

### Data Protection
- **Input Sanitization**: All user inputs sanitized and validated
- **SQL Injection Prevention**: Prepared statements for all database queries
- **File Upload Security**: File type validation, size limits, virus scanning
- **Access Control**: Users can only access their own pets

### Privacy Protection
- **Data Encryption**: Sensitive pet data encrypted at rest
- **Audit Logging**: All pet modifications logged with user attribution
- **Data Retention**: Configurable data retention policies
- **Export/Delete**: User control over pet data export and deletion

## Performance Optimization

### Database Optimization
- **Indexing Strategy**: Indexes on user_id, species, breed for fast queries
- **Query Optimization**: Efficient joins, pagination, selective loading
- **Caching Strategy**: Redis caching for frequently accessed pet data

### Frontend Optimization
- **Lazy Loading**: Pet photos and detailed data loaded on demand
- **Pagination**: Large pet lists paginated for performance
- **Image Optimization**: Automatic image compression and resizing
- **Caching**: Browser caching for static pet data

### File Storage Optimization
- **CDN Integration**: Pet photos served from CDN for fast loading
- **Image Processing**: Multiple image sizes generated automatically
- **Storage Cleanup**: Orphaned files cleaned up automatically

## Integration Points

### Nutrition System Integration
- **Pet Data API**: Provides pet characteristics for nutrition calculations
- **Change Notifications**: Notifies nutrition system when pet data changes
- **Validation Integration**: Ensures pet data meets nutrition system requirements

### Health Tracking Integration
- **Health Data Sync**: Pet health conditions sync with health tracking
- **Weight History**: Pet weight changes tracked in health system
- **Medical Records**: Integration with veterinary record systems

### Reporting Integration
- **Pet Reports**: Comprehensive pet profiles for veterinary reports
- **Data Export**: Pet data export in standard formats
- **Analytics Integration**: Pet data for system analytics and insights

This design provides a comprehensive foundation for the Pet Management System that integrates seamlessly with the existing ANMS architecture while providing room for future enhancements and integrations.