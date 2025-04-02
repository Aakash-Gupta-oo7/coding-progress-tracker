import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionListCard } from "@/components/dashboard/question-list-card";
import { CreateListDialog } from "@/components/lists/create-list-dialog";
import { AddQuestionDialog } from "@/components/lists/add-question-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertQuestionList, InsertQuestion, QuestionList, Question } from "@shared/schema";
import { Plus, Loader2 } from "lucide-react";

export default function ListsPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      document.documentElement.classList.toggle('dark');
      return newValue;
    });
  };

  // Fetch user's question lists
  const { 
    data: questionLists, 
    isLoading: isQuestionListsLoading 
  } = useQuery<QuestionList[]>({
    queryKey: ["/api/questions/lists"],
  });

  // Fetch public question lists
  const { 
    data: publicLists, 
    isLoading: isPublicListsLoading 
  } = useQuery<QuestionList[]>({
    queryKey: ["/api/questions/public-lists"],
  });

  // Fetch selected list's questions
  const { 
    data: selectedListData, 
    isLoading: isSelectedListLoading 
  } = useQuery<{list: QuestionList, questions: Question[]}>({
    queryKey: ["/api/questions/list", selectedListId],
    enabled: !!selectedListId,
  });

  // Create a new list
  const createListMutation = useMutation({
    mutationFn: async (data: InsertQuestionList) => {
      const res = await apiRequest("POST", "/api/questions/create_list", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions/lists"] });
      toast({
        title: "List Created",
        description: "Your new question list has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create List",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add a question to a list
  const addQuestionMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const res = await apiRequest("POST", "/api/questions/add_question", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions/list", selectedListId] });
      toast({
        title: "Question Added",
        description: "The question has been added to your list.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Question",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mark a question as solved/unsolved
  const markQuestionMutation = useMutation({
    mutationFn: async ({ questionId, solved }: { questionId: number, solved: boolean }) => {
      const res = await apiRequest(
        "POST", 
        `/api/questions/list/${selectedListId}/mark_solved/${questionId}`, 
        { solved }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions/list", selectedListId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Question",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateList = async (data: InsertQuestionList) => {
    await createListMutation.mutateAsync(data);
  };

  const handleAddQuestion = async (data: InsertQuestion) => {
    await addQuestionMutation.mutateAsync(data);
  };

  const handleMarkQuestion = async (questionId: number, solved: boolean) => {
    await markQuestionMutation.mutateAsync({ questionId, solved });
  };

  // Calculate question stats for each list
  const getListStats = (listId: number) => {
    if (!questionLists) return { total: 0, solved: 0 };
    
    // If we're viewing this list, use the detailed data
    if (selectedListId === listId && selectedListData) {
      const questions = selectedListData.questions;
      return {
        total: questions.length,
        solved: questions.filter(q => q.isSolved).length
      };
    }
    
    // Otherwise just use placeholder counts for now
    return { total: 0, solved: 0 };
  };

  return (
    <div>
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar />

      <main className="ml-0 md:ml-64 pt-16 min-h-screen">
        <div className="px-4 py-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Question Lists</h2>
              <p className="text-gray-600 dark:text-gray-400">Create and manage your coding problem lists</p>
            </div>
            <CreateListDialog 
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New List
                </Button>
              }
              onSubmit={handleCreateList}
            />
          </div>

          <Tabs defaultValue="my-lists">
            <TabsList className="mb-6">
              <TabsTrigger value="my-lists">My Lists</TabsTrigger>
              <TabsTrigger value="public-lists">Public Lists</TabsTrigger>
              {selectedListId && <TabsTrigger value="selected-list">List Details</TabsTrigger>}
            </TabsList>

            <TabsContent value="my-lists">
              {isQuestionListsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : questionLists && questionLists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {questionLists.map(list => {
                    const stats = getListStats(list.id);
                    return (
                      <div key={list.id} onClick={() => setSelectedListId(list.id)}>
                        <QuestionListCard
                          id={list.id}
                          name={list.name}
                          description={list.description || ""}
                          isPublic={list.isPublic}
                          totalProblems={stats.total}
                          solvedProblems={stats.solved}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">No Lists Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first question list to start tracking your progress</p>
                  <CreateListDialog 
                    trigger={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create List
                      </Button>
                    }
                    onSubmit={handleCreateList}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="public-lists">
              {isPublicListsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : publicLists && publicLists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {publicLists.map(list => {
                    const stats = getListStats(list.id);
                    return (
                      <div key={list.id} onClick={() => setSelectedListId(list.id)}>
                        <QuestionListCard
                          id={list.id}
                          name={list.name}
                          description={list.description || ""}
                          isPublic={list.isPublic}
                          totalProblems={stats.total}
                          solvedProblems={stats.solved}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">No Public Lists Available</h3>
                  <p className="text-gray-500 dark:text-gray-400">There are no public question lists available at the moment.</p>
                </div>
              )}
            </TabsContent>

            {selectedListId && (
              <TabsContent value="selected-list">
                {isSelectedListLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : selectedListData ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>{selectedListData.list.name}</CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {selectedListData.list.description || "No description"}
                          </p>
                        </div>
                        <AddQuestionDialog
                          trigger={
                            <Button>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Question
                            </Button>
                          }
                          listId={selectedListId}
                          onSubmit={handleAddQuestion}
                        />
                      </CardHeader>
                      <CardContent>
                        {selectedListData.questions.length > 0 ? (
                          <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th scope="col" className="px-6 py-3">Status</th>
                                  <th scope="col" className="px-6 py-3">Title</th>
                                  <th scope="col" className="px-6 py-3">Platform</th>
                                  <th scope="col" className="px-6 py-3">Difficulty</th>
                                  <th scope="col" className="px-6 py-3">Topic</th>
                                  <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedListData.questions.map(question => (
                                  <tr key={question.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                    <td className="px-6 py-4">
                                      <input 
                                        type="checkbox" 
                                        checked={question.isSolved} 
                                        onChange={(e) => handleMarkQuestion(question.id, e.target.checked)}
                                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                      />
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                      <a 
                                        href={question.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        {question.title}
                                      </a>
                                    </td>
                                    <td className="px-6 py-4">
                                      {question.platform === 'leetcode' && 'LeetCode'}
                                      {question.platform === 'codeforces' && 'CodeForces'}
                                      {question.platform === 'gfg' && 'GeeksForGeeks'}
                                    </td>
                                    <td className="px-6 py-4">
                                      {question.difficulty && (
                                        <span className={
                                          question.difficulty === 'easy' 
                                            ? 'text-green-500' 
                                            : question.difficulty === 'medium' 
                                              ? 'text-yellow-500' 
                                              : 'text-red-500'
                                        }>
                                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      {question.topic || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                      <Button 
                                        variant={question.isSolved ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => handleMarkQuestion(question.id, !question.isSolved)}
                                      >
                                        {question.isSolved ? 'Mark Unsolved' : 'Mark Solved'}
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">No Questions Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">Add questions to this list to start tracking your progress</p>
                            <AddQuestionDialog 
                              trigger={<Button>Add First Question</Button>}
                              listId={selectedListId}
                              onSubmit={handleAddQuestion}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Failed to load list details. Please try again.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setSelectedListId(null)}>
                      Back to Lists
                    </Button>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
