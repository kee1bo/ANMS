<?php

declare(strict_types=1);

namespace App\Domain\Health;

enum HealthRecordType: string
{
    case WEIGHT = 'weight';
    case BODY_CONDITION = 'body_condition';
    case ACTIVITY = 'activity';
    case HEALTH_NOTE = 'health_note';
    case MEDICATION = 'medication';
    case VET_VISIT = 'vet_visit';

    public function getLabel(): string
    {
        return match($this) {
            self::WEIGHT => 'Weight',
            self::BODY_CONDITION => 'Body Condition',
            self::ACTIVITY => 'Activity Level',
            self::HEALTH_NOTE => 'Health Note',
            self::MEDICATION => 'Medication',
            self::VET_VISIT => 'Veterinary Visit',
        };
    }

    public function getUnit(): ?string
    {
        return match($this) {
            self::WEIGHT => 'kg',
            self::BODY_CONDITION => '/9',
            self::ACTIVITY => 'hours',
            default => null,
        };
    }

    public function requiresNumericValue(): bool
    {
        return match($this) {
            self::WEIGHT, self::BODY_CONDITION, self::ACTIVITY => true,
            default => false,
        };
    }

    public function allowsTextValue(): bool
    {
        return match($this) {
            self::HEALTH_NOTE, self::MEDICATION, self::VET_VISIT => true,
            default => false,
        };
    }
}