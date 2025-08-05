<?php

declare(strict_types=1);

namespace App\Domain\Pet;

enum WeightStatus: string
{
    case UNDERWEIGHT = 'underweight';
    case IDEAL = 'ideal';
    case OVERWEIGHT = 'overweight';

    public function getDisplayName(): string
    {
        return match($this) {
            self::UNDERWEIGHT => 'Underweight',
            self::IDEAL => 'Ideal Weight',
            self::OVERWEIGHT => 'Overweight'
        };
    }

    public function getColorClass(): string
    {
        return match($this) {
            self::UNDERWEIGHT => 'text-blue-600',
            self::IDEAL => 'text-green-600',
            self::OVERWEIGHT => 'text-yellow-600'
        };
    }

    public function getRecommendation(): string
    {
        return match($this) {
            self::UNDERWEIGHT => 'Consider increasing caloric intake and consult your veterinarian',
            self::IDEAL => 'Maintain current diet and exercise routine',
            self::OVERWEIGHT => 'Consider reducing caloric intake and increasing exercise'
        };
    }
}