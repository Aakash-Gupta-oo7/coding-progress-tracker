import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, isSameDay, isValid, isToday, isFuture, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DayClickEventHandler } from "react-day-picker";
import "react-day-picker/dist/style.css";
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
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Fetch all contests
  const {
    data: contests,
    isLoading,
    error
  } = useQuery<ContestData[]>({
    queryKey: ["/api/contests"],
    enabled: true,
  });

  // Call the API to update contests from platforms
  const updateContestsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/contests/upcoming");
      return await response.json();
    },
    onSuccess: () => {
      // Refresh the contests list
      queryClient.invalidateQueries({ queryKey: ["/api/contests"] });
      toast({
        title: "Contests Updated",
        description: "Latest contests have been fetched from platforms",
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

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      document.documentElement.classList.toggle('dark');
      return newValue;
    });
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
  
  // Handle day click in calendar 
  const handleDayClick: DayClickEventHandler = (day) => {
    setSelectedDay(day);
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
  
  // Get contests for the selected day
  const getDayContests = (day: Date | undefined) => {
    if (!contests || !day) return [];
    
    return contests.filter(contest => {
      const contestDate = parseISO(contest.startTime);
      return isValid(contestDate) && isSameDay(contestDate, day);
    });
  };
  
  // Get days with contests for highlighting in the calendar
  const getDaysWithContests = () => {
    if (!contests) return [];
    
    const daysWithContests: Date[] = [];
    contests.forEach(contest => {
      const contestDate = parseISO(contest.startTime);
      if (isValid(contestDate)) {
        daysWithContests.push(contestDate);
      }
    });
    
    return daysWithContests;
  };
  
  // Get contests for the selected day
  const selectedDayContests = getDayContests(selectedDay);
  
  // Get days with contests
  const daysWithContests = getDaysWithContests();
  
  // For skeleton and error states, return with full layout
  if (isLoading) {
    return (
      <div>
        <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
        <Sidebar />
        <main className="ml-0 md:ml-64 pt-16 min-h-screen">
          <div className="px-4 py-6">
            <div className="container mx-auto py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Contest Calendar</h2>
                <p className="text-gray-600 dark:text-gray-400">Loading contests...</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <Skeleton className="h-96 w-full rounded-lg" />
                </div>
                <div className="lg:col-span-2">
                  <Skeleton className="h-24 w-full rounded-lg mb-4" />
                  <Skeleton className="h-24 w-full rounded-lg mb-4" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
        <Sidebar />
        <main className="ml-0 md:ml-64 pt-16 min-h-screen">
          <div className="px-4 py-6">
            <div className="container mx-auto py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Contest Calendar</h2>
                <p className="text-gray-600 dark:text-gray-400">Error loading contests</p>
              </div>
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardHeader>
                  <CardTitle className="text-red-600">Error Loading Contests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
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
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar />
      <main className="ml-0 md:ml-64 pt-16 min-h-screen">
        <div className="px-4 py-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Contest Calendar</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Track upcoming and past coding contests
                </p>
              </div>
              <Button 
                onClick={() => updateContestsMutation.mutate()}
                disabled={updateContestsMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updateContestsMutation.isPending ? 'Updating...' : 'Update Contests'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar */}
              <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                      .rdp {
                        --rdp-cell-size: 40px; /* Size of the day cells */
                        --rdp-caption-font-size: 16px; /* Month caption */
                        --rdp-accent-color: ${isDarkMode ? '#5d7bf2' : '#4f65d9'}; /* Highlight color */
                        --rdp-background-color: ${isDarkMode ? '#3a426b' : '#e8effc'}; /* Selected day background */
                        --rdp-accent-color-dark: ${isDarkMode ? '#4f65d9' : '#3a426b'}; /* Highlight dark theme */
                        --rdp-background-color-dark: ${isDarkMode ? '#262f56' : '#d6e3fc'}; /* Selected day background dark theme */
                        --rdp-outline: none; /* No outline */
                        margin: 0;
                      }
                      .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
                        background-color: var(--rdp-accent-color);
                        color: white;
                      }
                      .rdp-day_today {
                        border: 2px solid var(--rdp-accent-color);
                        font-weight: bold;
                      }
                      .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                        background-color: var(--rdp-background-color);
                      }
                      .with-contests {
                        position: relative;
                      }
                      .with-contests::after {
                        content: '';
                        position: absolute;
                        bottom: 2px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 6px;
                        height: 6px;
                        background-color: var(--rdp-accent-color);
                        border-radius: 50%;
                      }
                    `
                  }}
                />
                <DayPicker
                  mode="single"
                  selected={selectedDay}
                  onSelect={(day) => setSelectedDay(day)}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                  modifiers={{
                    withContests: daysWithContests
                  }}
                  modifiersClassNames={{
                    withContests: 'with-contests'
                  }}
                  className="mx-auto"
                  components={{
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />
                  }}
                />
                
                <div className="mt-4 border-t pt-4 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="inline-block w-3 h-3 bg-primary rounded-full mr-2"></span>
                    Days with contests
                  </p>
                </div>
              </div>
              
              {/* Contest list for selected day */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-medium mb-4">
                  {selectedDay ? format(selectedDay, 'MMMM do, yyyy') : 'Select a date'}
                  {selectedDay && isToday(selectedDay) && <span className="ml-2 text-primary font-bold">(Today)</span>}
                </h3>
                
                {selectedDayContests.length === 0 ? (
                  <Card className="border-gray-200 bg-gray-50 dark:bg-gray-800/50">
                    <CardHeader>
                      <CardTitle>No Contests</CardTitle>
                      <CardDescription>
                        There are no scheduled contests for {selectedDay ? format(selectedDay, 'MMMM do, yyyy') : 'the selected date'}.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Try selecting a different date or check the calendar for days with contests (marked with a dot).</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {selectedDayContests.map(contest => {
                      const contestDate = parseISO(contest.startTime);
                      const isFutureContest = isFuture(contestDate);
                      
                      return (
                        <Card 
                          key={contest.id} 
                          className={cn(
                            "transition-all hover:shadow-md",
                            isToday(contestDate) && "border-blue-400 dark:border-blue-500",
                            !isFutureContest && "opacity-80"
                          )}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{contest.name}</CardTitle>
                                <CardDescription>
                                  {format(contestDate, "h:mm a")} • {formatDuration(contest.durationSeconds)}
                                </CardDescription>
                              </div>
                              {getPlatformBadge(contest.platform)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <a 
                              href={contest.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Contest Details</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 17L17 7"/>
                                <path d="M7 7h10v10"/>
                              </svg>
                            </a>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              isToday(contestDate) && isFutureContest 
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" 
                                : isFutureContest 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            )}>
                              {isToday(contestDate) && isFutureContest 
                                ? "Today" 
                                : isFutureContest 
                                  ? "Upcoming" 
                                  : "Completed"}
                            </span>
                            {user && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Participated</span>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}