<?php

declare(strict_types=1);

use Database\Migration;

class CreateHealthRecordsTable extends Migration
{
    public function up(): void
    {
        $this->createTable('health_records', function ($table) {
            $table->id();
            $table->bigInteger('pet_id')->notNull();
            $table->enum('record_type', [
                'weight', 
                'body_condition', 
                'activity', 
                'health_note', 
                'medication', 
                'vet_visit'
            ])->notNull();
            $table->date('recorded_date')->notNull();
            $table->string('recorded_time', 8)->nullable(); // TIME format
            $table->decimal('numeric_value', 10, 3)->nullable();
            $table->text('text_value')->nullable();
            $table->json('json_data')->nullable();
            $table->bigInteger('recorded_by_user_id')->notNull();
            $table->boolean('veterinarian_verified')->default('FALSE');
            $table->bigInteger('verified_by_user_id')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('attachments')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreignKey('pet_id', 'pets.id', 'CASCADE', 'CASCADE');
            $table->foreignKey('recorded_by_user_id', 'users.id', 'CASCADE', 'CASCADE');
            $table->foreignKey('verified_by_user_id', 'users.id', 'SET NULL', 'CASCADE');
            
            // Indexes
            $table->index('idx_health_records_pet_date', ['pet_id', 'recorded_date']);
            $table->index('idx_health_records_type', ['record_type']);
            $table->index('idx_health_records_recorded_by', ['recorded_by_user_id']);
            $table->index('idx_health_records_verified', ['veterinarian_verified']);
        });
    }

    public function down(): void
    {
        $this->dropTable('health_records');
    }
}