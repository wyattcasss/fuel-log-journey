import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CalorieRing from "@/components/CalorieRing";
import MacroBar from "@/components/MacroBar";
import MealCard from "@/components/MealCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Coffee, Sun, Moon, Cookie, User, TrendingUp, LogOut, Apple, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("");
  const [foodForm, setFoodForm] = useState({
    food_name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await loadProfile(session.user.id);
    await loadTodayEntries(session.user.id);
    setLoading(false);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      if (error.code === "PGRST116") {
        navigate("/onboarding");
      }
      return;
    }

    if (!data.full_name) {
      navigate("/onboarding");
      return;
    }

    setProfile(data);
  };

  const loadTodayEntries = async (userId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", today)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading entries:", error);
      return;
    }

    setTodayEntries(data || []);
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("food_entries").insert({
      user_id: user.id,
      meal_type: selectedMeal,
      food_name: foodForm.food_name,
      calories: parseInt(foodForm.calories),
      protein: parseFloat(foodForm.protein),
      carbs: parseFloat(foodForm.carbs),
      fat: parseFloat(foodForm.fat),
    });

    if (error) {
      toast.error("Failed to add food");
      return;
    }

    toast.success("Food added successfully!");
    setDialogOpen(false);
    setFoodForm({ food_name: "", calories: "", protein: "", carbs: "", fat: "" });
    loadTodayEntries(user.id);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totals = todayEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fat: acc.fat + (entry.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const getMealEntries = (mealType: string) =>
    todayEntries.filter((entry) => entry.meal_type === mealType);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cookie className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Fitify</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/progress")}>
              <TrendingUp className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"}!
          </h2>
          <p className="text-muted-foreground">Track your nutrition and reach your goals</p>
        </div>

        {/* Calorie Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
              <CardDescription>Your daily calorie and macro breakdown</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-8">
              <CalorieRing consumed={totals.calories} goal={profile?.daily_calorie_goal || 2000} />
              <div className="flex-1 w-full space-y-4">
                <MacroBar
                  label="Protein"
                  current={Math.round(totals.protein)}
                  goal={profile?.daily_protein_goal || 150}
                  color="hsl(var(--chart-1))"
                />
                <MacroBar
                  label="Carbs"
                  current={Math.round(totals.carbs)}
                  goal={profile?.daily_carbs_goal || 200}
                  color="hsl(var(--chart-2))"
                />
                <MacroBar
                  label="Fat"
                  current={Math.round(totals.fat)}
                  goal={profile?.daily_fat_goal || 65}
                  color="hsl(var(--chart-3))"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Weight</span>
                <span className="text-xl font-bold">{profile?.current_weight} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Goal</span>
                <span className="text-sm font-medium capitalize">
                  {profile?.goal_type?.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Activity Level</span>
                <span className="text-sm font-medium capitalize">
                  {profile?.activity_level?.replace("_", " ")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MealCard
            title="Breakfast"
            icon={<Coffee className="w-4 h-4" />}
            entries={getMealEntries("breakfast")}
            onAddFood={() => {
              setSelectedMeal("breakfast");
              setDialogOpen(true);
            }}
          />
          <MealCard
            title="Lunch"
            icon={<Sun className="w-4 h-4" />}
            entries={getMealEntries("lunch")}
            onAddFood={() => {
              setSelectedMeal("lunch");
              setDialogOpen(true);
            }}
          />
          <MealCard
            title="Dinner"
            icon={<Moon className="w-4 h-4" />}
            entries={getMealEntries("dinner")}
            onAddFood={() => {
              setSelectedMeal("dinner");
              setDialogOpen(true);
            }}
          />
          <MealCard
            title="Snacks"
            icon={<Cookie className="w-4 h-4" />}
            entries={getMealEntries("snack")}
            onAddFood={() => {
              setSelectedMeal("snack");
              setDialogOpen(true);
            }}
          />
        </div>
      </main>

      {/* Add Food Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Food to {selectedMeal}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFood} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="food_name">Food Name</Label>
              <Input
                id="food_name"
                value={foodForm.food_name}
                onChange={(e) => setFoodForm({ ...foodForm, food_name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={foodForm.calories}
                  onChange={(e) => setFoodForm({ ...foodForm, calories: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={foodForm.protein}
                  onChange={(e) => setFoodForm({ ...foodForm, protein: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={foodForm.carbs}
                  onChange={(e) => setFoodForm({ ...foodForm, carbs: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={foodForm.fat}
                  onChange={(e) => setFoodForm({ ...foodForm, fat: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">Add Food</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
