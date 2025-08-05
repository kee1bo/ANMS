<?php

declare(strict_types=1);

namespace App\Domain\Pet;

enum ActivityLevel: string
{
    case LOW = 'low';
    case MODERATE = 'moderate';
    case HIGH = 'high';

    public function getDisplayName(): string
    {
        return match($this) {
            self::LOW => 'Low Activity',
            self::MODERATE => 'Moderate Activity',
            self::HIGH => 'High Activity'
        };
    }

    public function getDescription(): string
    {
        return match($this) {
            self::LOW => 'Mostly sedentary, minimal exercise',
            self::MODERATE => 'Regular walks and some playtime',
            self::HIGH => 'Very active, lots of exercise and play'
        };
    }

    public function getMultiplier(): float
    {
        return match($this) {
            self::LOW => 1.2,
            self::MODERATE => 1.6,
            self::HIGH => 2.0
        };
    }
}