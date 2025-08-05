<?php

declare(strict_types=1);

use Database\Migration;

class CreateUsersTable extends Migration
{
    public function up(): void
    {
        $this->createTable('users', function ($table) {
            $table->id();
            $table->string('email')->unique()->notNull();
            $table->string('password_hash')->notNull();
            $table->string('first_name', 100)->notNull();
            $table->string('last_name', 100)->notNull();
            $table->enum('role', ['pet_owner', 'veterinarian', 'admin'])->default("'pet_owner'");
            $table->string('location')->nullable();
            $table->string('phone', 20)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('two_factor_secret')->nullable();
            $table->json('preferences')->nullable();
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable();
            
            // Indexes
            $table->index('idx_users_email', ['email']);
            $table->index('idx_users_role', ['role']);
            $table->index('idx_users_deleted_at', ['deleted_at']);
        });
    }

    public function down(): void
    {
        $this->dropTable('users');
    }
}