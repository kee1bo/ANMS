<?php

declare(strict_types=1);

namespace App\Application\Services\CodebaseAnalysis;

/**
 * Tracks progress of analysis and cleanup operations
 */
class ProgressTracker
{
    private int $totalItems = 0;
    private int $processedItems = 0;
    private string $currentOperation = '';
    private array $operationHistory = [];
    private float $startTime;

    public function __construct()
    {
        $this->startTime = microtime(true);
    }

    /**
     * Set the total number of items to process
     */
    public function setTotal(int $total): void
    {
        $this->totalItems = $total;
        $this->processedItems = 0;
    }

    /**
     * Increment processed items count
     */
    public function increment(int $count = 1): void
    {
        $this->processedItems += $count;
    }

    /**
     * Set current operation description
     */
    public function setCurrentOperation(string $operation): void
    {
        if ($this->currentOperation !== '') {
            $this->operationHistory[] = [
                'operation' => $this->currentOperation,
                'completed_at' => microtime(true),
                'items_processed' => $this->processedItems
            ];
        }
        
        $this->currentOperation = $operation;
    }

    /**
     * Get current progress percentage
     */
    public function getProgressPercentage(): float
    {
        if ($this->totalItems === 0) {
            return 0.0;
        }
        
        return min(100.0, ($this->processedItems / $this->totalItems) * 100);
    }

    /**
     * Get estimated time remaining in seconds
     */
    public function getEstimatedTimeRemaining(): ?float
    {
        if ($this->processedItems === 0 || $this->totalItems === 0) {
            return null;
        }

        $elapsed = microtime(true) - $this->startTime;
        $rate = $this->processedItems / $elapsed;
        $remaining = $this->totalItems - $this->processedItems;

        return $remaining / $rate;
    }

    /**
     * Get elapsed time in seconds
     */
    public function getElapsedTime(): float
    {
        return microtime(true) - $this->startTime;
    }

    /**
     * Get current status summary
     */
    public function getStatus(): array
    {
        return [
            'total_items' => $this->totalItems,
            'processed_items' => $this->processedItems,
            'progress_percentage' => $this->getProgressPercentage(),
            'current_operation' => $this->currentOperation,
            'elapsed_time' => $this->getElapsedTime(),
            'estimated_time_remaining' => $this->getEstimatedTimeRemaining(),
            'items_per_second' => $this->getItemsPerSecond()
        ];
    }

    /**
     * Get processing rate (items per second)
     */
    public function getItemsPerSecond(): float
    {
        $elapsed = $this->getElapsedTime();
        return $elapsed > 0 ? $this->processedItems / $elapsed : 0.0;
    }

    /**
     * Get formatted progress string
     */
    public function getFormattedProgress(): string
    {
        $percentage = number_format($this->getProgressPercentage(), 1);
        $elapsed = $this->formatTime($this->getElapsedTime());
        $remaining = $this->getEstimatedTimeRemaining();
        $remainingFormatted = $remaining ? $this->formatTime($remaining) : 'unknown';

        return sprintf(
            '[%s%%] %d/%d items | %s | Elapsed: %s | Remaining: %s',
            $percentage,
            $this->processedItems,
            $this->totalItems,
            $this->currentOperation,
            $elapsed,
            $remainingFormatted
        );
    }

    /**
     * Format time in human-readable format
     */
    private function formatTime(float $seconds): string
    {
        if ($seconds < 60) {
            return sprintf('%.1fs', $seconds);
        } elseif ($seconds < 3600) {
            return sprintf('%dm %.1fs', (int)($seconds / 60), $seconds % 60);
        } else {
            $hours = (int)($seconds / 3600);
            $minutes = (int)(($seconds % 3600) / 60);
            $secs = $seconds % 60;
            return sprintf('%dh %dm %.1fs', $hours, $minutes, $secs);
        }
    }

    /**
     * Check if operation is complete
     */
    public function isComplete(): bool
    {
        return $this->processedItems >= $this->totalItems && $this->totalItems > 0;
    }

    /**
     * Reset progress tracking
     */
    public function reset(): void
    {
        $this->totalItems = 0;
        $this->processedItems = 0;
        $this->currentOperation = '';
        $this->operationHistory = [];
        $this->startTime = microtime(true);
    }

    /**
     * Get operation history
     */
    public function getOperationHistory(): array
    {
        return $this->operationHistory;
    }
}