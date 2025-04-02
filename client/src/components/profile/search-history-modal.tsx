import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchIcon, Loader2, ExternalLink, Code, FileCode, Terminal, Trash2, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SearchHistoryItem } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SearchHistoryModalProps {
  children: React.ReactNode;
}

export function SearchHistoryModal({ children }: SearchHistoryModalProps) {
  const { toast } = useToast();
  const [itemToDelete, setItemToDelete] = useState<SearchHistoryItem | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: searchHistory, isLoading, error } = useQuery<SearchHistoryItem[]>({
    queryKey: ["/api/profile/search-history"],
  });
  
  // Mutation for deleting a search history item
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/profile/search-history/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch search history
      queryClient.invalidateQueries({ queryKey: ["/api/profile/search-history"] });
      toast({
        title: "Success",
        description: "Search history item deleted successfully",
      });
      setConfirmDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete search history item",
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteClick = (item: SearchHistoryItem) => {
    setItemToDelete(item);
    setConfirmDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

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
    <>
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
                          {getPlatformName(item.platform)} • {
                            typeof item.searchedAt === 'string' 
                              ? formatDistanceToNow(new Date(item.searchedAt), { addSuffix: true })
                              : item.searchedAt instanceof Date
                                ? formatDistanceToNow(item.searchedAt, { addSuffix: true })
                                : 'Recently'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a 
                        href={getPlatformUrl(item.platform, item.searchedUsername)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 p-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={() => handleDeleteClick(item)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Delete Search History Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this search history item? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
