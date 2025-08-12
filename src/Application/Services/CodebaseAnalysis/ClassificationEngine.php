<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis;

use App\Application\Services\CodebaseAnalysis\Models\FileAnalysisResult;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

/**
 * Engine for combining and classifying analysis results from multiple analyzers
 */
class ClassificationEngine
{
    private LoggerInterface $logger;
    private array $categoryWeights = [
        FileAnalysisResult::CATEGORY_ESSENTIAL => 1.0,
        FileAnalysisResult::CATEGORY_NON_ESSENTIAL => 1.0,
        FileAnalysisResult::CATEGORY_UNCERTAIN => 0.8
    ];

    public function __construct(?LoggerInterface $logger = null)
    {
        $this->logger = $logger ?? new NullLogger();
    }

    /**
     * Combine results from multiple analyzers with weighted scoring
     */
    public function combineResults(string $filePath, array $results): FileAnalysisResult
    {
        if (empty($results)) {
            return new FileAnalysisResult(
                filePath: $filePath,
                category: FileAnalysisResult::CATEGORY_UNCERTAIN,
                confidenceScore: 0,
                reasons: ['No analysis results available'],
                recommendedAction: FileAnalysisResult::ACTION_REVIEW
            );
        }

        $this->logger->debug('Combining results for file', [
            'file' => $filePath,
            'analyzer_count' => count($results)
        ]);

        // Handle single result
        if (count($results) === 1) {
            return reset($results);
        }

        // Combine multiple results
        $combinedResult = $this->performWeightedCombination($filePath, $results);
        
        // Apply conflict resolution
        $resolvedResult = $this->resolveConflicts($combinedResult, $results);
        
        // Apply edge case handling
        $finalResult = $this->handleEdgeCases($resolvedResult);

        $this->logger->debug('Combined analysis result', [
            'file' => $filePath,
            'final_category' => $finalResult->category,
            'final_confidence' => $finalResult->confidenceScore,
            'final_action' => $finalResult->recommendedAction
        ]);

        return $finalResult;
    }

    /**
     * Perform weighted combination of multiple analysis results
     */
    private function performWeightedCombination(string $filePath, array $results): FileAnalysisResult
    {
        $categoryScores = [
            FileAnalysisResult::CATEGORY_ESSENTIAL => 0,
            FileAnalysisResult::CATEGORY_NON_ESSENTIAL => 0,
            FileAnalysisResult::CATEGORY_UNCERTAIN => 0
        ];

        $totalWeight = 0;
        $allReasons = [];
        $allDependencies = [];
        $allReferences = [];
        $allMetadata = [];

        foreach ($results as $result) {
            $analyzerWeight = $this->getAnalyzerWeight($result);
            $confidenceWeight = $result->confidenceScore / 100;
            $categoryWeight = $this->categoryWeights[$result->category];
            
            $combinedWeight = $analyzerWeight * $confidenceWeight * $categoryWeight;
            
            $categoryScores[$result->category] += $combinedWeight;
            $totalWeight += $combinedWeight;

            // Collect all data
            $allReasons = array_merge($allReasons, $result->reasons);
            $allDependencies = array_merge($allDependencies, $result->dependencies);
            $allReferences = array_merge($allReferences, $result->references);
            $allMetadata = array_merge($allMetadata, $result->metadata);
        }

        // Determine final category
        $finalCategory = $this->determineFinalCategory($categoryScores, $totalWeight);
        
        // Calculate final confidence
        $finalConfidence = $this->calculateFinalConfidence($categoryScores, $totalWeight, $finalCategory);
        
        // Determine recommended action
        $recommendedAction = $this->determineRecommendedAction($finalCategory, $finalConfidence, $results);

        return new FileAnalysisResult(
            filePath: $filePath,
            category: $finalCategory,
            confidenceScore: $finalConfidence,
            reasons: array_unique($allReasons),
            dependencies: array_unique($allDependencies),
            references: array_unique($allReferences),
            recommendedAction: $recommendedAction,
            metadata: $allMetadata
        );
    }

    /**
     * Get weight for analyzer based on its type and reliability
     */
    private function getAnalyzerWeight(FileAnalysisResult $result): float
    {
        // Determine analyzer type from metadata or reasons
        $analyzerType = $this->inferAnalyzerType($result);
        
        $weights = [
            'dependency' => 1.0,    // Highest weight - dependency analysis is most reliable
            'usage' => 0.9,         // High weight - actual usage is very important
            'functional' => 0.8,    // Medium-high weight - functional role is important
            'pattern' => 0.7,       // Medium weight - patterns are good indicators
            'unknown' => 0.5        // Lower weight for unknown analyzers
        ];

        return $weights[$analyzerType] ?? 0.5;
    }

    /**
     * Infer analyzer type from result characteristics
     */
    private function inferAnalyzerType(FileAnalysisResult $result): string
    {
        // Check metadata for analyzer hints
        if (isset($result->metadata['is_psr4_file']) || isset($result->metadata['dependency_count'])) {
            return 'dependency';
        }
        
        if (isset($result->metadata['asset_references']) || isset($result->metadata['api_endpoints'])) {
            return 'usage';
        }
        
        if (isset($result->metadata['functional_role']) || isset($result->metadata['layer'])) {
            return 'functional';
        }
        
        if (isset($result->metadata['pattern_type']) || isset($result->metadata['file_type'])) {
            return 'pattern';
        }

        // Check reasons for analyzer hints
        $reasonsText = implode(' ', $result->reasons);
        if (str_contains($reasonsText, 'PSR-4') || str_contains($reasonsText, 'dependency')) {
            return 'dependency';
        }
        
        if (str_contains($reasonsText, 'referenced') || str_contains($reasonsText, 'usage')) {
            return 'usage';
        }
        
        if (str_contains($reasonsText, 'functional') || str_contains($reasonsText, 'role')) {
            return 'functional';
        }
        
        if (str_contains($reasonsText, 'pattern') || str_contains($reasonsText, 'matches')) {
            return 'pattern';
        }

        return 'unknown';
    }

    /**
     * Determine final category from weighted scores
     */
    private function determineFinalCategory(array $categoryScores, float $totalWeight): string
    {
        if ($totalWeight === 0.0) {
            return FileAnalysisResult::CATEGORY_UNCERTAIN;
        }

        // Normalize scores
        $normalizedScores = [];
        foreach ($categoryScores as $category => $score) {
            $normalizedScores[$category] = $score / $totalWeight;
        }

        // Find category with highest score
        $maxScore = max($normalizedScores);
        $maxCategories = array_keys($normalizedScores, $maxScore);

        // Handle ties
        if (count($maxCategories) > 1) {
            return $this->resolveCategoryTie($maxCategories, $normalizedScores);
        }

        return $maxCategories[0];
    }

    /**
     * Resolve ties between categories
     */
    private function resolveCategoryTie(array $tiedCategories, array $scores): string
    {
        // Priority order: essential > uncertain > non-essential
        $priority = [
            FileAnalysisResult::CATEGORY_ESSENTIAL => 3,
            FileAnalysisResult::CATEGORY_UNCERTAIN => 2,
            FileAnalysisResult::CATEGORY_NON_ESSENTIAL => 1
        ];

        $highestPriority = 0;
        $winningCategory = FileAnalysisResult::CATEGORY_UNCERTAIN;

        foreach ($tiedCategories as $category) {
            if ($priority[$category] > $highestPriority) {
                $highestPriority = $priority[$category];
                $winningCategory = $category;
            }
        }

        return $winningCategory;
    }

    /**
     * Calculate final confidence score
     */
    private function calculateFinalConfidence(array $categoryScores, float $totalWeight, string $finalCategory): int
    {
        if ($totalWeight === 0.0) {
            return 0;
        }

        // Base confidence from category score
        $categoryScore = $categoryScores[$finalCategory] / $totalWeight;
        $baseConfidence = (int)round($categoryScore * 100);

        // Apply confidence modifiers
        $modifiers = $this->getConfidenceModifiers($categoryScores, $totalWeight);
        $finalConfidence = $baseConfidence + $modifiers;

        return max(0, min(100, $finalConfidence));
    }

    /**
     * Get confidence modifiers based on score distribution
     */
    private function getConfidenceModifiers(array $categoryScores, float $totalWeight): int
    {
        $modifiers = 0;

        // Calculate score distribution
        $normalizedScores = [];
        foreach ($categoryScores as $category => $score) {
            $normalizedScores[$category] = $score / $totalWeight;
        }

        // Check for consensus (high agreement between analyzers)
        $maxScore = max($normalizedScores);
        $secondMaxScore = 0;
        
        foreach ($normalizedScores as $score) {
            if ($score < $maxScore && $score > $secondMaxScore) {
                $secondMaxScore = $score;
            }
        }

        $consensus = $maxScore - $secondMaxScore;
        
        if ($consensus > 0.6) {
            $modifiers += 15; // High consensus bonus
        } elseif ($consensus > 0.3) {
            $modifiers += 10; // Medium consensus bonus
        } elseif ($consensus < 0.1) {
            $modifiers -= 15; // Low consensus penalty
        }

        return $modifiers;
    }

    /**
     * Determine recommended action based on category and confidence
     */
    private function determineRecommendedAction(string $category, int $confidence, array $results): string
    {
        // Check for explicit action recommendations from analyzers
        $actionVotes = [];
        foreach ($results as $result) {
            if ($result->recommendedAction) {
                $actionVotes[] = $result->recommendedAction;
            }
        }

        // If there's consensus on action, use it
        if (!empty($actionVotes)) {
            $actionCounts = array_count_values($actionVotes);
            $topAction = array_keys($actionCounts, max($actionCounts))[0];
            
            // Verify action is consistent with category and confidence
            if ($this->isActionConsistent($topAction, $category, $confidence)) {
                return $topAction;
            }
        }

        // Default action based on category and confidence
        return match ($category) {
            FileAnalysisResult::CATEGORY_ESSENTIAL => FileAnalysisResult::ACTION_KEEP,
            FileAnalysisResult::CATEGORY_NON_ESSENTIAL => $confidence >= 70 ? 
                FileAnalysisResult::ACTION_MOVE : FileAnalysisResult::ACTION_REVIEW,
            default => FileAnalysisResult::ACTION_REVIEW
        };
    }

    /**
     * Check if action is consistent with category and confidence
     */
    private function isActionConsistent(string $action, string $category, int $confidence): bool
    {
        return match ($action) {
            FileAnalysisResult::ACTION_KEEP => $category === FileAnalysisResult::CATEGORY_ESSENTIAL,
            FileAnalysisResult::ACTION_MOVE => $category === FileAnalysisResult::CATEGORY_NON_ESSENTIAL && $confidence >= 60,
            FileAnalysisResult::ACTION_REVIEW => true, // Review is always safe
            default => false
        };
    }

    /**
     * Resolve conflicts between analyzer results
     */
    private function resolveConflicts(FileAnalysisResult $result, array $originalResults): FileAnalysisResult
    {
        // Check for major conflicts (essential vs non-essential)
        $hasEssential = false;
        $hasNonEssential = false;
        
        foreach ($originalResults as $originalResult) {
            if ($originalResult->category === FileAnalysisResult::CATEGORY_ESSENTIAL) {
                $hasEssential = true;
            } elseif ($originalResult->category === FileAnalysisResult::CATEGORY_NON_ESSENTIAL) {
                $hasNonEssential = true;
            }
        }

        // If there's a conflict between essential and non-essential, be conservative
        if ($hasEssential && $hasNonEssential) {
            $this->logger->warning('Conflict detected between analyzers', [
                'file' => $result->filePath,
                'has_essential' => $hasEssential,
                'has_non_essential' => $hasNonEssential
            ]);

            // Be conservative - prefer essential classification
            if ($result->category === FileAnalysisResult::CATEGORY_NON_ESSENTIAL) {
                return new FileAnalysisResult(
                    filePath: $result->filePath,
                    category: FileAnalysisResult::CATEGORY_UNCERTAIN,
                    confidenceScore: max(30, $result->confidenceScore - 20),
                    reasons: array_merge($result->reasons, ['Conflicting analyzer results - requires review']),
                    dependencies: $result->dependencies,
                    references: $result->references,
                    recommendedAction: FileAnalysisResult::ACTION_REVIEW,
                    metadata: array_merge($result->metadata, ['has_conflicts' => true])
                );
            }
        }

        return $result;
    }

    /**
     * Handle edge cases and apply final adjustments
     */
    private function handleEdgeCases(FileAnalysisResult $result): FileAnalysisResult
    {
        $adjustedResult = $result;

        // Handle very low confidence scores
        if ($result->confidenceScore < 30) {
            $adjustedResult = new FileAnalysisResult(
                filePath: $result->filePath,
                category: FileAnalysisResult::CATEGORY_UNCERTAIN,
                confidenceScore: $result->confidenceScore,
                reasons: array_merge($result->reasons, ['Low confidence score - requires manual review']),
                dependencies: $result->dependencies,
                references: $result->references,
                recommendedAction: FileAnalysisResult::ACTION_REVIEW,
                metadata: $result->metadata
            );
        }

        // Handle files with many dependencies/references
        if (count($result->dependencies) > 5 || count($result->references) > 3) {
            if ($result->category === FileAnalysisResult::CATEGORY_NON_ESSENTIAL) {
                $adjustedResult = new FileAnalysisResult(
                    filePath: $result->filePath,
                    category: FileAnalysisResult::CATEGORY_UNCERTAIN,
                    confidenceScore: max(40, $result->confidenceScore - 10),
                    reasons: array_merge($result->reasons, ['High dependency/reference count - requires review']),
                    dependencies: $result->dependencies,
                    references: $result->references,
                    recommendedAction: FileAnalysisResult::ACTION_REVIEW,
                    metadata: array_merge($result->metadata, ['high_connectivity' => true])
                );
            }
        }

        // Handle critical file patterns
        $criticalPatterns = [
            'index.php',
            'composer.json',
            '.env',
            'docker-compose.yml'
        ];

        foreach ($criticalPatterns as $pattern) {
            if (str_contains($result->filePath, $pattern)) {
                if ($result->category !== FileAnalysisResult::CATEGORY_ESSENTIAL) {
                    $adjustedResult = new FileAnalysisResult(
                        filePath: $result->filePath,
                        category: FileAnalysisResult::CATEGORY_ESSENTIAL,
                        confidenceScore: max(85, $result->confidenceScore),
                        reasons: array_merge($result->reasons, ['Critical file pattern detected']),
                        dependencies: $result->dependencies,
                        references: $result->references,
                        recommendedAction: FileAnalysisResult::ACTION_KEEP,
                        metadata: array_merge($result->metadata, ['critical_pattern' => $pattern])
                    );
                }
                break;
            }
        }

        return $adjustedResult;
    }

    /**
     * Set custom category weights
     */
    public function setCategoryWeights(array $weights): void
    {
        $this->categoryWeights = array_merge($this->categoryWeights, $weights);
    }

    /**
     * Get current category weights
     */
    public function getCategoryWeights(): array
    {
        return $this->categoryWeights;
    }
}