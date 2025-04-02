import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { LeetcodeUserData, CodeforcesUserData, GFGUserData, QuestionList } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { PlatformCard } from "@/components/dashboard/platform-card";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { QuestionListCard } from "@/components/dashboard/question-list-card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Loader2, ListChecks, Code, FileCode, BarChartHorizontal, Flame } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      document.documentElement.classList.toggle('dark');
      return newValue;
    });
  };

  // Fetch LeetCode data if user has linked a LeetCode account
  const { 
    data: leetcodeData,
    isLoading: isLeetcodeLoading
  } = useQuery<LeetcodeUserData>({
    queryKey: user?.leetcodeUsername ? [`/api/fetch/leetcode/${user.leetcodeUsername}`] : [],
    enabled: !!user?.leetcodeUsername,
  });

  // Fetch CodeForces data if user has linked a CodeForces account
  const { 
    data: codeforcesData,
    isLoading: isCodeforcesLoading
  } = useQuery<CodeforcesUserData>({
    queryKey: user?.codeforcesUsername ? [`/api/fetch/codeforces/${user.codeforcesUsername}`] : [],
    enabled: !!user?.codeforcesUsername,
  });

  // Fetch GFG data if user has linked a GFG account
  const { 
    data: gfgData,
    isLoading: isGfgLoading
  } = useQuery<GFGUserData>({
    queryKey: user?.gfgUsername ? [`/api/fetch/gfg/${user.gfgUsername}`] : [],
    enabled: !!user?.gfgUsername,
  });

  // Fetch user's question lists
  const {
    data: questionLists,
    isLoading: isQuestionListsLoading
  } = useQuery<QuestionList[]>({
    queryKey: ["/api/questions/lists"],
  });

  // Calculate total problems solved across all platforms
  const totalProblemsSolved = (
    (leetcodeData?.totalSolved || 0) +
    (codeforcesData?.totalSolved || 0) +
    (gfgData?.totalSolved || 0)
  );

  // Calculate total hard problems solved
  const totalHardProblems = (
    (leetcodeData?.hardSolved || 0) +
    (codeforcesData?.levelE || 0) +
    (gfgData?.mediumHard || 0)
  );

  // Prepare topic distribution data (for LeetCode)
  const prepareTopicData = () => {
    if (!leetcodeData?.topicData) {
      return [];
    }
    
    return Object.entries(leetcodeData.topicData)
      .map(([topic, count]) => ({ name: topic, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 topics
  };

  // Prepare platform distribution data
  const preparePlatformData = () => {
    return [
      { name: 'LeetCode', value: leetcodeData?.totalSolved || 0 },
      { name: 'CodeForces', value: codeforcesData?.totalSolved || 0 },
      { name: 'GeeksForGeeks', value: gfgData?.totalSolved || 0 }
    ].filter(item => item.value > 0);
  };

  const topicData = prepareTopicData();
  const platformData = preparePlatformData();

  // Calculate recent activity
  const getRecentActivity = () => {
    const activities = [];

    // Most recent Leetcode contests
    if (leetcodeData?.contestRating) {
      activities.push({
        platform: 'leetcode' as const,
        title: 'Contest Participation',
        subtitle: `Current rating: ${leetcodeData.contestRating}`,
        timestamp: '2 days ago'
      });
    }

    // Most recent Codeforces contests
    if (codeforcesData?.contests && codeforcesData.contests.length > 0) {
      const recentContest = codeforcesData.contests[0];
      activities.push({
        platform: 'codeforces' as const,
        title: recentContest.contestName,
        subtitle: `Rank: ${recentContest.rank}, Rating change: ${recentContest.ratingChange > 0 ? '+' : ''}${recentContest.ratingChange}`,
        timestamp: '5 days ago'
      });
    }

    // GFG activity
    if (gfgData?.totalSolved) {
      activities.push({
        platform: 'gfg' as const,
        title: 'Problem Solving',
        subtitle: `${gfgData.totalSolved} problems solved`,
        timestamp: '1 week ago'
      });
    }

    return activities;
  };

  const recentActivity = getRecentActivity();

  // Prepare color scheme for charts
  const COLORS = ['#5664d2', '#38b2ac', '#ed8936', '#48bb78', '#e53e3e'];

  return (
    <div>
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar />
      
      <main className="ml-0 md:ml-64 pt-16 min-h-screen">
        <div className="px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.username}</p>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Problems"
              value={totalProblemsSolved}
              icon={<ListChecks className="h-5 w-5" />}
              color="primary"
            />
            <StatCard
              title="Hard Problems"
              value={totalHardProblems}
              icon={<Flame className="h-5 w-5" />}
              color="red"
            />
            <StatCard
              title="LeetCode Rank"
              value={leetcodeData?.ranking || "N/A"}
              icon={<Code className="h-5 w-5" />}
              color="yellow"
            />
            <StatCard
              title="Codeforces Rating"
              value={codeforcesData?.rating || "N/A"}
              icon={<FileCode className="h-5 w-5" />}
              color="blue"
              change={
                codeforcesData?.contests && codeforcesData.contests.length > 0
                  ? {
                      value: codeforcesData.contests[0].ratingChange,
                      positive: codeforcesData.contests[0].ratingChange > 0,
                    }
                  : undefined
              }
            />
          </div>

          <Tabs defaultValue="overview" className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="lists">My Lists</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 mt-4">
              {/* Platform Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {user?.leetcodeUsername && (
                  <div className="col-span-1">
                    {isLeetcodeLoading ? (
                      <Card className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </Card>
                    ) : leetcodeData ? (
                      <PlatformCard platform="leetcode" data={leetcodeData} />
                    ) : (
                      <Card className="flex flex-col justify-center items-center h-48 text-center p-4">
                        <Code className="h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="text-lg font-semibold">No LeetCode Data</h3>
                        <p className="text-sm text-gray-500">We couldn't fetch your LeetCode data.</p>
                      </Card>
                    )}
                  </div>
                )}

                {user?.codeforcesUsername && (
                  <div className="col-span-1">
                    {isCodeforcesLoading ? (
                      <Card className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </Card>
                    ) : codeforcesData ? (
                      <PlatformCard platform="codeforces" data={codeforcesData} />
                    ) : (
                      <Card className="flex flex-col justify-center items-center h-48 text-center p-4">
                        <FileCode className="h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="text-lg font-semibold">No CodeForces Data</h3>
                        <p className="text-sm text-gray-500">We couldn't fetch your CodeForces data.</p>
                      </Card>
                    )}
                  </div>
                )}

                {user?.gfgUsername && (
                  <div className="col-span-1">
                    {isGfgLoading ? (
                      <Card className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </Card>
                    ) : gfgData ? (
                      <PlatformCard platform="gfg" data={gfgData} />
                    ) : (
                      <Card className="flex flex-col justify-center items-center h-48 text-center p-4">
                        <BarChartHorizontal className="h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="text-lg font-semibold">No GeeksForGeeks Data</h3>
                        <p className="text-sm text-gray-500">We couldn't fetch your GFG data.</p>
                      </Card>
                    )}
                  </div>
                )}

                {!user?.leetcodeUsername && !user?.codeforcesUsername && !user?.gfgUsername && (
                  <div className="col-span-full">
                    <Card className="p-6 text-center">
                      <h3 className="text-lg font-semibold mb-2">No Platforms Linked</h3>
                      <p className="mb-4">Link your coding platform profiles to see your stats here.</p>
                      <a href="/profile" className="text-primary hover:underline">Go to Profile Settings</a>
                    </Card>
                  </div>
                )}
              </div>

              {/* Charts */}
              {(platformData.length > 0 || topicData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {platformData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Problem Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={platformData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {platformData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {topicData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>LeetCode Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={topicData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                              <XAxis type="number" />
                              <YAxis type="category" dataKey="name" width={80} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#5664d2" barSize={20} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <ActivityItem
                          key={index}
                          platform={activity.platform}
                          title={activity.title}
                          subtitle={activity.subtitle}
                          timestamp={activity.timestamp}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No recent activity found. Link your accounts to see activity.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="lists" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Question Lists</CardTitle>
                </CardHeader>
                <CardContent>
                  {isQuestionListsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : questionLists && questionLists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {questionLists.slice(0, 4).map(list => (
                        <QuestionListCard
                          key={list.id}
                          id={list.id}
                          name={list.name}
                          description={list.description || ""}
                          isPublic={!!list.isPublic}
                          totalProblems={10} // This would be calculated from actual data
                          solvedProblems={5} // This would be calculated from actual data
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">You haven't created any question lists yet.</p>
                      <a href="/lists" className="text-primary hover:underline">Create your first list</a>
                    </div>
                  )}
                  
                  {questionLists && questionLists.length > 4 && (
                    <div className="mt-4 text-center">
                      <a href="/lists" className="text-primary hover:underline">View all lists</a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}