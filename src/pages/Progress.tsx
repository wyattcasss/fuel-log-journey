import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { ArrowLeft, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const Progress = () => {
  const navigate = useNavigate();
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeightLogs();
  }, []);

  const loadWeightLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: true });

    if (error) {
      console.error("Error loading weight logs:", error);
      return;
    }

    setWeightLogs(data || []);
    setLoading(false);
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("weight_logs").insert({
      user_id: user.id,
      weight: parseFloat(newWeight),
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already logged your weight today!");
      } else {
        toast.error("Failed to log weight");
      }
      return;
    }

    toast.success("Weight logged successfully!");
    setDialogOpen(false);
    setNewWeight("");
    loadWeightLogs();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const chartData = weightLogs.map((log) => ({
    date: format(new Date(log.log_date), "MMM dd"),
    weight: log.weight,
  }));

  const latestWeight = weightLogs[weightLogs.length - 1]?.weight;
  const firstWeight = weightLogs[0]?.weight;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Progress Tracking</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{latestWeight || "—"} kg</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-4xl font-bold">
                  {weightChange > 0 ? "+" : ""}
                  {weightChange.toFixed(1)} kg
                </div>
                {weightChange !== 0 && (
                  weightChange > 0 ? (
                    <TrendingUp className="w-6 h-6 text-secondary" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-success" />
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
            <CardDescription>Your weight progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No weight data yet. Start logging your weight to see your progress!
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Your Weight</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddWeight} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">Log Weight</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Progress;
