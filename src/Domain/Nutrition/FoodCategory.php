<?php

declare(strict_types=1);

namespace App\Domain\Nutrition;

enum FoodCategory: string
{
    case DRY_KIBBLE = 'dry_kibble';
    case WET_FOOD = 'wet_food';
    case RAW_FOOD = 'raw_food';
    case TREATS = 'treats';
    case SUPPLEMENTS = 'supplements';

    public function getDisplayName(): string
    {
        return match($this) {
            self::DRY_KIBBLE => 'Dry Kibble',
            self::WET_FOOD => 'Wet Food',
            self::RAW_FOOD => 'Raw Food',
            self::TREATS => 'Treats',
            self::SUPPLEMENTS => 'Supplements'
        };
    }

    public function getDescription(): string
    {
        return match($this) {
            self::DRY_KIBBLE => 'Dry, shelf-stable food typically in pellet form',
            self::WET_FOOD => 'Canned or pouched food with high moisture content',
            self::RAW_FOOD => 'Uncooked meat, organs, and bones',
            self::TREATS => 'Supplementary food items for rewards or training',
            self::SUPPLEMENTS => 'Vitamins, minerals, and other nutritional additives'
        };
    }

    public function getTypicalMoistureContent(): float
    {
        return match($this) {
            self::DRY_KIBBLE => 10.0, // 10%
            self::WET_FOOD => 78.0, // 78%
            self::RAW_FOOD => 70.0, // 70%
            self::TREATS => 12.0, // 12%
            self::SUPPLEMENTS => 5.0 // 5%
        };
    }
}