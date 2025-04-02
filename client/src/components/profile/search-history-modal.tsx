import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchIcon, Loader2, ExternalLink, Code, FileCode, Terminal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SearchHistoryItem } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface SearchHistoryModalProps {
  children: React.ReactNode;
}

export function SearchHistoryModal({ children }: SearchHistoryModalProps) {
  const { data: searchHistory, isLoading, error } = useQuery<SearchHistoryItem[]>({
    queryKey: ["/api/profile/search-history"],
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "leetcode":
        return <Code className="h-4 w-4 text-orange-500" />;
      case "codeforces":
        return <FileCode className="h-4 w-4 text-blue-500" />;
      case "gfg":
        return <Terminal className="h-4 w-4 text-green-500" />;
      default:
        return <SearchIcon className="h-4 w-4" />;
    }
  };

  const getPlatformUrl = (platform: string, username: string) => {
    switch (platform) {
      case "leetcode":
        return `https://leetcode.com/${username}`;
      case "codeforces":
        return `https://codeforces.com/profile/${username}`;
      case "gfg":
        return `https://www.geeksforgeeks.org/user/${username}`;
      default:
        return "#";
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "leetcode":
        return "LeetCode";
      case "codeforces":
        return "CodeForces";
      case "gfg":
        return "GeeksForGeeks";
      default:
        return platform;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search History</DialogTitle>
          <DialogDescription>
            Profiles you've previously compared.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[400px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Failed to load search history
            </div>
          ) : searchHistory && searchHistory.length > 0 ? (
            <div className="space-y-3">
              {searchHistory.map((item) => (
                <div 
                  key={`${item.platform}-${item.searchedUsername}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    {getPlatformIcon(item.platform)}
                    <div>
                      <p className="font-medium">{item.searchedUsername}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getPlatformName(item.platform)} • {formatDistanceToNow(new Date(item.searchedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={getPlatformUrl(item.platform, item.searchedUsername)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No search history found. Start comparing profiles to build your history.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
