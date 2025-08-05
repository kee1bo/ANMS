<?php

declare(strict_types=1);

namespace App\Domain\Health;

use DateTime;
use InvalidArgumentException;

class HealthRecord
{
    private int $id;
    private int $petId;
    private HealthRecordType $recordType;
    private DateTime $recordedDate;
    private ?string $recordedTime;
    private ?float $numericValue;
    private ?string $textValue;
    private ?array $jsonData;
    private int $recordedByUserId;
    private bool $veterinarianVerified;
    private ?int $verifiedByUserId;
    private ?DateTime $verifiedAt;
    private ?array $attachments;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        int $petId,
        HealthRecordType $recordType,
        DateTime $recordedDate,
        int $recordedByUserId,
        ?string $recordedTime = null,
        ?float $numericValue = null,
        ?string $textValue = null,
        ?array $jsonData = null,
        ?array $attachments = null
    ) {
        $this->validateData($recordType, $numericValue, $textValue, $jsonData);
        
        $this->petId = $petId;
        $this->recordType = $recordType;
        $this->recordedDate = $recordedDate;
        $this->recordedByUserId = $recordedByUserId;
        $this->recordedTime = $recordedTime;
        $this->numericValue = $numericValue;
        $this->textValue = $textValue;
        $this->jsonData = $jsonData;
        $this->attachments = $attachments;
        $this->veterinarianVerified = false;
        $this->verifiedByUserId = null;
        $this->verifiedAt = null;
        $this->createdAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    private function validateData(
        HealthRecordType $recordType,
        ?float $numericValue,
        ?string $textValue,
        ?array $jsonData
    ): void {
        // Ensure at least one data field is provided
        if ($numericValue === null && $textValue === null && $jsonData === null) {
            throw new InvalidArgumentException('At least one data field must be provided');
        }

        // Validate numeric values based on record type
        if ($numericValue !== null) {
            switch ($recordType) {
                case HealthRecordType::WEIGHT:
                    if ($numericValue <= 0 || $numericValue > 1000) {
                        throw new InvalidArgumentException('Weight must be between 0 and 1000 kg');
                    }
                    break;
                case HealthRecordType::BODY_CONDITION:
                    if ($numericValue < 1 || $numericValue > 9) {
                        throw new InvalidArgumentException('Body condition score must be between 1 and 9');
                    }
                    break;
                case HealthRecordType::ACTIVITY:
                    if ($numericValue < 0 || $numericValue > 24) {
                        throw new InvalidArgumentException('Activity hours must be between 0 and 24');
                    }
                    break;
            }
        }
    }

    // Getters
    public function getId(): int
    {
        return $this->id;
    }

    public function getPetId(): int
    {
        return $this->petId;
    }

    public function getRecordType(): HealthRecordType
    {
        return $this->recordType;
    }

    public function getRecordedDate(): DateTime
    {
        return $this->recordedDate;
    }

    public function getRecordedTime(): ?string
    {
        return $this->recordedTime;
    }

    public function getNumericValue(): ?float
    {
        return $this->numericValue;
    }

    public function getTextValue(): ?string
    {
        return $this->textValue;
    }

    public function getJsonData(): ?array
    {
        return $this->jsonData;
    }

    public function getRecordedByUserId(): int
    {
        return $this->recordedByUserId;
    }

    public function isVeterinarianVerified(): bool
    {
        return $this->veterinarianVerified;
    }

    public function getVerifiedByUserId(): ?int
    {
        return $this->verifiedByUserId;
    }

    public function getVerifiedAt(): ?DateTime
    {
        return $this->verifiedAt;
    }

    public function getAttachments(): ?array
    {
        return $this->attachments;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    // Business methods
    public function verifyByVeterinarian(int $veterinarianId): void
    {
        $this->veterinarianVerified = true;
        $this->verifiedByUserId = $veterinarianId;
        $this->verifiedAt = new DateTime();
        $this->updatedAt = new DateTime();
    }

    public function updateValue(
        ?float $numericValue = null,
        ?string $textValue = null,
        ?array $jsonData = null
    ): void {
        $this->validateData($this->recordType, $numericValue, $textValue, $jsonData);
        
        if ($numericValue !== null) {
            $this->numericValue = $numericValue;
        }
        if ($textValue !== null) {
            $this->textValue = $textValue;
        }
        if ($jsonData !== null) {
            $this->jsonData = $jsonData;
        }
        
        $this->updatedAt = new DateTime();
    }

    public function addAttachment(string $filename, string $path, string $type): void
    {
        if ($this->attachments === null) {
            $this->attachments = [];
        }
        
        $this->attachments[] = [
            'filename' => $filename,
            'path' => $path,
            'type' => $type,
            'uploaded_at' => (new DateTime())->format('Y-m-d H:i:s')
        ];
        
        $this->updatedAt = new DateTime();
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id ?? null,
            'pet_id' => $this->petId,
            'record_type' => $this->recordType->value,
            'recorded_date' => $this->recordedDate->format('Y-m-d'),
            'recorded_time' => $this->recordedTime,
            'numeric_value' => $this->numericValue,
            'text_value' => $this->textValue,
            'json_data' => $this->jsonData ? json_encode($this->jsonData) : null,
            'recorded_by_user_id' => $this->recordedByUserId,
            'veterinarian_verified' => $this->veterinarianVerified,
            'verified_by_user_id' => $this->verifiedByUserId,
            'verified_at' => $this->verifiedAt?->format('Y-m-d H:i:s'),
            'attachments' => $this->attachments ? json_encode($this->attachments) : null,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s')
        ];
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }
}