import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, addMonths, subMonths, isValid, isSameMonth, isToday, isFuture } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ContestData } from "@shared/schema";

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch all contests
  const {
    data: contests,
    isLoading,
    error
  } = useQuery<ContestData[]>({
    queryKey: ["/api/contests"],
    enabled: true,
  });

  // Toggle participation status
  const participationMutation = useMutation({
    mutationFn: async ({ contestId, participated }: { contestId: number; participated: boolean }) => {
      const response = await apiRequest(
        "POST",
        `/api/contests/${contestId}/participate`,
        { participated }
      );
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/contests"] });
      toast({
        title: "Success",
        description: "Contest participation updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Toggle contest participation
  const handleParticipationToggle = (contestId: number, currentValue: boolean) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to mark contest participation",
        variant: "destructive",
      });
      return;
    }
    
    participationMutation.mutate({
      contestId,
      participated: !currentValue
    });
  };

  // Get contests for the current month
  const getMonthContests = () => {
    if (!contests) return [];
    
    return contests.filter(contest => {
      const contestDate = parseISO(contest.startTime);
      return isValid(contestDate) && isSameMonth(contestDate, currentDate);
    });
  };

  // Get platform badge style
  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "leetcode":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">LeetCode</Badge>;
      case "codeforces":
        return <Badge className="bg-red-600 hover:bg-red-700">CodeForces</Badge>;
      case "gfg":
        return <Badge className="bg-green-600 hover:bg-green-700">GeeksforGeeks</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Format contest duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
    }
  };

  // If loading, show skeletons
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Contests</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(error as Error).message}</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/contests"] })}
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Get contests for the current month
  const monthContests = getMonthContests();

  return (
    <div className="container mx-auto py-8">
      {/* Month navigation */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contest cards */}
      {monthContests.length === 0 ? (
        <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900/20">
          <CardHeader>
            <CardTitle>No Contests Found</CardTitle>
            <CardDescription>
              There are no scheduled contests for {format(currentDate, "MMMM yyyy")}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Try a different month or check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthContests.map(contest => {
            const contestDate = parseISO(contest.startTime);
            const isFutureContest = isFuture(contestDate);
            
            return (
              <Card 
                key={contest.id} 
                className={cn(
                  isToday(contestDate) && "border-blue-400 dark:border-blue-500",
                  !isFutureContest && "opacity-70"
                )}
              >
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{contest.name}</CardTitle>
                    {getPlatformBadge(contest.platform)}
                  </div>
                  <CardDescription>
                    {format(contestDate, "EEEE, MMMM do, yyyy")}
                    <br />
                    {format(contestDate, "h:mm a")} • {formatDuration(contest.durationSeconds)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a 
                    href={contest.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Contest Details
                  </a>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <span className={isToday(contestDate) ? "text-blue-600 font-semibold" : ""}>
                    {isToday(contestDate) ? "Today!" : isFutureContest ? "Upcoming" : "Completed"}
                  </span>
                  {user && (
                    <div className="flex items-center space-x-2">
                      <span>Participated</span>
                      <Checkbox 
                        checked={!!contest.participated}
                        onCheckedChange={() => handleParticipationToggle(contest.id, !!contest.participated)}
                        disabled={participationMutation.isPending || isFutureContest}
                      />
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}