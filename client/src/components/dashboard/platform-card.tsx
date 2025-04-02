import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  LeetcodeUserData, 
  CodeforcesUserData, 
  GFGUserData 
} from "@shared/schema";
import { 
  Code as CodeIcon, 
  FileCode, 
  Terminal, 
  ExternalLink,
  Fire
} from "lucide-react";

interface PlatformCardProps {
  platform: "leetcode" | "codeforces" | "gfg";
  data: LeetcodeUserData | CodeforcesUserData | GFGUserData;
}

export function PlatformCard({ platform, data }: PlatformCardProps) {
  const getPlatformIcon = () => {
    switch (platform) {
      case "leetcode":
        return <CodeIcon className="text-orange-600 dark:text-orange-400" />;
      case "codeforces":
        return <FileCode className="text-blue-600 dark:text-blue-400" />;
      case "gfg":
        return <Terminal className="text-green-600 dark:text-green-400" />;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case "leetcode":
        return "LeetCode";
      case "codeforces":
        return "CodeForces";
      case "gfg":
        return "GeeksForGeeks";
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case "leetcode":
        return "orange";
      case "codeforces":
        return "blue";
      case "gfg":
        return "green";
    }
  };

  const getProfileUrl = () => {
    switch (platform) {
      case "leetcode":
        return `https://leetcode.com/${(data as LeetcodeUserData).username}`;
      case "codeforces":
        return `https://codeforces.com/profile/${(data as CodeforcesUserData).handle}`;
      case "gfg":
        return `https://www.geeksforgeeks.org/user/${(data as GFGUserData).username}`;
    }
  };

  // Render specific content based on platform
  const renderLeetCodeContent = (data: LeetcodeUserData) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Solved</p>
          <p className="text-xl font-semibold">{data.totalSolved}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Contest Rating</p>
          <p className="text-xl font-semibold">{data.contestRating}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Easy</p>
          <p className="text-green-500 font-medium">{data.easySolved}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Medium</p>
          <p className="text-yellow-500 font-medium">{data.mediumSolved}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Hard</p>
          <p className="text-red-500 font-medium">{data.hardSolved}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rank</p>
          <p className="font-medium">{data.ranking}</p>
        </div>
      </div>
      <div className="mt-4">
        <Progress value={Math.min(100, (data.totalSolved / 400) * 100)} className="h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{((data.totalSolved / 400) * 100).toFixed(0)}% of problems solved</span>
          <span>{data.totalSolved}/400</span>
        </div>
      </div>
    </>
  );

  const renderCodeforcesContent = (data: CodeforcesUserData) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Solved</p>
          <p className="text-xl font-semibold">{data.totalSolved}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Contest Rating</p>
          <p className="text-xl font-semibold">{data.rating}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Level A/B</p>
          <p className="text-green-500 font-medium">{data.levelAB}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Level C/D</p>
          <p className="text-yellow-500 font-medium">{data.levelCD}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Level E+</p>
          <p className="text-red-500 font-medium">{data.levelE}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Max Rank</p>
          <p className="font-medium">{data.maxRank}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contests Participated</div>
        <div className="flex space-x-1">
          {data.contests.slice(0, 8).map((contest, idx) => (
            <div 
              key={idx}
              className="w-4 h-4 bg-blue-500 rounded-sm" 
              title={`${contest.contestName}: Rank ${contest.rank}`}
            ></div>
          ))}
          {data.contests.length > 8 && (
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-sm" title={`${data.contests.length - 8} more...`}>
              +{data.contests.length - 8}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderGFGContent = (data: GFGUserData) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Solved</p>
          <p className="text-xl font-semibold">{data.totalSolved}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Institution Rank</p>
          <p className="text-xl font-semibold">{data.institutionRank}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">School</p>
          <p className="text-green-500 font-medium">{data.school}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Basic</p>
          <p className="text-blue-500 font-medium">{data.basic}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Easy</p>
          <p className="text-yellow-500 font-medium">{data.easy}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Medium/Hard</p>
          <p className="text-red-500 font-medium">{data.mediumHard}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monthly Contributions</div>
        <div className="flex items-end space-x-1 h-12">
          {Object.entries(data.monthlyActivity).map(([month, value], idx) => (
            <div 
              key={idx}
              className="w-4 bg-green-500 rounded-sm" 
              style={{ height: `${(value / 15) * 100}%` }}
              title={`${month}: ${value} contributions`}
            ></div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Jan</span>
          <span>Jun</span>
          <span>Dec</span>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (platform) {
      case "leetcode":
        return renderLeetCodeContent(data as LeetcodeUserData);
      case "codeforces":
        return renderCodeforcesContent(data as CodeforcesUserData);
      case "gfg":
        return renderGFGContent(data as GFGUserData);
    }
  };

  const color = getPlatformColor();
  const colorMap = {
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800"
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800"
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800"
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-row justify-between items-center">
        <div className="flex items-center">
          <div className={`w-8 h-8 ${colorMap[color].bg} rounded-md flex items-center justify-center mr-3`}>
            {getPlatformIcon()}
          </div>
          <h3 className="font-medium">{getPlatformName()}</h3>
        </div>
        <a 
          href={getProfileUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center"
        >
          View Profile
          <ExternalLink size={14} className="ml-1" />
        </a>
      </CardHeader>
      <CardContent className="p-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
