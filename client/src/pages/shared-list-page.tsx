import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useParams, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLeetCodeQuestions } from "@/hooks/use-leetcode-questions";
import { useCodeForcesQuestions } from "@/hooks/use-codeforces-questions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Check,
  ExternalLink,
  Calendar,
  Users,
  User,
  Search,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// Form schema for adding a question
const questionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  platform: z.string().min(1, "Platform is required"),
  difficulty: z.string().optional(),
  topic: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

const SharedListPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const listId = parseInt(params.listId || "0");
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);

  // Fetch shared list details
  const { data: listData, isLoading } = useQuery({
    queryKey: [`/api/shared-lists/${listId}`],
    enabled: !!user && !!listId,
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const res = await apiRequest("POST", `/api/shared-lists/${listId}/questions`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shared-lists/${listId}`] });
      setAddQuestionOpen(false);
      toast({
        title: "Question added",
        description: "The question has been added to the shared list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark solved mutation
  const markSolvedMutation = useMutation({
    mutationFn: async ({ questionId, isSolved }: { questionId: number; isSolved: boolean }) => {
      const res = await apiRequest(
        "POST",
        `/api/shared-lists/${listId}/questions/${questionId}/progress`,
        { isSolved }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shared-lists/${listId}`] });
      toast({
        title: "Progress updated",
        description: "Your progress has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Question form
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      url: "",
      platform: "leetcode",
      difficulty: "",
      topic: "",
    },
  });

  // Form submission handler
  function onAddQuestionSubmit(data: QuestionFormValues) {
    addQuestionMutation.mutate(data);
  }

  // Toggle solved status
  const toggleSolved = (questionId: number, currentStatus: boolean) => {
    markSolvedMutation.mutate({ questionId, isSolved: !currentStatus });
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">You need to be logged in</h1>
          <p className="mb-4">Please log in to view shared lists.</p>
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

  if (!listData?.list) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">List not found</h1>
          <p className="mb-4">
            The shared list you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link href="/groups">Back to Groups</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { list, questions, progress } = listData;

  // Find the solved status for each question
  const getQuestionStatus = (questionId: number) => {
    const questionProgress = progress?.find((p: any) => p.questionId === questionId);
    return questionProgress?.isSolved || false;
  };

  // Group questions by platform
  const questionsByPlatform: Record<string, any[]> = {};
  questions.forEach((question: any) => {
    if (!questionsByPlatform[question.platform]) {
      questionsByPlatform[question.platform] = [];
    }
    questionsByPlatform[question.platform].push(question);
  });

  // Filter solved and unsolved questions
  const solvedQuestions = questions.filter((q: any) => getQuestionStatus(q.id));
  const unsolvedQuestions = questions.filter((q: any) => !getQuestionStatus(q.id));

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/groups/${list.groupId}`}>
              <Button variant="ghost" className="p-0 h-auto">
                <span className="text-sm text-muted-foreground">Group</span>
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/groups">
              <Button variant="ghost" className="p-0 h-auto">
                <span className="text-sm text-muted-foreground">Shared Lists</span>
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold">{list.name}</h1>
          </div>
          <p className="text-muted-foreground">
            {list.description || "No description provided."}
          </p>
        </div>

        <Dialog open={addQuestionOpen} onOpenChange={setAddQuestionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Question to Shared List</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="manual">
              <TabsList className="mb-4">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="leetcode">LeetCode</TabsTrigger>
                <TabsTrigger value="codeforces">CodeForces</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual">
                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(onAddQuestionSubmit)}>
                    <FormField
                      control={questionForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter question title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={questionForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <FormField
                        control={questionForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <FormControl>
                              <select
                                className="w-full px-3 py-2 border rounded-md"
                                {...field}
                              >
                                <option value="leetcode">LeetCode</option>
                                <option value="codeforces">CodeForces</option>
                                <option value="gfg">GeeksforGeeks</option>
                                <option value="other">Other</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <FormControl>
                              <select
                                className="w-full px-3 py-2 border rounded-md"
                                {...field}
                              >
                                <option value="">Select...</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={questionForm.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., DP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter className="mt-6">
                      <Button
                        type="submit"
                        disabled={addQuestionMutation.isPending}
                      >
                        {addQuestionMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add Question
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="leetcode">
                <LeetCodeQuestionSearch onAddQuestion={(question) => {
                  // Auto-fill the form with LeetCode question data
                  questionForm.setValue("title", question.title);
                  questionForm.setValue("url", question.link);
                  questionForm.setValue("platform", "leetcode");
                  questionForm.setValue("difficulty", question.difficulty.toLowerCase());
                  
                  // Submit the form automatically
                  questionForm.handleSubmit(onAddQuestionSubmit)();
                }} />
              </TabsContent>
              
              <TabsContent value="codeforces">
                <CodeForcesQuestionSearch onAddQuestion={(question) => {
                  // Auto-fill the form with CodeForces question data
                  questionForm.setValue("title", question.title);
                  questionForm.setValue("url", question.url);
                  questionForm.setValue("platform", "codeforces");
                  questionForm.setValue("difficulty", question.difficulty || "");
                  
                  // Submit the form automatically
                  questionForm.handleSubmit(onAddQuestionSubmit)();
                }} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-2" />
          <span>Created by: User {list.createdBy}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Created {new Date(list.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Check className="h-4 w-4 mr-2" />
          <span>
            {solvedQuestions.length} of {questions.length} solved (
            {questions.length > 0
              ? Math.round((solvedQuestions.length / questions.length) * 100)
              : 0}
            %)
          </span>
        </div>
      </div>

      {questions.length > 0 ? (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="solved">Solved ({solvedQuestions.length})</TabsTrigger>
            <TabsTrigger value="unsolved">Unsolved ({unsolvedQuestions.length})</TabsTrigger>
            {Object.keys(questionsByPlatform).map((platform) => (
              <TabsTrigger key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)} ({questionsByPlatform[platform].length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <QuestionsTable
              questions={questions}
              getQuestionStatus={getQuestionStatus}
              toggleSolved={toggleSolved}
              isLoading={markSolvedMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="solved">
            <QuestionsTable
              questions={solvedQuestions}
              getQuestionStatus={getQuestionStatus}
              toggleSolved={toggleSolved}
              isLoading={markSolvedMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="unsolved">
            <QuestionsTable
              questions={unsolvedQuestions}
              getQuestionStatus={getQuestionStatus}
              toggleSolved={toggleSolved}
              isLoading={markSolvedMutation.isPending}
            />
          </TabsContent>

          {Object.keys(questionsByPlatform).map((platform) => (
            <TabsContent key={platform} value={platform}>
              <QuestionsTable
                questions={questionsByPlatform[platform]}
                getQuestionStatus={getQuestionStatus}
                toggleSolved={toggleSolved}
                isLoading={markSolvedMutation.isPending}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Questions Yet</CardTitle>
            <CardDescription>
              This shared list doesn't have any questions yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Add questions to this list to start collaborating with your group.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => setAddQuestionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Questions table component
const QuestionsTable = ({
  questions,
  getQuestionStatus,
  toggleSolved,
  isLoading,
}: {
  questions: any[];
  getQuestionStatus: (id: number) => boolean;
  toggleSolved: (id: number, status: boolean) => void;
  isLoading: boolean;
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Status</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Added By</TableHead>
            <TableHead className="w-20">Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => {
            const isSolved = getQuestionStatus(question.id);
            const platformColors: Record<string, string> = {
              leetcode: "bg-yellow-100 text-yellow-800",
              codeforces: "bg-red-100 text-red-800",
              gfg: "bg-green-100 text-green-800",
              other: "bg-blue-100 text-blue-800",
            };
            const difficultyColors: Record<string, string> = {
              easy: "bg-green-100 text-green-800",
              medium: "bg-yellow-100 text-yellow-800",
              hard: "bg-red-100 text-red-800",
            };

            return (
              <TableRow key={question.id}>
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full ${
                      isSolved
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    onClick={() => toggleSolved(question.id, isSolved)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className={`h-4 w-4 ${isSolved ? "opacity-100" : "opacity-0"}`} />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{question.title}</TableCell>
                <TableCell>
                  {question.difficulty && (
                    <Badge variant="outline" className={difficultyColors[question.difficulty]}>
                      {question.difficulty}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{question.topic || "-"}</TableCell>
                <TableCell>
                  <Badge className={platformColors[question.platform] || platformColors.other}>
                    {question.platform}
                  </Badge>
                </TableCell>
                <TableCell>User {question.addedBy}</TableCell>
                <TableCell>
                  <a
                    href={question.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

// LeetCode Question Search Component
const LeetCodeQuestionSearch = ({ 
  onAddQuestion 
}: { 
  onAddQuestion: (question: any) => void 
}) => {
  const { 
    questions, 
    searchQuery, 
    setSearchQuery, 
    isLoading 
  } = useLeetCodeQuestions();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search LeetCode questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {questions.length > 0 ? (
              questions.map((question) => (
                <div 
                  key={question.questionNumber}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => onAddQuestion(question)}
                >
                  <div>
                    <div className="font-medium">{question.title}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className={`
                        ${question.difficulty === 'Easy' 
                          ? 'bg-green-100 text-green-800' 
                          : question.difficulty === 'Medium' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {question.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">#{question.questionNumber}</span>
                      {question.premium && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">Premium</Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery 
                  ? "No questions found matching your search" 
                  : "Start typing to search for LeetCode questions"}
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

// CodeForces Question Search Component
const CodeForcesQuestionSearch = ({ 
  onAddQuestion 
}: { 
  onAddQuestion: (question: any) => void 
}) => {
  const { 
    questions, 
    searchQuery, 
    setSearchQuery, 
    isLoading 
  } = useCodeForcesQuestions();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search CodeForces problems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {questions.length > 0 ? (
              questions.map((question) => (
                <div 
                  key={question.problemId}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => onAddQuestion(question)}
                >
                  <div>
                    <div className="font-medium">{question.title}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      {question.difficulty && (
                        <Badge variant="outline" className={`
                          ${question.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800' 
                            : question.difficulty === 'medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {question.difficulty}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">Problem {question.problemId}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery 
                  ? "No problems found matching your search" 
                  : "Start typing to search for CodeForces problems"}
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SharedListPage;