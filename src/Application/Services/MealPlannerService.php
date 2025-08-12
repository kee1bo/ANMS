<?php

/**
 * Meal Planner Service
 * Generates a weekly meal plan and shopping list from nutrition requirements
 */
class MealPlannerService
{
    /**
     * Generate a weekly plan with schedule and portions
     *
     * @param array $petData   ['species','age','weight']
     * @param array $calories  ['der'=>int]
     * @param array $preferences ['meals_per_day'?int,'times'?array,'dry_wet_ratio'?[0..1]]
     * @return array
     */
    public function generateWeeklyPlan(array $petData, array $calories, array $preferences = []): array
    {
        $species = strtolower($petData['species'] ?? 'dog');
        $age = (float)($petData['age'] ?? 1);
        $weight = (float)($petData['weight'] ?? 0);
        $der = (int)($calories['der'] ?? 0);

        $mealsPerDay = (int)($preferences['meals_per_day'] ?? $this->getOptimalMealsPerDay($species, $age, $weight));
        $times = $preferences['times'] ?? $this->defaultSchedule($mealsPerDay);
        $caloriesPerMeal = $mealsPerDay > 0 ? (int)round($der / $mealsPerDay) : 0;

        // Portion guidance – allow simple ratio split dry/wet (default 100% dry)
        $ratio = $preferences['dry_wet_ratio'] ?? ['dry' => 1.0, 'wet' => 0.0];
        $ratio = $this->normalizeRatio($ratio);

        // Energy densities (fallbacks if brand data not present)
        $kcalPer100gDry = 350; // typical dry
        $kcalPer100gWet = 90;  // typical wet

        $portionDryPerMealG = (int)round(($caloriesPerMeal * $ratio['dry']) / $kcalPer100gDry * 100);
        $portionWetPerMealG = (int)round(($caloriesPerMeal * $ratio['wet']) / $kcalPer100gWet * 100);

        $dayPlan = [];
        foreach ($times as $t) {
            $dayPlan[] = [
                'time' => $t,
                'calories' => $caloriesPerMeal,
                'portions' => [
                    'dry_g' => $portionDryPerMealG,
                    'wet_g' => $portionWetPerMealG,
                ]
            ];
        }

        // Build 7-day plan (same daily template for now)
        $days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        $weekly = [];
        foreach ($days as $d) {
            $weekly[] = [
                'day' => $d,
                'meals' => $dayPlan
            ];
        }

        // Shopping list totals for 7 days
        $mealsPerWeek = count($weekly) * count($dayPlan);
        $shopping = [
            'dry_g' => $portionDryPerMealG * $mealsPerWeek,
            'wet_g' => $portionWetPerMealG * $mealsPerWeek,
        ];

        return [
            'meals_per_day' => $mealsPerDay,
            'calories_per_meal' => $caloriesPerMeal,
            'times' => $times,
            'daily_template' => $dayPlan,
            'weekly_plan' => $weekly,
            'shopping_list' => $shopping,
            'portion_guidance' => [
                'dry_food_cups' => round(($caloriesPerMeal * $ratio['dry']) / 350, 2), // approx
                'wet_food_cans' => round(($caloriesPerMeal * $ratio['wet']) / 200, 1),
            ]
        ];
    }

    private function normalizeRatio(array $ratio): array
    {
        $dry = (float)($ratio['dry'] ?? 1.0);
        $wet = (float)($ratio['wet'] ?? 0.0);
        $sum = max(0.0001, $dry + $wet);
        return ['dry' => $dry / $sum, 'wet' => $wet / $sum];
    }

    private function getOptimalMealsPerDay(string $species, float $age, float $weight): int
    {
        if ($species === 'cat') {
            return $age < 1 ? 4 : 2;
        }
        // dogs
        if ($age < 0.5) return 4;
        if ($age < 1) return 3;
        if ($weight < 10) return 3;
        return 2;
    }

    private function defaultSchedule(int $mealsPerDay): array
    {
        $schedules = [
            1 => ['08:00'],
            2 => ['08:00','18:00'],
            3 => ['07:30','13:00','19:30'],
            4 => ['07:00','12:00','17:00','21:00']
        ];
        return $schedules[$mealsPerDay] ?? $schedules[2];
    }
}

?>


