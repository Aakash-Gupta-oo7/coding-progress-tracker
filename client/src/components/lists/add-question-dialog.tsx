import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLeetCodeQuestions } from "@/hooks/use-leetcode-questions";
import { useCodeForcesQuestions } from "@/hooks/use-codeforces-questions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search,
  ExternalLink,
  Clock,
  AlertTriangle
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AddQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: number;
}

export function AddQuestionDialog({ open, onOpenChange, listId }: AddQuestionDialogProps) {
  const [tab, setTab] = useState<"leetcode" | "codeforces" | "manual" | "url">("leetcode");
  const [manualQuestion, setManualQuestion] = useState({
    title: "",
    difficulty: "medium",
    url: "",
    platform: "leetcode"
  });
  const [urlInput, setUrlInput] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // LeetCode questions search
  const { 
    questions: leetcodeQuestions, 
    isLoading: isLeetCodeLoading, 
    setSearchQuery: setLeetCodeSearchQuery, 
    searchQuery: leetcodeSearchQuery 
  } = useLeetCodeQuestions();
  
  // CodeForces questions search
  const {
    questions: codeforcesQuestions,
    isLoading: isCodeForcesLoading,
    setSearchQuery: setCodeForcesSearchQuery,
    searchQuery: codeforcesSearchQuery
  } = useCodeForcesQuestions();
  
  // Mutation for adding a question
  const addQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      const res = await apiRequest("POST", "/api/questions/add_question", {
        ...questionData,
        listId
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/list/${listId}`] });
      toast({
        title: "Question added",
        description: "The question has been added to your list."
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add question",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Extract question details from URL
  const extractFromUrl = (url: string) => {
    let platform = "";
    let questionData = {
      title: "",
      difficulty: "medium",
      url: url,
      platform: ""
    };
    
    if (url.includes("leetcode.com")) {
      platform = "leetcode";
      // Format: https://leetcode.com/problems/problem-name/
      const parts = url.split("/problems/");
      if (parts.length > 1) {
        const problemName = parts[1].split("/")[0];
        questionData.title = problemName.split("-").map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ");
      }
    } else if (url.includes("codeforces.com")) {
      platform = "codeforces";
      // Format: https://codeforces.com/problemset/problem/1234/A
      const parts = url.match(/\/problem\/(\d+)\/([A-Z])/);
      if (parts && parts.length > 2) {
        const contestNumber = parts[1];
        const problemCode = parts[2];
        questionData.title = `Problem ${contestNumber}${problemCode}`;
      }
    } else if (url.includes("geeksforgeeks.org")) {
      platform = "gfg";
      // Format: https://practice.geeksforgeeks.org/problems/problem-name/1
      const parts = url.split("/problems/");
      if (parts.length > 1) {
        const problemName = parts[1].split("/")[0];
        questionData.title = problemName.split("-").map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ");
      }
    }
    
    return { ...questionData, platform };
  };
  
  const handleAddFromSearch = (question: any) => {
    addQuestionMutation.mutate({
      title: question.title,
      url: question.link, // LeetCode questions use 'link' for URL
      platform: "leetcode",
      difficulty: question.difficulty,
      solved: false
    });
  };
  
  const handleAddCodeForcesQuestion = (question: any) => {
    addQuestionMutation.mutate({
      title: question.title,
      url: question.url,
      platform: "codeforces",
      difficulty: question.difficulty || "medium", // CodeForces may not have difficulty info
      solved: false
    });
  };
  
  const handleAddManual = () => {
    if (!manualQuestion.title || !manualQuestion.url) {
      toast({
        title: "Missing information",
        description: "Please provide both title and URL",
        variant: "destructive"
      });
      return;
    }
    
    addQuestionMutation.mutate({
      ...manualQuestion,
      solved: false
    });
  };
  
  const handleAddFromUrl = () => {
    if (!urlInput) {
      toast({
        title: "Missing URL",
        description: "Please provide a valid URL",
        variant: "destructive"
      });
      return;
    }
    
    const questionData = extractFromUrl(urlInput);
    
    if (!questionData.platform) {
      toast({
        title: "Unsupported platform",
        description: "URL from an unsupported platform. Please use LeetCode, CodeForces, or GeeksForGeeks",
        variant: "destructive"
      });
      return;
    }
    
    addQuestionMutation.mutate({
      ...questionData,
      solved: false
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Question to List</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={(value) => setTab(value as any)} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="leetcode">LeetCode</TabsTrigger>
            <TabsTrigger value="codeforces">CodeForces</TabsTrigger>
            <TabsTrigger value="url">Add from URL</TabsTrigger>
            <TabsTrigger value="manual">Add Manually</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leetcode" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <Input 
                  placeholder="Search LeetCode questions by title, number, or difficulty" 
                  value={leetcodeSearchQuery}
                  onChange={(e) => setLeetCodeSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <ScrollArea className="h-[400px] border rounded-md">
                {isLeetCodeLoading ? (
                  <div className="space-y-2 p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))}
                  </div>
                ) : leetcodeQuestions.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No questions found
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {leetcodeQuestions.map((question) => (
                      <div 
                        key={question.questionNumber}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 cursor-pointer border"
                        onClick={() => handleAddFromSearch(question)}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{question.questionNumber}. {question.title}</span>
                            {question.premium && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Premium
                              </Badge>
                            )}
                          </div>
                          <div className="flex space-x-2 text-xs text-muted-foreground mt-1">
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
                            <a 
                              href={question.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" /> View
                            </a>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFromSearch(question);
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="codeforces" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <Input 
                  placeholder="Search CodeForces problems by ID or title" 
                  value={codeforcesSearchQuery}
                  onChange={(e) => setCodeForcesSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <ScrollArea className="h-[400px] border rounded-md">
                {isCodeForcesLoading ? (
                  <div className="space-y-2 p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))}
                  </div>
                ) : codeforcesQuestions.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No questions found
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {codeforcesQuestions.map((question) => (
                      <div 
                        key={question.problemId}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 cursor-pointer border"
                        onClick={() => handleAddCodeForcesQuestion(question)}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{question.problemId} - {question.title}</span>
                          </div>
                          <div className="flex space-x-2 text-xs text-muted-foreground mt-1">
                            {question.difficulty && (
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
                            )}
                            <a 
                              href={question.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" /> View
                            </a>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddCodeForcesQuestion(question);
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">Problem URL</Label>
                <Input 
                  id="url-input"
                  placeholder="https://leetcode.com/problems/two-sum/" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Paste a URL from LeetCode, CodeForces, or GeeksForGeeks
                </p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleAddFromUrl}
                disabled={addQuestionMutation.isPending}
              >
                {addQuestionMutation.isPending ? "Adding..." : "Add Question"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Question Title</Label>
                <Input 
                  id="title"
                  placeholder="Two Sum" 
                  value={manualQuestion.title}
                  onChange={(e) => setManualQuestion({...manualQuestion, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select 
                  value={manualQuestion.platform} 
                  onValueChange={(value) => setManualQuestion({...manualQuestion, platform: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leetcode">LeetCode</SelectItem>
                    <SelectItem value="codeforces">CodeForces</SelectItem>
                    <SelectItem value="gfg">GeeksForGeeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={manualQuestion.difficulty} 
                  onValueChange={(value) => setManualQuestion({...manualQuestion, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">URL (Optional)</Label>
                <Input 
                  id="url"
                  placeholder="https://leetcode.com/problems/two-sum/" 
                  value={manualQuestion.url}
                  onChange={(e) => setManualQuestion({...manualQuestion, url: e.target.value})}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleAddManual}
                disabled={addQuestionMutation.isPending}
              >
                {addQuestionMutation.isPending ? "Adding..." : "Add Question"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}