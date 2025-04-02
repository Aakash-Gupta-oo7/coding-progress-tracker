import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ResponsiveContainer } from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeetcodeUserData, CodeforcesUserData, GFGUserData } from "@shared/schema";

export default function StatsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leetcode");

  // Query for LeetCode data
  const {
    data: leetcodeData,
    isLoading: isLeetcodeLoading,
    refetch: refetchLeetcode
  } = useQuery<LeetcodeUserData>({
    queryKey: ["/api/platform/leetcode", user?.leetcodeUsername],
    enabled: !!user?.leetcodeUsername
  });

  // Query for Codeforces data
  const {
    data: codeforcesData,
    isLoading: isCodeforcesLoading,
    refetch: refetchCodeforces
  } = useQuery<CodeforcesUserData>({
    queryKey: ["/api/platform/codeforces", user?.codeforcesUsername],
    enabled: !!user?.codeforcesUsername
  });

  // Query for GFG data
  const {
    data: gfgData,
    isLoading: isGfgLoading,
    refetch: refetchGfg
  } = useQuery<GFGUserData>({
    queryKey: ["/api/platform/gfg", user?.gfgUsername],
    enabled: !!user?.gfgUsername
  });

  // Handle data refetch based on active tab
  const handleRefresh = () => {
    if (activeTab === "leetcode" && user?.leetcodeUsername) {
      refetchLeetcode();
    } else if (activeTab === "codeforces" && user?.codeforcesUsername) {
      refetchCodeforces();
    } else if (activeTab === "gfg" && user?.gfgUsername) {
      refetchGfg();
    }
  };

  // One-click sync for all platforms
  const syncAllPlatforms = () => {
    if (user?.leetcodeUsername) refetchLeetcode();
    if (user?.codeforcesUsername) refetchCodeforces();
    if (user?.gfgUsername) refetchGfg();
  };

  // LeetCode visualizations
  const renderLeetCodeVisualizations = () => {
    if (isLeetcodeLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!leetcodeData || !user?.leetcodeUsername) {
      return (
        <div className="text-center p-8">
          <p>No LeetCode data available. Please link your LeetCode account in your profile.</p>
        </div>
      );
    }

    const difficultySummary = [
      { name: "Easy", value: leetcodeData.easySolved },
      { name: "Medium", value: leetcodeData.mediumSolved },
      { name: "Hard", value: leetcodeData.hardSolved }
    ];

    const COLORS = ["#00C49F", "#FFBB28", "#FF8042"];

    // Topic data for bar chart
    const topicData = Object.entries(leetcodeData.topicData || {})
      .map(([key, value]) => ({ topic: key, count: value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return (
      <>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Problem Difficulty Distribution</CardTitle>
              <CardDescription>Breakdown of problems solved by difficulty</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={difficultySummary}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {difficultySummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} problems`, "Solved"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Topics</CardTitle>
              <CardDescription>Problems solved by topic</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Problems Solved" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>LeetCode Profile Summary</CardTitle>
            <CardDescription>Your current statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Solved</h3>
                <p className="text-2xl font-bold text-primary">{leetcodeData.totalSolved}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contest Rating</h3>
                <p className="text-2xl font-bold text-primary">{leetcodeData.contestRating || "N/A"}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ranking</h3>
                <p className="text-2xl font-bold text-primary">{leetcodeData.ranking || "N/A"}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion</h3>
                <p className="text-2xl font-bold text-primary">
                  {((leetcodeData.totalSolved / 2500) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  // Codeforces visualizations
  const renderCodeforcesVisualizations = () => {
    if (isCodeforcesLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!codeforcesData || !user?.codeforcesUsername) {
      return (
        <div className="text-center p-8">
          <p>No Codeforces data available. Please link your Codeforces account in your profile.</p>
        </div>
      );
    }

    const levelDistribution = [
      { name: "A/B", value: codeforcesData.levelAB },
      { name: "C/D", value: codeforcesData.levelCD },
      { name: "E+", value: codeforcesData.levelE }
    ];

    const COLORS = ["#00C49F", "#FFBB28", "#FF8042"];

    // Contest performance data
    const contestData = codeforcesData.contests?.slice(-10).map(contest => ({
      name: contest.contestId,
      rating: contest.ratingChange,
      rank: contest.rank
    }));

    return (
      <>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Problem Level Distribution</CardTitle>
              <CardDescription>Breakdown of problems solved by difficulty level</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={levelDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {levelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} problems`, "Solved"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Contest Performance</CardTitle>
              <CardDescription>Rating changes in recent contests</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={contestData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rating" name="Rating Change" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Codeforces Profile Summary</CardTitle>
            <CardDescription>Your current statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Solved</h3>
                <p className="text-2xl font-bold text-primary">{codeforcesData.totalSolved}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</h3>
                <p className="text-2xl font-bold text-primary">{codeforcesData.rating}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Rank</h3>
                <p className="text-2xl font-bold text-primary">{codeforcesData.maxRank}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contests</h3>
                <p className="text-2xl font-bold text-primary">{codeforcesData.contests?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  // GFG visualizations
  const renderGFGVisualizations = () => {
    if (isGfgLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!gfgData || !user?.gfgUsername) {
      return (
        <div className="text-center p-8">
          <p>No GeeksForGeeks data available. Please link your GFG account in your profile.</p>
        </div>
      );
    }

    const difficultySummary = [
      { name: "School", value: gfgData.school },
      { name: "Basic", value: gfgData.basic },
      { name: "Easy", value: gfgData.easy },
      { name: "Medium/Hard", value: gfgData.mediumHard }
    ];

    const COLORS = ["#00C49F", "#0088FE", "#FFBB28", "#FF8042"];

    // Monthly activity data
    const monthlyActivity = Object.entries(gfgData.monthlyActivity || {})
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month);
      });

    return (
      <>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Problem Difficulty Distribution</CardTitle>
              <CardDescription>Breakdown of problems solved by difficulty</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={difficultySummary}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {difficultySummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} problems`, "Solved"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Problems solved by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Problems Solved" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>GFG Profile Summary</CardTitle>
            <CardDescription>Your current statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Solved</h3>
                <p className="text-2xl font-bold text-primary">{gfgData.totalSolved}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Institution Rank</h3>
                <p className="text-2xl font-bold text-primary">{gfgData.institutionRank || "N/A"}</p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Streak</h3>
                <p className="text-2xl font-bold text-primary">
                  {Object.keys(gfgData.monthlyActivity || {}).length} months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  // Handle dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage for dark mode preference
    return localStorage.getItem('darkMode') === 'true';
  });

  // Apply dark mode class to html element when component mounts
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-800 dark:text-gray-200">
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar />
      <main className="md:ml-64 pt-16 p-6">
        <div className="max-w-full mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Advanced Visualizations</h1>
            <div className="flex space-x-2">
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Current
              </Button>
              <Button 
                onClick={syncAllPlatforms}
                variant="default"
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync All Platforms
              </Button>
            </div>
          </div>

          <Tabs defaultValue="leetcode" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="leetcode" disabled={!user?.leetcodeUsername}>LeetCode</TabsTrigger>
              <TabsTrigger value="codeforces" disabled={!user?.codeforcesUsername}>Codeforces</TabsTrigger>
              <TabsTrigger value="gfg" disabled={!user?.gfgUsername}>GeeksForGeeks</TabsTrigger>
            </TabsList>
            <TabsContent value="leetcode">
              {renderLeetCodeVisualizations()}
            </TabsContent>
            <TabsContent value="codeforces">
              {renderCodeforcesVisualizations()}
            </TabsContent>
            <TabsContent value="gfg">
              {renderGFGVisualizations()}
            </TabsContent>
          </Tabs>

          {!user?.leetcodeUsername && !user?.codeforcesUsername && !user?.gfgUsername && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>No Platforms Linked</CardTitle>
                <CardDescription>Please link your coding profiles to see visualizations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center p-4">
                  You haven't linked any coding platforms to your profile yet. 
                  Visit your profile page to add links to your LeetCode, Codeforces, and GeeksForGeeks accounts.
                </p>
                <div className="flex justify-center mt-4">
                  <Button asChild>
                    <a href="/profile">Go to Profile Settings</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}