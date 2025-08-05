<?php

declare(strict_types=1);

namespace App\Domain\Pet;

enum PetGender: string
{
    case MALE = 'male';
    case FEMALE = 'female';
    case UNKNOWN = 'unknown';

    public function getDisplayName(): string
    {
        return match($this) {
            self::MALE => 'Male',
            self::FEMALE => 'Female',
            self::UNKNOWN => 'Unknown'
        };
    }
}