<?php

declare(strict_types=1);

namespace App\Domain\Pet;

enum LifeStage: string
{
    case PUPPY = 'puppy';
    case KITTEN = 'kitten';
    case ADULT = 'adult';
    case SENIOR = 'senior';

    public function getDisplayName(): string
    {
        return match($this) {
            self::PUPPY => 'Puppy',
            self::KITTEN => 'Kitten',
            self::ADULT => 'Adult',
            self::SENIOR => 'Senior'
        };
    }

    public function getNutritionalMultiplier(): float
    {
        return match($this) {
            self::PUPPY => 2.0,
            self::KITTEN => 2.5,
            self::ADULT => 1.0,
            self::SENIOR => 0.8
        };
    }

    public function getProteinRequirement(): float
    {
        // Minimum protein percentage for life stage
        return match($this) {
            self::PUPPY => 22.5,
            self::KITTEN => 26.0,
            self::ADULT => 18.0,
            self::SENIOR => 18.0
        };
    }
}