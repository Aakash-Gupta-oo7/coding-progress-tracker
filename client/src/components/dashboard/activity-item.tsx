import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CodeIcon, FileCodeIcon, TerminalIcon } from "lucide-react";

interface ActivityItemProps {
  platform: "leetcode" | "codeforces" | "gfg";
  title: string;
  subtitle: string;
  timestamp: string;
}

export function ActivityItem({ platform, title, subtitle, timestamp }: ActivityItemProps) {
  const getPlatformDetails = () => {
    switch (platform) {
      case "leetcode":
        return {
          name: "LeetCode",
          icon: <CodeIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
          bgColor: "bg-orange-100 dark:bg-orange-900",
          textColor: "text-orange-600 dark:text-orange-400"
        };
      case "codeforces":
        return {
          name: "CodeForces",
          icon: <FileCodeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
          bgColor: "bg-blue-100 dark:bg-blue-900",
          textColor: "text-blue-600 dark:text-blue-400"
        };
      case "gfg":
        return {
          name: "GeeksForGeeks",
          icon: <TerminalIcon className="h-4 w-4 text-green-600 dark:text-green-400" />,
          bgColor: "bg-green-100 dark:bg-green-900",
          textColor: "text-green-600 dark:text-green-400"
        };
    }
  };

  const platformDetails = getPlatformDetails();

  return (
    <div className="flex">
      <Avatar className={`h-10 w-10 ${platformDetails.bgColor} mr-3`}>
        <AvatarFallback className={platformDetails.textColor}>
          {platformDetails.icon}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm">
          {title} <span className="text-primary">{platformDetails.name}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle} • {timestamp}</p>
      </div>
    </div>
  );
}
