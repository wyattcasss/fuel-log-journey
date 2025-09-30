import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FoodEntry {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealCardProps {
  title: string;
  icon: React.ReactNode;
  entries: FoodEntry[];
  onAddFood: () => void;
}

const MealCard = ({ title, icon, entries, onAddFood }: MealCardProps) => {
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <div className="text-lg font-bold text-primary">{totalCalories} cal</div>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No entries yet</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex justify-between items-center py-1 text-sm">
              <span className="text-foreground">{entry.food_name}</span>
              <span className="text-muted-foreground">{entry.calories} cal</span>
            </div>
          ))
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={onAddFood}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Food
        </Button>
      </CardContent>
    </Card>
  );
};

export default MealCard;
