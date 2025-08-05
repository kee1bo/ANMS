<?php

declare(strict_types=1);

use Database\Migration;

class CreateFoodItemsTable extends Migration
{
    public function up(): void
    {
        $this->createTable('food_items', function ($table) {
            $table->id();
            $table->string('name', 200)->notNull();
            $table->string('brand', 100)->nullable();
            $table->enum('category', [
                'dry_kibble', 
                'wet_food', 
                'raw_food', 
                'treats', 
                'supplements'
            ])->notNull();
            $table->string('target_species', 100)->notNull(); // SET equivalent as string
            $table->string('life_stage', 100)->notNull(); // SET equivalent as string
            $table->integer('calories_per_100g')->notNull();
            $table->decimal('protein_percentage', 5, 2)->nullable();
            $table->decimal('fat_percentage', 5, 2)->nullable();
            $table->decimal('fiber_percentage', 5, 2)->nullable();
            $table->decimal('moisture_percentage', 5, 2)->nullable();
            $table->decimal('ash_percentage', 5, 2)->nullable();
            $table->decimal('carbohydrate_percentage', 5, 2)->nullable();
            $table->json('detailed_nutrition')->nullable();
            $table->text('ingredients')->nullable();
            $table->json('feeding_guidelines')->nullable();
            $table->boolean('aafco_approved')->default('FALSE');
            $table->boolean('organic_certified')->default('FALSE');
            $table->boolean('grain_free')->default('FALSE');
            $table->json('allergen_info')->nullable();
            $table->decimal('price_per_unit', 8, 2)->nullable();
            $table->string('unit_size', 50)->nullable();
            $table->enum('availability_status', ['available', 'limited', 'discontinued'])->default("'available'");
            $table->timestamps();
            
            // Indexes
            $table->index('idx_food_items_category', ['category']);
            $table->index('idx_food_items_species', ['target_species']);
            $table->index('idx_food_items_life_stage', ['life_stage']);
            $table->index('idx_food_items_availability', ['availability_status']);
            $table->index('idx_food_items_aafco', ['aafco_approved']);
        });
        
        // Add full-text search index for name and brand
        $this->db->exec("ALTER TABLE food_items ADD FULLTEXT(name, brand)");
    }

    public function down(): void
    {
        $this->dropTable('food_items');
    }
}