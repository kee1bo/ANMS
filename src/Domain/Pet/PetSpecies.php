<?php

declare(strict_types=1);

namespace App\Domain\Pet;

enum PetSpecies: string
{
    case DOG = 'dog';
    case CAT = 'cat';
    case RABBIT = 'rabbit';
    case BIRD = 'bird';
    case OTHER = 'other';

    public function getDisplayName(): string
    {
        return match($this) {
            self::DOG => 'Dog',
            self::CAT => 'Cat',
            self::RABBIT => 'Rabbit',
            self::BIRD => 'Bird',
            self::OTHER => 'Other'
        };
    }

    public function getTypicalLifespan(): array
    {
        return match($this) {
            self::DOG => ['min' => 10, 'max' => 16],
            self::CAT => ['min' => 12, 'max' => 18],
            self::RABBIT => ['min' => 8, 'max' => 12],
            self::BIRD => ['min' => 5, 'max' => 100], // Varies greatly by species
            self::OTHER => ['min' => 1, 'max' => 50]
        };
    }

    public function getCommonBreeds(): array
    {
        return match($this) {
            self::DOG => [
                'Golden Retriever',
                'Labrador Retriever',
                'German Shepherd',
                'French Bulldog',
                'Bulldog',
                'Poodle',
                'Beagle',
                'Rottweiler',
                'Yorkshire Terrier',
                'Dachshund'
            ],
            self::CAT => [
                'Persian',
                'Maine Coon',
                'British Shorthair',
                'Ragdoll',
                'Bengal',
                'Abyssinian',
                'Birman',
                'Oriental Shorthair',
                'Siamese',
                'American Shorthair'
            ],
            self::RABBIT => [
                'Holland Lop',
                'Netherland Dwarf',
                'Mini Rex',
                'Lionhead',
                'Flemish Giant',
                'English Angora',
                'Dutch',
                'Mini Lop'
            ],
            self::BIRD => [
                'Budgerigar',
                'Cockatiel',
                'Canary',
                'Lovebird',
                'Conure',
                'African Grey',
                'Macaw',
                'Cockatoo'
            ],
            self::OTHER => []
        };
    }

    public function getBasalMetabolicRate(float $weightKg): float
    {
        // Returns BMR in kcal/day based on species and weight
        return match($this) {
            self::DOG => 70 * pow($weightKg, 0.75),
            self::CAT => 70 * pow($weightKg, 0.67),
            self::RABBIT => 60 * pow($weightKg, 0.75),
            self::BIRD => 78 * pow($weightKg, 0.75),
            self::OTHER => 70 * pow($weightKg, 0.75)
        };
    }
}