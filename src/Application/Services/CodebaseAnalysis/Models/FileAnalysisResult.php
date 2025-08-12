<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis\Models;

/**
 * Result of file analysis containing categorization and metadata
 */
class FileAnalysisResult
{
    public const CATEGORY_ESSENTIAL = 'essential';
    public const CATEGORY_NON_ESSENTIAL = 'non-essential';
    public const CATEGORY_UNCERTAIN = 'uncertain';

    public const ACTION_KEEP = 'keep';
    public const ACTION_MOVE = 'move';
    public const ACTION_REVIEW = 'review';

    public function __construct(
        public readonly string $filePath,
        public readonly string $category,
        public readonly int $confidenceScore,
        public readonly array $reasons = [],
        public readonly array $dependencies = [],
        public readonly array $references = [],
        public readonly ?string $recommendedAction = null,
        public readonly array $metadata = []
    ) {
        if ($confidenceScore < 0 || $confidenceScore > 100) {
            throw new \InvalidArgumentException('Confidence score must be between 0 and 100');
        }

        if (!in_array($category, [self::CATEGORY_ESSENTIAL, self::CATEGORY_NON_ESSENTIAL, self::CATEGORY_UNCERTAIN])) {
            throw new \InvalidArgumentException('Invalid category: ' . $category);
        }

        if ($recommendedAction && !in_array($recommendedAction, [self::ACTION_KEEP, self::ACTION_MOVE, self::ACTION_REVIEW])) {
            throw new \InvalidArgumentException('Invalid recommended action: ' . $recommendedAction);
        }
    }

    /**
     * Check if this file is essential to the project
     */
    public function isEssential(): bool
    {
        return $this->category === self::CATEGORY_ESSENTIAL;
    }

    /**
     * Check if this file can be safely moved to backup
     */
    public function canBeMoved(): bool
    {
        return $this->category === self::CATEGORY_NON_ESSENTIAL && 
               $this->recommendedAction === self::ACTION_MOVE;
    }

    /**
     * Check if this file requires manual review
     */
    public function requiresReview(): bool
    {
        return $this->category === self::CATEGORY_UNCERTAIN || 
               $this->recommendedAction === self::ACTION_REVIEW;
    }

    /**
     * Get a summary of the analysis
     */
    public function getSummary(): string
    {
        $action = $this->recommendedAction ?? 'unknown';
        $reasonsText = implode(', ', $this->reasons);
        
        return sprintf(
            'File: %s | Category: %s | Confidence: %d%% | Action: %s | Reasons: %s',
            $this->filePath,
            $this->category,
            $this->confidenceScore,
            $action,
            $reasonsText
        );
    }

    /**
     * Convert to array for serialization
     */
    public function toArray(): array
    {
        return [
            'filePath' => $this->filePath,
            'category' => $this->category,
            'confidenceScore' => $this->confidenceScore,
            'reasons' => $this->reasons,
            'dependencies' => $this->dependencies,
            'references' => $this->references,
            'recommendedAction' => $this->recommendedAction,
            'metadata' => $this->metadata
        ];
    }

    /**
     * Create from array (deserialization)
     */
    public static function fromArray(array $data): self
    {
        return new self(
            filePath: $data['filePath'],
            category: $data['category'],
            confidenceScore: $data['confidenceScore'],
            reasons: $data['reasons'] ?? [],
            dependencies: $data['dependencies'] ?? [],
            references: $data['references'] ?? [],
            recommendedAction: $data['recommendedAction'] ?? null,
            metadata: $data['metadata'] ?? []
        );
    }

    /**
     * Get detailed reasoning explanation
     */
    public function getDetailedReasoning(): array
    {
        $reasoning = [
            'category_explanation' => $this->getCategoryExplanation(),
            'confidence_factors' => $this->getConfidenceFactors(),
            'action_justification' => $this->getActionJustification(),
            'risk_assessment' => $this->getRiskAssessment()
        ];

        return $reasoning;
    }

    /**
     * Get explanation for the category assignment
     */
    private function getCategoryExplanation(): string
    {
        return match ($this->category) {
            self::CATEGORY_ESSENTIAL => 'This file is essential to the project\'s core functionality and should be preserved.',
            self::CATEGORY_NON_ESSENTIAL => 'This file is not essential to core functionality and can be safely moved to backup.',
            self::CATEGORY_UNCERTAIN => 'This file\'s importance is uncertain and requires manual review before action.',
            default => 'Unknown category'
        };
    }

    /**
     * Get factors that contributed to confidence score
     */
    private function getConfidenceFactors(): array
    {
        $factors = [];
        
        if ($this->confidenceScore >= 80) {
            $factors[] = 'High confidence based on multiple strong indicators';
        } elseif ($this->confidenceScore >= 60) {
            $factors[] = 'Medium confidence with some clear indicators';
        } elseif ($this->confidenceScore >= 40) {
            $factors[] = 'Low-medium confidence with limited indicators';
        } else {
            $factors[] = 'Low confidence - requires careful review';
        }

        // Add specific factors from metadata
        if (isset($this->metadata['is_psr4_file']) && $this->metadata['is_psr4_file']) {
            $factors[] = 'Part of PSR-4 autoload structure';
        }
        
        if (isset($this->metadata['dependency_count']) && $this->metadata['dependency_count'] > 0) {
            $factors[] = sprintf('Has %d dependencies', $this->metadata['dependency_count']);
        }
        
        if (isset($this->metadata['reference_count']) && $this->metadata['reference_count'] > 0) {
            $factors[] = sprintf('Referenced by %d files', $this->metadata['reference_count']);
        }

        return $factors;
    }

    /**
     * Get justification for recommended action
     */
    private function getActionJustification(): string
    {
        return match ($this->recommendedAction) {
            self::ACTION_KEEP => 'Keep in place - file is essential or actively used',
            self::ACTION_MOVE => 'Move to backup - file is not essential to core functionality',
            self::ACTION_REVIEW => 'Manual review required - uncertain classification',
            default => 'No specific action recommended'
        };
    }

    /**
     * Get risk assessment for the recommended action
     */
    private function getRiskAssessment(): array
    {
        $risk = ['level' => 'unknown', 'factors' => []];

        if ($this->recommendedAction === self::ACTION_KEEP) {
            $risk['level'] = 'low';
            $risk['factors'] = ['File will remain in original location', 'No disruption to functionality'];
        } elseif ($this->recommendedAction === self::ACTION_MOVE) {
            if ($this->confidenceScore >= 80) {
                $risk['level'] = 'low';
                $risk['factors'] = ['High confidence in non-essential classification', 'Can be restored if needed'];
            } elseif ($this->confidenceScore >= 60) {
                $risk['level'] = 'medium';
                $risk['factors'] = ['Medium confidence - monitor for issues', 'Backup available for restoration'];
            } else {
                $risk['level'] = 'high';
                $risk['factors'] = ['Low confidence - may cause issues', 'Requires careful testing after move'];
            }
        } else {
            $risk['level'] = 'medium';
            $risk['factors'] = ['Manual review required', 'Action depends on review outcome'];
        }

        // Add specific risk factors
        if (count($this->dependencies) > 0) {
            $risk['factors'][] = sprintf('File has %d dependencies that may be affected', count($this->dependencies));
        }
        
        if (count($this->references) > 0) {
            $risk['factors'][] = sprintf('File is referenced by %d other files', count($this->references));
        }

        return $risk;
    }

    /**
     * Check if this result indicates a safe move operation
     */
    public function isSafeToMove(): bool
    {
        return $this->category === self::CATEGORY_NON_ESSENTIAL && 
               $this->confidenceScore >= 70 && 
               $this->recommendedAction === self::ACTION_MOVE;
    }

    /**
     * Check if this result requires immediate attention
     */
    public function requiresImmediateAttention(): bool
    {
        return $this->category === self::CATEGORY_UNCERTAIN && 
               $this->confidenceScore < 50;
    }

    /**
     * Get priority level for processing
     */
    public function getPriorityLevel(): string
    {
        if ($this->category === self::CATEGORY_ESSENTIAL) {
            return 'critical';
        }
        
        if ($this->requiresImmediateAttention()) {
            return 'high';
        }
        
        if ($this->isSafeToMove()) {
            return 'low';
        }
        
        return 'medium';
    }

    /**
     * Merge with another analysis result (for combining analyzer outputs)
     */
    public function mergeWith(FileAnalysisResult $other): self
    {
        if ($this->filePath !== $other->filePath) {
            throw new \InvalidArgumentException('Cannot merge results for different files');
        }

        // Combine reasons, dependencies, references, and metadata
        $mergedReasons = array_unique(array_merge($this->reasons, $other->reasons));
        $mergedDependencies = array_unique(array_merge($this->dependencies, $other->dependencies));
        $mergedReferences = array_unique(array_merge($this->references, $other->references));
        $mergedMetadata = array_merge($this->metadata, $other->metadata);

        // Use the result with higher confidence as base
        $primary = $this->confidenceScore >= $other->confidenceScore ? $this : $other;

        return new self(
            filePath: $this->filePath,
            category: $primary->category,
            confidenceScore: max($this->confidenceScore, $other->confidenceScore),
            reasons: $mergedReasons,
            dependencies: $mergedDependencies,
            references: $mergedReferences,
            recommendedAction: $primary->recommendedAction,
            metadata: $mergedMetadata
        );
    }
}