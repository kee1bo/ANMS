<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap/app.php';

use App\Infrastructure\Database\DatabaseManager;

class DatabaseSeeder
{
    private DatabaseManager $db;

    public function __construct(DatabaseManager $db)
    {
        $this->db = $db;
    }

    public function run(): void
    {
        echo "Starting database seeding...\n";

        try {
            $this->db->beginTransaction();

            $this->seedUsers();
            $this->seedPets();
            $this->seedFoodItems();
            $this->seedEducationalContent();

            $this->db->commit();
            echo "Database seeding completed successfully!\n";
        } catch (Exception $e) {
            $this->db->rollback();
            echo "Database seeding failed: " . $e->getMessage() . "\n";
            throw $e;
        }
    }

    private function seedUsers(): void
    {
        echo "Seeding users...\n";

        $users = [
            [
                'email' => 'admin@anms.com',
                'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'role' => 'admin',
                'email_verified_at' => date('Y-m-d H:i:s')
            ],
            [
                'email' => 'vet@anms.com',
                'password_hash' => password_hash('vet123', PASSWORD_DEFAULT),
                'first_name' => 'Dr. Sarah',
                'last_name' => 'Johnson',
                'role' => 'veterinarian',
                'location' => 'New York, NY',
                'phone' => '+1-555-0123',
                'email_verified_at' => date('Y-m-d H:i:s')
            ],
            [
                'email' => 'john.doe@example.com',
                'password_hash' => password_hash('password123', PASSWORD_DEFAULT),
                'first_name' => 'John',
                'last_name' => 'Doe',
                'role' => 'pet_owner',
                'location' => 'Los Angeles, CA',
                'phone' => '+1-555-0456',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'preferences' => json_encode(['theme' => 'light', 'notifications' => true])
            ],
            [
                'email' => 'jane.smith@example.com',
                'password_hash' => password_hash('password123', PASSWORD_DEFAULT),
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'role' => 'pet_owner',
                'location' => 'Chicago, IL',
                'phone' => '+1-555-0789',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'preferences' => json_encode(['theme' => 'dark', 'notifications' => false])
            ]
        ];

        foreach ($users as $user) {
            $columns = implode(', ', array_keys($user));
            $placeholders = ':' . implode(', :', array_keys($user));
            
            $stmt = $this->db->prepare("INSERT INTO users ({$columns}) VALUES ({$placeholders})");
            $stmt->execute($user);
        }
    }

    private function seedPets(): void
    {
        echo "Seeding pets...\n";

        $pets = [
            [
                'user_id' => 3, // John Doe
                'name' => 'Buddy',
                'species' => 'dog',
                'breed' => 'Golden Retriever',
                'date_of_birth' => '2021-03-15',
                'gender' => 'male',
                'is_neutered' => 1,
                'microchip_id' => 'GR123456789',
                'current_weight' => 28.5,
                'ideal_weight' => 27.0,
                'activity_level' => 'high',
                'body_condition_score' => 6,
                'health_conditions' => json_encode(['hip_dysplasia_risk']),
                'allergies' => json_encode(['chicken']),
                'personality_traits' => json_encode(['energetic', 'friendly', 'loyal']),
                'photo_url' => '/images/pets/buddy.jpg',
                'veterinarian_id' => 2
            ],
            [
                'user_id' => 3, // John Doe
                'name' => 'Luna',
                'species' => 'cat',
                'breed' => 'Maine Coon',
                'date_of_birth' => '2020-08-22',
                'gender' => 'female',
                'is_neutered' => 1,
                'microchip_id' => 'MC987654321',
                'current_weight' => 5.8,
                'ideal_weight' => 5.5,
                'activity_level' => 'moderate',
                'body_condition_score' => 7,
                'health_conditions' => json_encode([]),
                'allergies' => json_encode(['fish']),
                'personality_traits' => json_encode(['calm', 'independent', 'affectionate']),
                'photo_url' => '/images/pets/luna.jpg',
                'veterinarian_id' => 2
            ],
            [
                'user_id' => 4, // Jane Smith
                'name' => 'Charlie',
                'species' => 'dog',
                'breed' => 'French Bulldog',
                'date_of_birth' => '2022-01-10',
                'gender' => 'male',
                'is_neutered' => 0,
                'microchip_id' => 'FB456789123',
                'current_weight' => 11.2,
                'ideal_weight' => 11.0,
                'activity_level' => 'low',
                'body_condition_score' => 5,
                'health_conditions' => json_encode(['brachycephalic_syndrome']),
                'allergies' => json_encode([]),
                'personality_traits' => json_encode(['playful', 'stubborn', 'loving']),
                'photo_url' => '/images/pets/charlie.jpg',
                'veterinarian_id' => 2
            ],
            [
                'user_id' => 4, // Jane Smith
                'name' => 'Whiskers',
                'species' => 'cat',
                'breed' => 'Persian',
                'date_of_birth' => '2019-11-05',
                'gender' => 'female',
                'is_neutered' => 1,
                'microchip_id' => 'PS789123456',
                'current_weight' => 4.2,
                'ideal_weight' => 4.0,
                'activity_level' => 'low',
                'body_condition_score' => 6,
                'health_conditions' => json_encode(['kidney_disease_risk']),
                'allergies' => json_encode(['beef']),
                'personality_traits' => json_encode(['quiet', 'gentle', 'lap_cat']),
                'photo_url' => '/images/pets/whiskers.jpg',
                'veterinarian_id' => 2
            ]
        ];

        foreach ($pets as $pet) {
            $columns = implode(', ', array_keys($pet));
            $placeholders = ':' . implode(', :', array_keys($pet));
            
            $stmt = $this->db->prepare("INSERT INTO pets ({$columns}) VALUES ({$placeholders})");
            $stmt->execute($pet);
        }
    }

    private function seedFoodItems(): void
    {
        echo "Seeding food items...\n";

        $foodItems = [
            // Dog Foods
            [
                'name' => 'Premium Adult Dog Food',
                'brand' => 'Royal Canin',
                'category' => 'dry_kibble',
                'target_species' => 'dog',
                'life_stage' => 'adult',
                'calories_per_100g' => 380,
                'protein_percentage' => 26.0,
                'fat_percentage' => 15.0,
                'fiber_percentage' => 3.5,
                'moisture_percentage' => 10.0,
                'ash_percentage' => 6.5,
                'carbohydrate_percentage' => 39.0,
                'detailed_nutrition' => json_encode([
                    'calcium' => 1.2,
                    'phosphorus' => 0.9,
                    'omega_3' => 0.8,
                    'omega_6' => 3.2
                ]),
                'ingredients' => 'Chicken meal, brown rice, chicken fat, beet pulp, fish oil, vitamins, minerals',
                'feeding_guidelines' => json_encode([
                    '5-10kg' => '95-155g',
                    '10-25kg' => '155-310g',
                    '25-45kg' => '310-470g'
                ]),
                'aafco_approved' => 1,
                'organic_certified' => 0,
                'grain_free' => 0,
                'allergen_info' => json_encode(['chicken']),
                'price_per_unit' => 89.99,
                'unit_size' => '15kg',
                'availability_status' => 'available'
            ],
            [
                'name' => 'Grain-Free Salmon Recipe',
                'brand' => 'Blue Buffalo',
                'category' => 'dry_kibble',
                'target_species' => 'dog',
                'life_stage' => 'adult',
                'calories_per_100g' => 365,
                'protein_percentage' => 24.0,
                'fat_percentage' => 14.0,
                'fiber_percentage' => 4.0,
                'moisture_percentage' => 10.0,
                'ash_percentage' => 7.0,
                'carbohydrate_percentage' => 41.0,
                'detailed_nutrition' => json_encode([
                    'calcium' => 1.0,
                    'phosphorus' => 0.8,
                    'omega_3' => 1.2,
                    'omega_6' => 2.8
                ]),
                'ingredients' => 'Deboned salmon, sweet potatoes, peas, salmon meal, canola oil, vitamins, minerals',
                'feeding_guidelines' => json_encode([
                    '2-6kg' => '40-95g',
                    '6-14kg' => '95-180g',
                    '14-32kg' => '180-340g'
                ]),
                'aafco_approved' => 1,
                'organic_certified' => 0,
                'grain_free' => 1,
                'allergen_info' => json_encode(['fish']),
                'price_per_unit' => 79.99,
                'unit_size' => '12kg',
                'availability_status' => 'available'
            ],
            // Cat Foods
            [
                'name' => 'Indoor Adult Cat Food',
                'brand' => 'Hill\'s Science Diet',
                'category' => 'dry_kibble',
                'target_species' => 'cat',
                'life_stage' => 'adult',
                'calories_per_100g' => 395,
                'protein_percentage' => 33.0,
                'fat_percentage' => 15.5,
                'fiber_percentage' => 2.8,
                'moisture_percentage' => 8.0,
                'ash_percentage' => 6.2,
                'carbohydrate_percentage' => 34.5,
                'detailed_nutrition' => json_encode([
                    'calcium' => 0.8,
                    'phosphorus' => 0.7,
                    'taurine' => 0.15,
                    'omega_3' => 0.6
                ]),
                'ingredients' => 'Chicken, chicken meal, corn gluten meal, whole grain wheat, chicken fat, vitamins, minerals',
                'feeding_guidelines' => json_encode([
                    '2-3kg' => '35-45g',
                    '3-5kg' => '45-65g',
                    '5-7kg' => '65-85g'
                ]),
                'aafco_approved' => 1,
                'organic_certified' => 0,
                'grain_free' => 0,
                'allergen_info' => json_encode(['chicken', 'wheat']),
                'price_per_unit' => 45.99,
                'unit_size' => '7kg',
                'availability_status' => 'available'
            ],
            [
                'name' => 'Pâté Chicken & Liver',
                'brand' => 'Wellness',
                'category' => 'wet_food',
                'target_species' => 'cat',
                'life_stage' => 'adult',
                'calories_per_100g' => 95,
                'protein_percentage' => 10.0,
                'fat_percentage' => 6.0,
                'fiber_percentage' => 1.0,
                'moisture_percentage' => 78.0,
                'ash_percentage' => 2.5,
                'carbohydrate_percentage' => 2.5,
                'detailed_nutrition' => json_encode([
                    'calcium' => 0.25,
                    'phosphorus' => 0.20,
                    'taurine' => 0.05,
                    'omega_3' => 0.1
                ]),
                'ingredients' => 'Chicken, chicken liver, chicken broth, carrots, sweet potatoes, vitamins, minerals',
                'feeding_guidelines' => json_encode([
                    '2-3kg' => '1.5 cans',
                    '3-5kg' => '2-2.5 cans',
                    '5-7kg' => '2.5-3 cans'
                ]),
                'aafco_approved' => 1,
                'organic_certified' => 0,
                'grain_free' => 1,
                'allergen_info' => json_encode(['chicken']),
                'price_per_unit' => 2.49,
                'unit_size' => '156g can',
                'availability_status' => 'available'
            ]
        ];

        foreach ($foodItems as $item) {
            $columns = implode(', ', array_keys($item));
            $placeholders = ':' . implode(', :', array_keys($item));
            
            $stmt = $this->db->prepare("INSERT INTO food_items ({$columns}) VALUES ({$placeholders})");
            $stmt->execute($item);
        }
    }

    private function seedEducationalContent(): void
    {
        echo "Seeding educational content...\n";

        $content = [
            [
                'title' => 'Understanding Your Dog\'s Nutritional Needs',
                'slug' => 'understanding-dog-nutritional-needs',
                'excerpt' => 'Learn about the essential nutrients your dog needs for optimal health and how to choose the right food.',
                'content' => $this->getDogNutritionContent(),
                'content_type' => 'article',
                'category' => 'nutrition',
                'tags' => json_encode(['dogs', 'nutrition', 'health', 'feeding']),
                'target_species' => 'dog',
                'difficulty_level' => 'beginner',
                'reading_time_minutes' => 8,
                'author_id' => 2, // Dr. Sarah Johnson
                'reviewed_by_id' => 2,
                'reviewed_at' => date('Y-m-d H:i:s'),
                'status' => 'published',
                'published_at' => date('Y-m-d H:i:s'),
                'view_count' => 245,
                'average_rating' => 4.7,
                'rating_count' => 23,
                'seo_meta' => json_encode([
                    'meta_description' => 'Complete guide to dog nutrition covering proteins, fats, carbohydrates, vitamins and minerals.',
                    'keywords' => 'dog nutrition, pet food, canine diet, dog health'
                ])
            ],
            [
                'title' => 'Cat Feeding Guidelines: From Kitten to Senior',
                'slug' => 'cat-feeding-guidelines-kitten-to-senior',
                'excerpt' => 'Comprehensive guide to feeding cats at different life stages with portion sizes and nutritional requirements.',
                'content' => $this->getCatFeedingContent(),
                'content_type' => 'guide',
                'category' => 'feeding',
                'tags' => json_encode(['cats', 'feeding', 'life-stages', 'portions']),
                'target_species' => 'cat',
                'difficulty_level' => 'intermediate',
                'reading_time_minutes' => 12,
                'author_id' => 2, // Dr. Sarah Johnson
                'reviewed_by_id' => 2,
                'reviewed_at' => date('Y-m-d H:i:s'),
                'status' => 'published',
                'published_at' => date('Y-m-d H:i:s', strtotime('-1 week')),
                'view_count' => 189,
                'average_rating' => 4.5,
                'rating_count' => 18,
                'seo_meta' => json_encode([
                    'meta_description' => 'Learn how to feed your cat properly from kittenhood through senior years.',
                    'keywords' => 'cat feeding, kitten food, senior cat, feline nutrition'
                ])
            ],
            [
                'title' => 'Common Pet Food Allergies and How to Manage Them',
                'slug' => 'common-pet-food-allergies-management',
                'excerpt' => 'Identify signs of food allergies in pets and learn effective management strategies.',
                'content' => $this->getAllergyContent(),
                'content_type' => 'article',
                'category' => 'health',
                'tags' => json_encode(['allergies', 'health', 'symptoms', 'management']),
                'target_species' => 'dog,cat',
                'difficulty_level' => 'intermediate',
                'reading_time_minutes' => 10,
                'author_id' => 2, // Dr. Sarah Johnson
                'reviewed_by_id' => 2,
                'reviewed_at' => date('Y-m-d H:i:s'),
                'status' => 'published',
                'published_at' => date('Y-m-d H:i:s', strtotime('-3 days')),
                'view_count' => 156,
                'average_rating' => 4.8,
                'rating_count' => 15,
                'seo_meta' => json_encode([
                    'meta_description' => 'Complete guide to identifying and managing food allergies in dogs and cats.',
                    'keywords' => 'pet allergies, food allergies, pet health, allergy symptoms'
                ])
            ]
        ];

        foreach ($content as $item) {
            $columns = implode(', ', array_keys($item));
            $placeholders = ':' . implode(', :', array_keys($item));
            
            $stmt = $this->db->prepare("INSERT INTO educational_content ({$columns}) VALUES ({$placeholders})");
            $stmt->execute($item);
        }
    }

    private function getDogNutritionContent(): string
    {
        return "# Understanding Your Dog's Nutritional Needs

Dogs require a balanced diet containing six essential nutrients: proteins, fats, carbohydrates, vitamins, minerals, and water. Each plays a crucial role in maintaining your dog's health and vitality.

## Proteins
Proteins are the building blocks of your dog's body, essential for muscle development, tissue repair, and immune function. High-quality animal proteins should make up 18-25% of an adult dog's diet.

## Fats
Fats provide energy and help absorb fat-soluble vitamins. They also contribute to healthy skin and coat. Look for foods with 8-15% fat content for adult dogs.

## Carbohydrates
While not essential, carbohydrates provide energy and fiber for digestive health. Quality sources include brown rice, sweet potatoes, and oats.

## Vitamins and Minerals
These micronutrients support various bodily functions. A complete and balanced commercial dog food should provide all necessary vitamins and minerals.

## Water
Fresh, clean water should always be available. Dogs need approximately 1 ounce of water per pound of body weight daily.

## Choosing the Right Food
Look for AAFCO-approved foods that match your dog's life stage, size, and activity level. Consult with your veterinarian for personalized recommendations.";
    }

    private function getCatFeedingContent(): string
    {
        return "# Cat Feeding Guidelines: From Kitten to Senior

Proper nutrition is essential throughout your cat's life, but requirements change as they age. This guide covers feeding recommendations for each life stage.

## Kittens (0-12 months)
Kittens need nutrient-dense food to support rapid growth:
- Feed kitten-specific food with at least 30% protein
- Offer small, frequent meals (3-4 times daily)
- Gradually transition to adult food around 12 months

## Adult Cats (1-7 years)
Maintain optimal body condition with:
- High-quality adult cat food (26-30% protein minimum)
- Portion control based on body weight and activity
- Regular feeding schedule (2 meals daily)

## Senior Cats (7+ years)
Adjust diet for changing needs:
- Easily digestible, high-quality proteins
- Monitor for kidney function changes
- Consider senior-specific formulations
- Maintain ideal body weight

## Portion Guidelines
- Indoor cats: 20 calories per pound of body weight
- Active outdoor cats: 35 calories per pound
- Adjust based on body condition score

## Special Considerations
- Always provide fresh water
- Monitor eating habits for changes
- Consult your veterinarian for individual needs";
    }

    private function getAllergyContent(): string
    {
        return "# Common Pet Food Allergies and How to Manage Them

Food allergies affect approximately 10% of dogs and cats, causing uncomfortable symptoms that can significantly impact quality of life.

## Common Allergens
### Dogs
- Beef (34% of cases)
- Dairy (17%)
- Chicken (15%)
- Wheat (13%)
- Lamb (14%)

### Cats
- Fish (13% of cases)
- Beef (12%)
- Chicken (4%)
- Dairy (4%)

## Symptoms to Watch For
- Itchy skin and excessive scratching
- Ear infections
- Digestive upset (vomiting, diarrhea)
- Hot spots or skin lesions
- Chronic paw licking

## Diagnosis
Work with your veterinarian to:
1. Rule out other causes
2. Conduct elimination diet trial
3. Consider allergy testing if needed

## Management Strategies
### Elimination Diet
- Feed novel protein and carbohydrate for 8-12 weeks
- Avoid all treats and table food
- Monitor symptom improvement

### Hypoallergenic Foods
- Hydrolyzed protein diets
- Limited ingredient diets
- Novel protein sources

### Long-term Management
- Strict avoidance of identified allergens
- Regular veterinary monitoring
- Emergency action plan for severe reactions

Remember: Food allergies are manageable with proper diagnosis and dietary management. Work closely with your veterinarian for the best outcomes.";
    }
}

// Run the seeder
try {
    $app = require __DIR__ . '/../bootstrap/app.php';
    $db = $app->getContainer()->get(DatabaseManager::class);
    
    $seeder = new DatabaseSeeder($db);
    $seeder->run();
} catch (Exception $e) {
    echo "Seeding failed: " . $e->getMessage() . "\n";
    exit(1);
}