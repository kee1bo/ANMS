<?php

declare(strict_types=1);

use Database\Migration;

class CreateEducationalContentTable extends Migration
{
    public function up(): void
    {
        $this->createTable('educational_content', function ($table) {
            $table->id();
            $table->string('title', 255)->notNull();
            $table->string('slug', 255)->unique()->notNull();
            $table->text('excerpt')->nullable();
            $table->longText('content')->notNull();
            $table->string('content_type', 50)->default("'article'"); // article, guide, video, infographic
            $table->string('category', 100)->notNull();
            $table->json('tags')->nullable();
            $table->string('target_species', 100)->nullable();
            $table->string('difficulty_level', 20)->default("'beginner'"); // beginner, intermediate, advanced
            $table->integer('reading_time_minutes')->nullable();
            $table->string('featured_image', 500)->nullable();
            $table->json('media_attachments')->nullable();
            $table->bigInteger('author_id')->notNull();
            $table->bigInteger('reviewed_by_id')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->enum('status', ['draft', 'review', 'published', 'archived'])->default("'draft'");
            $table->timestamp('published_at')->nullable();
            $table->integer('view_count')->default('0');
            $table->decimal('average_rating', 3, 2)->default('0.00');
            $table->integer('rating_count')->default('0');
            $table->json('seo_meta')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreignKey('author_id', 'users.id', 'CASCADE', 'CASCADE');
            $table->foreignKey('reviewed_by_id', 'users.id', 'SET NULL', 'CASCADE');
            
            // Indexes
            $table->index('idx_educational_content_category', ['category']);
            $table->index('idx_educational_content_species', ['target_species']);
            $table->index('idx_educational_content_status', ['status']);
            $table->index('idx_educational_content_published', ['published_at']);
            $table->index('idx_educational_content_author', ['author_id']);
        });
        
        // Add full-text search index
        $this->db->exec("ALTER TABLE educational_content ADD FULLTEXT(title, excerpt, content)");
    }

    public function down(): void
    {
        $this->dropTable('educational_content');
    }
}