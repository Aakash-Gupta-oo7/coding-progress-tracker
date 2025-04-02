import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Clock,
  Users,
  User,
  Trophy,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schema for adding test questions
const questionsSchema = z.object({
  questions: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      url: z.string().url("Must be a valid URL"),
      platform: z.string().min(1, "Platform is required"),
      difficulty: z.string().min(1, "Difficulty is required"),
      points: z.number().min(1, "Points must be at least 1"),
      questionId: z.number().optional(), // External question ID
    })
  ),
});

type QuestionsFormValues = z.infer<typeof questionsSchema>;

// Form schema for submissions
const submissionSchema = z.object({
  questionId: z.number(),
  isCorrect: z.boolean(),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

const TestDetailPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const testId = parseInt(params.testId || "0");
  const [addQuestionsOpen, setAddQuestionsOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  const [testEndsAt, setTestEndsAt] = useState<Date | null>(null);

  // Fetch test details
  const {
    data: testData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!user && !!testId,
  });

  // Set up timer for active tests
  useEffect(() => {
    if (testData?.test && testData.test.status === "active") {
      const startTime = new Date(testData.test.startTime);
      const durationMs = testData.test.durationMinutes * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);
      setTestEndsAt(endTime);

      const timer = setInterval(() => {
        const now = new Date();
        const diff = endTime.getTime() - now.getTime();

        if (diff <= 0) {
          clearInterval(timer);
          setRemainingTime("Time's up!");
          refetch(); // Refresh to update test status
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setRemainingTime(
            `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          );
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setRemainingTime(null);
    }
  }, [testData?.test, refetch]);

  // Participate in test mutation
  const participateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tests/${testId}/participate`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({
        title: "Joined test",
        description: "You have successfully joined the test.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join test",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add questions mutation
  const addQuestionsMutation = useMutation({
    mutationFn: async (data: QuestionsFormValues) => {
      const res = await apiRequest("POST", `/api/tests/${testId}/questions`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      setAddQuestionsOpen(false);
      toast({
        title: "Questions added",
        description: "Test questions have been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add questions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (data: SubmissionFormValues) => {
      const res = await apiRequest("POST", `/api/tests/${testId}/submit`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({
        title: "Answer submitted",
        description: "Your answer has been submitted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit answer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update test status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PUT", `/api/tests/${testId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({
        title: "Status updated",
        description: "Test status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user is a participant
  const isParticipant = testData?.participants?.some(
    (p: any) => p.userId === user?.id
  );

  // Check if user is admin
  const isAdmin =
    testData?.test && user
      ? testData.test.createdBy === user.id
      : false;

  // Get user submission for a question
  const getUserSubmission = (questionId: number) => {
    return testData?.userSubmissions?.find(
      (s: any) => s.questionId === questionId
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">You need to be logged in</h1>
          <p className="mb-4">Please log in to view test details.</p>
          <Button asChild>
            <Link href="/auth">Login / Register</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!testData?.test) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test not found</h1>
          <p className="mb-4">
            The test you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link href="/groups">Back to Groups</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { test, questions, participants, results, userSubmissions } = testData;
  const startTime = new Date(test.startTime);
  const now = new Date();
  const testStarted = startTime <= now;
  const testEnded =
    test.status === "completed" ||
    (testStarted &&
      startTime.getTime() + test.durationMinutes * 60 * 1000 < now.getTime());

  // Calculate user score
  const userScore = results?.find((r: any) => r.userId === user.id);

  // Handler for status updates
  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  // Handler for submissions
  const handleSubmit = (questionId: number, isCorrect: boolean) => {
    submitAnswerMutation.mutate({ questionId, isCorrect });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/groups/${test.groupId}`}>
              <Button variant="ghost" className="p-0 h-auto">
                <span className="text-sm text-muted-foreground">Group</span>
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href={`/groups/${test.groupId}?tab=tests`}>
              <Button variant="ghost" className="p-0 h-auto">
                <span className="text-sm text-muted-foreground">Tests</span>
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold">{test.name}</h1>
            <Badge
              className={
                test.status === "scheduled"
                  ? "bg-yellow-100 text-yellow-800"
                  : test.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }
            >
              {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {test.description || "No description provided."}
          </p>
        </div>

        {isAdmin && test.status === "scheduled" && (
          <Button onClick={() => handleStatusUpdate("active")}>
            Start Test
          </Button>
        )}

        {isAdmin && test.status === "active" && (
          <Button onClick={() => handleStatusUpdate("completed")}>
            End Test
          </Button>
        )}

        {!isAdmin && !isParticipant && test.status !== "completed" && (
          <Button onClick={() => participateMutation.mutate()}>
            Join Test
          </Button>
        )}
      </div>

      {test.status === "active" && remainingTime && (
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertTitle>Test in progress</AlertTitle>
          <AlertDescription>
            Time remaining: {remainingTime}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Test Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Time:</span>
              <span>
                {startTime.toLocaleDateString()} {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>{test.durationMinutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="capitalize">{test.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difficulty:</span>
              <span className="capitalize">{test.difficulty}</span>
            </div>
            {test.status === "active" && remainingTime && (
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Progress:</span>
                  <span>
                    {testEndsAt &&
                      Math.min(
                        100,
                        Math.max(
                          0,
                          Math.round(
                            ((now.getTime() - startTime.getTime()) /
                              (testEndsAt.getTime() - startTime.getTime())) *
                              100
                          )
                        )
                      )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    testEndsAt
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            Math.round(
                              ((now.getTime() - startTime.getTime()) /
                                (testEndsAt.getTime() - startTime.getTime())) *
                                100
                            )
                          )
                        )
                      : 0
                  }
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{participants?.length || 0}</p>
            <p className="text-sm text-muted-foreground">
              {isParticipant ? "You are participating" : "You are not participating"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {test.status === "completed" && userScore ? (
              <>
                <p className="text-3xl font-bold">{userScore.points}</p>
                <p className="text-sm text-muted-foreground">
                  {userScore.solved} / {questions?.length} questions solved
                </p>
              </>
            ) : isParticipant ? (
              <>
                <p className="text-3xl font-bold">
                  {userSubmissions?.filter((s: any) => s.isCorrect).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Questions solved so far
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Join the test to see your score
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={isAdmin ? "questions" : "test"}>
        <TabsList className="mb-6">
          <TabsTrigger value="test">Test</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="questions">
              Questions ({questions?.length || 0})
            </TabsTrigger>
          )}
          {(isAdmin || test.status === "completed") && (
            <TabsTrigger value="results">
              Results ({results?.length || 0})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="test">
          {!isParticipant && test.status !== "completed" ? (
            <Card>
              <CardHeader>
                <CardTitle>Join the Test</CardTitle>
                <CardDescription>
                  You need to join the test to see questions and submit answers.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => participateMutation.mutate()}>
                  Join Test
                </Button>
              </CardFooter>
            </Card>
          ) : questions?.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question: any) => {
                    const submission = getUserSubmission(question.id);
                    const isSubmitted = !!submission;
                    const isCorrect = submission?.isCorrect;
                    const disabled =
                      test.status !== "active" || submitAnswerMutation.isPending;

                    // For completed tests or admin view
                    if (test.status === "completed" || isAdmin) {
                      return (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">
                            {question.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                question.difficulty === "easy"
                                  ? "bg-green-100 text-green-800"
                                  : question.difficulty === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {question.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>{question.platform}</TableCell>
                          <TableCell>{question.points}</TableCell>
                          <TableCell>
                            {isSubmitted ? (
                              isCorrect ? (
                                <span className="text-green-600 flex items-center">
                                  <ThumbsUp className="h-4 w-4 mr-1" /> Correct
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center">
                                  <ThumbsDown className="h-4 w-4 mr-1" /> Incorrect
                                </span>
                              )
                            ) : (
                              <span className="text-muted-foreground">
                                No submission
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <a
                              href={question.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" /> View
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // For active test and participant
                    return (
                      <TableRow key={question.id}>
                        <TableCell className="font-medium">
                          {question.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              question.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : question.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {question.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{question.platform}</TableCell>
                        <TableCell>{question.points}</TableCell>
                        <TableCell>
                          {isSubmitted ? (
                            isCorrect ? (
                              <span className="text-green-600 flex items-center">
                                <ThumbsUp className="h-4 w-4 mr-1" /> Correct
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center">
                                <ThumbsDown className="h-4 w-4 mr-1" /> Incorrect
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground">
                              Not submitted
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <a
                              href={question.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" /> View
                            </a>
                            {!isSubmitted && !disabled && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-800"
                                  onClick={() =>
                                    handleSubmit(question.id, true)
                                  }
                                  disabled={disabled}
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" /> Correct
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800"
                                  onClick={() =>
                                    handleSubmit(question.id, false)
                                  }
                                  disabled={disabled}
                                >
                                  <ThumbsDown className="h-4 w-4 mr-1" /> Wrong
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Questions</CardTitle>
                <CardDescription>
                  This test doesn't have any questions yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <p>Add questions to this test to get started.</p>
                ) : (
                  <p>
                    The test administrator needs to add questions to this test.
                  </p>
                )}
              </CardContent>
              {isAdmin && (
                <CardFooter>
                  <Button onClick={() => setAddQuestionsOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="questions">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Manage Questions</h2>
              <Dialog open={addQuestionsOpen} onOpenChange={setAddQuestionsOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Add Questions to Test</DialogTitle>
                    <DialogDescription>
                      Add questions to the test. You need to add at least {test.numQuestions} questions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p>This is a placeholder for a question selection interface.</p>
                    <p className="text-muted-foreground mt-2">
                      In a real implementation, this would include:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2">
                      <li>Search for questions from LeetCode/CodeForces</li>
                      <li>Question previews</li>
                      <li>Filtering by difficulty</li>
                      <li>Assigning point values</li>
                    </ul>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAddQuestionsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={() => {
                        // This is a stub implementation
                        const mockQuestions = [
                          {
                            title: "Two Sum",
                            url: "https://leetcode.com/problems/two-sum/",
                            platform: "leetcode",
                            difficulty: "easy",
                            points: 100,
                            questionId: 1,
                          },
                          {
                            title: "Add Two Numbers",
                            url: "https://leetcode.com/problems/add-two-numbers/",
                            platform: "leetcode",
                            difficulty: "medium",
                            points: 200,
                            questionId: 2,
                          },
                        ];
                        addQuestionsMutation.mutate({ questions: mockQuestions });
                      }}
                    >
                      Add Questions
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {questions?.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question: any) => (
                      <TableRow key={question.id}>
                        <TableCell className="font-medium">
                          {question.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              question.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : question.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {question.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{question.platform}</TableCell>
                        <TableCell>{question.points}</TableCell>
                        <TableCell>
                          <a
                            href={question.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 flex items-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" /> View
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Questions</CardTitle>
                  <CardDescription>
                    This test doesn't have any questions yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Add questions to this test to get started.</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setAddQuestionsOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        )}

        {(isAdmin || test.status === "completed") && (
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {test.status === "completed"
                    ? "Final results for this test."
                    : "Current standings based on submissions."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results?.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Participant</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Solved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result: any, index: number) => (
                          <TableRow key={result.userId}>
                            <TableCell className="font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback>
                                    {result.username?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                {result.username}
                                {result.userId === user?.id && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (You)
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{result.points}</TableCell>
                            <TableCell>
                              {result.solved} / {questions?.length}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                    <p>No results to display yet.</p>
                    {test.status !== "completed" && (
                      <p className="text-muted-foreground mt-2">
                        Results will be available once participants submit answers.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TestDetailPage;