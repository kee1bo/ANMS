<?php

declare(strict_types=1);

use Database\Migration;

class CreateSessionsTable extends Migration
{
    public function up(): void
    {
        $this->createTable('sessions', function ($table) {
            $table->string('id', 255)->notNull();
            $table->bigInteger('user_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload')->notNull();
            $table->integer('last_activity')->notNull();
            
            // Primary key
            $this->db->exec("ALTER TABLE sessions ADD PRIMARY KEY (id)");
            
            // Foreign key
            $table->foreignKey('user_id', 'users.id', 'CASCADE', 'CASCADE');
            
            // Indexes
            $table->index('idx_sessions_user_id', ['user_id']);
            $table->index('idx_sessions_last_activity', ['last_activity']);
        });
    }

    public function down(): void
    {
        $this->dropTable('sessions');
    }
}