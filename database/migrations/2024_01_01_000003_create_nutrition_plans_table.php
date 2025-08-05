<?php

declare(strict_types=1);

use Database\Migration;

class CreateNutritionPlansTable extends Migration
{
    public function up(): void
    {
        $this->createTable('nutrition_plans', function ($table) {
            $table->id();
            $table->bigInteger('pet_id')->notNull();
            $table->string('plan_name', 200)->notNull();
            $table->integer('daily_calories')->notNull();
            $table->decimal('daily_protein_grams', 6, 2)->nullable();
            $table->decimal('daily_fat_grams', 6, 2)->nullable();
            $table->decimal('daily_carb_grams', 6, 2)->nullable();
            $table->decimal('daily_fiber_grams', 6, 2)->nullable();
            $table->integer('meals_per_day')->default('2');
            $table->json('feeding_schedule')->nullable();
            $table->json('food_recommendations')->nullable();
            $table->text('special_instructions')->nullable();
            $table->bigInteger('created_by_user_id')->notNull();
            $table->boolean('veterinarian_approved')->default('FALSE');
            $table->bigInteger('approved_by_user_id')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->date('active_from')->notNull();
            $table->date('active_until')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreignKey('pet_id', 'pets.id', 'CASCADE', 'CASCADE');
            $table->foreignKey('created_by_user_id', 'users.id', 'CASCADE', 'CASCADE');
            $table->foreignKey('approved_by_user_id', 'users.id', 'SET NULL', 'CASCADE');
            
            // Indexes
            $table->index('idx_nutrition_plans_pet_id', ['pet_id']);
            $table->index('idx_nutrition_plans_created_by', ['created_by_user_id']);
            $table->index('idx_nutrition_plans_approved_by', ['approved_by_user_id']);
            $table->index('idx_nutrition_plans_active', ['active_from', 'active_until']);
            $table->index('idx_nutrition_plans_approved', ['veterinarian_approved']);
        });
    }

    public function down(): void
    {
        $this->dropTable('nutrition_plans');
    }
}