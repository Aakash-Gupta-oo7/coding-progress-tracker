import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddQuestionDialog } from "@/components/lists/add-question-dialog";
import { ExternalLink, Plus, ArrowLeft, Trash2, ListChecks } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Question {
  id: number;
  listId: number;
  title: string;
  platform: "leetcode" | "codeforces" | "gfg";
  link: string;
  difficulty: string;
  solved: boolean;
}

interface QuestionList {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  userId: number;
  createdAt: string;
}

export default function ListDetailPage() {
  const { listId } = useParams();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch list details and questions
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/questions/list/${listId}`],
    queryFn: async () => {
      if (!listId) throw new Error("List ID is required");
      const response = await fetch(`/api/questions/list/${listId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("List not found");
        }
        throw new Error("Failed to fetch list details");
      }
      return response.json();
    }
  });
  
  // Mutation for marking a question as solved/unsolved
  const markQuestionMutation = useMutation({
    mutationFn: async ({ questionId, solved }: { questionId: number, solved: boolean }) => {
      const res = await apiRequest("POST", `/api/questions/list/${listId}/mark_solved/${questionId}`, { solved });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/list/${listId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update question",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handler for toggling solved status
  const handleToggleSolved = (questionId: number, currentSolvedStatus: boolean) => {
    markQuestionMutation.mutate({ 
      questionId, 
      solved: !currentSolvedStatus 
    });
  };
  
  // Metrics calculation
  const calculateMetrics = (questions: Question[]) => {
    if (!questions || questions.length === 0) {
      return { total: 0, solved: 0, completion: 0 };
    }
    
    const total = questions.length;
    const solved = questions.filter(q => q.solved).length;
    const completion = Math.round((solved / total) * 100);
    
    return { total, solved, completion };
  };
  
  // Group questions by platform
  const groupQuestionsByPlatform = (questions: Question[]) => {
    const grouped: Record<string, Question[]> = {
      leetcode: [],
      codeforces: [],
      gfg: []
    };
    
    questions.forEach(question => {
      const platform = question.platform;
      if (!grouped[platform]) {
        grouped[platform] = [];
      }
      grouped[platform].push(question);
    });
    
    return grouped;
  };
  
  // Group questions by difficulty
  const groupQuestionsByDifficulty = (questions: Question[]) => {
    return {
      easy: questions.filter(q => q.difficulty === 'easy'),
      medium: questions.filter(q => q.difficulty === 'medium'),
      hard: questions.filter(q => q.difficulty === 'hard')
    };
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container py-8 max-w-5xl">
        <div className="space-y-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error || !data) {
    return (
      <div className="container py-8 max-w-5xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Error Loading List</h2>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Failed to load the question list"}
          </p>
          <Link href="/lists">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lists
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const { list, questions } = data;
  const metrics = calculateMetrics(questions);
  const groupedByPlatform = groupQuestionsByPlatform(questions);
  const groupedByDifficulty = groupQuestionsByDifficulty(questions);
  
  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/lists">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{list.name}</h1>
          {list.isPublic && (
            <Badge variant="outline" className="ml-2">Public</Badge>
          )}
        </div>
        
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>
      
      {list.description && (
        <p className="text-muted-foreground mb-8">{list.description}</p>
      )}
      
      {/* Progress Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold">{metrics.completion}%</span>
              <span className="text-muted-foreground">completed</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.solved} of {metrics.total} questions solved
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Difficulty Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Easy
                </Badge>
                <p className="text-sm mt-1">{groupedByDifficulty.easy.length}</p>
              </div>
              <div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Medium
                </Badge>
                <p className="text-sm mt-1">{groupedByDifficulty.medium.length}</p>
              </div>
              <div>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  Hard
                </Badge>
                <p className="text-sm mt-1">{groupedByDifficulty.hard.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  LeetCode
                </Badge>
                <p className="text-sm mt-1">{groupedByPlatform.leetcode.length}</p>
              </div>
              <div>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                  CodeForces
                </Badge>
                <p className="text-sm mt-1">{groupedByPlatform.codeforces.length}</p>
              </div>
              <div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  GFG
                </Badge>
                <p className="text-sm mt-1">{groupedByPlatform.gfg.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Questions list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListChecks className="mr-2 h-5 w-5" />
            Question List
          </CardTitle>
          <CardDescription>
            {metrics.total} questions in this list
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No questions in this list yet</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {questions.map((question: Question) => (
                  <div 
                    key={question.id}
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      question.solved ? 'bg-secondary/30' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        checked={question.solved}
                        onCheckedChange={() => handleToggleSolved(question.id, question.solved)}
                        id={`question-${question.id}`}
                      />
                      <div className="flex flex-col">
                        <label 
                          htmlFor={`question-${question.id}`}
                          className={`font-medium cursor-pointer ${
                            question.solved ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {question.title}
                        </label>
                        <div className="flex space-x-2 text-xs text-muted-foreground mt-1">
                          <Badge 
                            variant="outline" 
                            className={
                              question.platform === 'leetcode' 
                                ? 'bg-blue-100 text-blue-800 border-blue-300' 
                                : question.platform === 'codeforces'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : 'bg-green-100 text-green-800 border-green-300'
                            }
                          >
                            {question.platform === 'leetcode' 
                              ? 'LeetCode' 
                              : question.platform === 'codeforces'
                                ? 'CodeForces'
                                : 'GFG'
                            }
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              question.difficulty === 'easy' 
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : question.difficulty === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                  : 'bg-red-100 text-red-800 border-red-300'
                            }
                          >
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {question.link && (
                        <a 
                          href={question.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* Add question dialog */}
      <AddQuestionDialog 
        open={isAddDialogOpen} 
        onOpenChange={setAddDialogOpen}
        listId={parseInt(listId as string)}
      />
    </div>
  );
}