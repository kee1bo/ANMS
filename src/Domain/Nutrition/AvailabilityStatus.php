<?php

declare(strict_types=1);

namespace App\Domain\Nutrition;

enum AvailabilityStatus: string
{
    case AVAILABLE = 'available';
    case LIMITED = 'limited';
    case DISCONTINUED = 'discontinued';

    public function getDisplayName(): string
    {
        return match($this) {
            self::AVAILABLE => 'Available',
            self::LIMITED => 'Limited Availability',
            self::DISCONTINUED => 'Discontinued'
        };
    }

    public function getColorClass(): string
    {
        return match($this) {
            self::AVAILABLE => 'text-green-600',
            self::LIMITED => 'text-yellow-600',
            self::DISCONTINUED => 'text-red-600'
        };
    }

    public function isOrderable(): bool
    {
        return match($this) {
            self::AVAILABLE => true,
            self::LIMITED => true,
            self::DISCONTINUED => false
        };
    }
}