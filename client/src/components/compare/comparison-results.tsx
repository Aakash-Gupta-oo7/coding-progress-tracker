import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompareData, LeetcodeUserData, CodeforcesUserData, GFGUserData } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ComparisonResultsProps {
  data: {
    [username: string]: CompareData;
  };
}

const COLORS = ['#5664d2', '#38b2ac', '#ed8936', '#48bb78', '#e53e3e'];

export function ComparisonResults({ data }: ComparisonResultsProps) {
  // Extract usernames
  const usernames = Object.keys(data);
  
  if (usernames.length === 0) {
    return null;
  }

  // Prepare data for bar charts
  const prepareTotalSolvedData = () => {
    return usernames.map(username => {
      const userData = data[username];
      return {
        name: username,
        LeetCode: userData.leetcode?.totalSolved || 0,
        Codeforces: userData.codeforces?.totalSolved || 0,
        GeeksForGeeks: userData.gfg?.totalSolved || 0,
        total: (userData.leetcode?.totalSolved || 0) + 
               (userData.codeforces?.totalSolved || 0) + 
               (userData.gfg?.totalSolved || 0)
      };
    });
  };

  const prepareDifficultyData = () => {
    return usernames.map(username => {
      const userData = data[username];
      return {
        name: username,
        Easy: userData.leetcode?.easySolved || 0,
        Medium: userData.leetcode?.mediumSolved || 0,
        Hard: userData.leetcode?.hardSolved || 0,
        "Level A/B": userData.codeforces?.levelAB || 0,
        "Level C/D": userData.codeforces?.levelCD || 0,
        "Level E+": userData.codeforces?.levelE || 0,
        School: userData.gfg?.school || 0,
        Basic: userData.gfg?.basic || 0,
        "GFG Easy": userData.gfg?.easy || 0,
        "Medium/Hard": userData.gfg?.mediumHard || 0
      };
    });
  };

  // Prepare topic data (for LeetCode only)
  const prepareTopicData = () => {
    const allTopics = new Set<string>();
    usernames.forEach(username => {
      const leetcodeData = data[username].leetcode;
      if (leetcodeData?.topicData) {
        Object.keys(leetcodeData.topicData).forEach(topic => allTopics.add(topic));
      }
    });

    const result: { name: string; topic: string; value: number }[] = [];
    usernames.forEach(username => {
      const leetcodeData = data[username].leetcode;
      if (leetcodeData?.topicData) {
        Array.from(allTopics).forEach(topic => {
          result.push({
            name: username,
            topic,
            value: leetcodeData.topicData[topic] || 0
          });
        });
      }
    });

    return result;
  };

  // Prepare ratings data
  const prepareRatingsData = () => {
    return usernames.map(username => {
      const userData = data[username];
      return {
        name: username,
        LeetCode: userData.leetcode?.contestRating || 0,
        Codeforces: userData.codeforces?.rating || 0
      };
    });
  };

  const totalSolvedData = prepareTotalSolvedData();
  const difficultyData = prepareDifficultyData();
  const topicData = prepareTopicData();
  const ratingsData = prepareRatingsData();

  // Prepare platform distribution data for pie chart
  const preparePlatformDistribution = (username: string) => {
    const userData = data[username];
    const leetcodeSolved = userData.leetcode?.totalSolved || 0;
    const codeforcesSolved = userData.codeforces?.totalSolved || 0;
    const gfgSolved = userData.gfg?.totalSolved || 0;
    
    return [
      { name: 'LeetCode', value: leetcodeSolved },
      { name: 'Codeforces', value: codeforcesSolved },
      { name: 'GeeksForGeeks', value: gfgSolved }
    ].filter(item => item.value > 0);
  };

  const renderPlatformDistribution = (username: string) => {
    const pieData = preparePlatformDistribution(username);
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Comparison Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="total">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="total">Total Problems</TabsTrigger>
            <TabsTrigger value="difficulty">By Difficulty</TabsTrigger>
            <TabsTrigger value="topics">By Topics</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="total" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalSolvedData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="LeetCode" fill="#f59e0b" />
                  <Bar dataKey="Codeforces" fill="#3b82f6" />
                  <Bar dataKey="GeeksForGeeks" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {usernames.map(username => (
              <Card key={username} className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">{username}'s Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPlatformDistribution(username)}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="difficulty">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Easy" fill="#22c55e" />
                  <Bar dataKey="Medium" fill="#eab308" />
                  <Bar dataKey="Hard" fill="#ef4444" />
                  <Bar dataKey="Level A/B" fill="#3b82f6" />
                  <Bar dataKey="Level C/D" fill="#8b5cf6" />
                  <Bar dataKey="Level E+" fill="#ec4899" />
                  <Bar dataKey="School" fill="#14b8a6" />
                  <Bar dataKey="Basic" fill="#06b6d4" />
                  <Bar dataKey="GFG Easy" fill="#84cc16" />
                  <Bar dataKey="Medium/Hard" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="topics">
            {usernames.map(username => {
              const leetcodeData = data[username].leetcode;
              if (!leetcodeData?.topicData) {
                return (
                  <div key={username} className="text-center py-4">
                    No topic data available for {username}
                  </div>
                );
              }

              const topicChartData = Object.entries(leetcodeData.topicData)
                .map(([topic, count]) => ({ name: topic, value: count }))
                .sort((a, b) => b.value - a.value);

              return (
                <Card key={username} className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{username}'s LeetCode Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topicChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {topicChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
          
          <TabsContent value="ratings">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingsData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="LeetCode" fill="#f59e0b" />
                  <Bar dataKey="Codeforces" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
