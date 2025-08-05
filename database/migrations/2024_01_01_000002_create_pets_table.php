<?php

declare(strict_types=1);

use Database\Migration;

class CreatePetsTable extends Migration
{
    public function up(): void
    {
        $this->createTable('pets', function ($table) {
            $table->id();
            $table->bigInteger('user_id')->notNull();
            $table->string('name', 100)->notNull();
            $table->enum('species', ['dog', 'cat', 'rabbit', 'bird', 'other'])->notNull();
            $table->string('breed', 100)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'unknown'])->default("'unknown'");
            $table->boolean('is_neutered')->default('FALSE');
            $table->string('microchip_id', 50)->nullable();
            $table->decimal('current_weight', 5, 2)->nullable();
            $table->decimal('ideal_weight', 5, 2)->nullable();
            $table->enum('activity_level', ['low', 'moderate', 'high'])->default("'moderate'");
            $table->integer('body_condition_score')->nullable();
            $table->json('health_conditions')->nullable();
            $table->json('allergies')->nullable();
            $table->json('medications')->nullable();
            $table->json('personality_traits')->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->bigInteger('veterinarian_id')->nullable();
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable();
            
            // Foreign keys
            $table->foreignKey('user_id', 'users.id', 'CASCADE', 'CASCADE');
            $table->foreignKey('veterinarian_id', 'users.id', 'SET NULL', 'CASCADE');
            
            // Indexes
            $table->index('idx_pets_user_id', ['user_id']);
            $table->index('idx_pets_species', ['species']);
            $table->index('idx_pets_veterinarian_id', ['veterinarian_id']);
            $table->index('idx_pets_deleted_at', ['deleted_at']);
            $table->uniqueIndex('idx_pets_microchip', ['microchip_id']);
        });
    }

    public function down(): void
    {
        $this->dropTable('pets');
    }
}