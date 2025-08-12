<?php

/**
 * Nutrition Engine Service
 * Implements species-aware RER/DER and macronutrient derivation based on research
 */
class NutritionEngineService
{
    public function calculate(array $petData): array
    {
        $species = strtolower($petData['species'] ?? 'dog');
        $weight = (float)($petData['weight'] ?? 0);
        $age = (float)($petData['age'] ?? 1);
        $activity = strtolower($petData['activity_level'] ?? 'medium');
        $lifeStage = $this->inferLifeStage($age, $species);
        $bcs = strtolower($petData['body_condition'] ?? 'ideal');
        $spay = strtolower($petData['spay_neuter'] ?? 'altered');

        $rer = $this->calculateRER($weight, $species);
        $lifestageMult = $this->lifeStageMultiplier($species, $lifeStage);
        $activityMult = $this->activityMultiplier($activity);
        $bcsMult = $this->bcsMultiplier($bcs);
        $spayMult = $spay === 'altered' ? 0.95 : 1.0; // modest reduction

        $der = (int)round($rer * $lifestageMult * $activityMult * $bcsMult * $spayMult);

        // Macronutrients – species defaults (grams/day and %)
        $proteinPerKg = $species === 'cat' ? 4.0 : 2.5; // g/kg/day
        $proteinGrams = round($weight * $proteinPerKg, 1);
        $fatPct = $species === 'cat' ? 20 : 15; // % of calories
        $fatCalories = $der * ($fatPct / 100);
        $fatGrams = round($fatCalories / 9, 1);
        $proteinCalories = $proteinGrams * 4;
        $carbCalories = max(0, $der - $proteinCalories - $fatCalories);
        $carbGrams = round($carbCalories / 4, 1);

        $warnings = [];
        $expected = $this->expectedDerRange($species, $weight, $age);
        if ($der < $expected['min'] || $der > $expected['max']) {
            $warnings[] = "DER $der out of expected range {$expected['min']}-{$expected['max']}";
        }

        return [
            'rer' => (int)round($rer),
            'der' => $der,
            'lifestage' => $lifeStage,
            'lifestage_multiplier' => $lifestageMult,
            'activity_multiplier' => $activityMult,
            'bcs_multiplier' => $bcsMult,
            'spay_multiplier' => $spayMult,
            'macros' => [
                'protein_grams' => $proteinGrams,
                'fat_grams' => $fatGrams,
                'carbohydrate_grams' => $carbGrams,
                'protein_pct' => round(($proteinCalories / max(1,$der)) * 100, 1),
                'fat_pct' => $fatPct,
                'carbohydrate_pct' => round(($carbCalories / max(1,$der)) * 100, 1)
            ],
            'warnings' => $warnings,
            'calculation_method' => 'ANMS-Engine v1'
        ];
    }

    private function calculateRER(float $weight, string $species): float
    {
        if ($weight <= 0) return 0.0;
        if ($species === 'cat') {
            // Switch to linear approximation within typical range when appropriate
            if ($weight >= 2.0 && $weight <= 10.0) {
                return 30 * $weight + 70;
            }
            return 70 * pow($weight, 0.75);
        }
        // dogs and default
        return 70 * pow($weight, 0.75);
    }

    private function inferLifeStage(float $age, string $species): string
    {
        if ($species === 'cat') {
            if ($age < 1) return 'kitten';
            if ($age >= 7) return 'senior';
            return 'adult';
        }
        // dog
        if ($age < 1) return 'puppy';
        if ($age >= 7) return 'senior';
        return 'adult';
    }

    private function lifeStageMultiplier(string $species, string $stage): float
    {
        $dog = ['puppy'=>2.0,'adult'=>1.6,'senior'=>1.4];
        $cat = ['kitten'=>2.5,'adult'=>1.4,'senior'=>1.2];
        $map = $species === 'cat' ? $cat : $dog;
        return $map[$stage] ?? 1.6;
    }

    private function activityMultiplier(string $activity): float
    {
        $map = ['low'=>1.2,'medium'=>1.4,'high'=>1.8];
        return $map[$activity] ?? 1.4;
    }

    private function bcsMultiplier(string $bcs): float
    {
        $map = ['underweight'=>1.15,'ideal'=>1.0,'overweight'=>0.85,'obese'=>0.7];
        return $map[$bcs] ?? 1.0;
    }

    private function expectedDerRange(string $species, float $weight, float $age): array
    {
        $base = $this->calculateRER($weight, $species);
        return ['min' => (int)round($base * 1.2), 'max' => (int)round($base * 2.5)];
    }
}

?>


