import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionListCard } from "@/components/dashboard/question-list-card";
import { CreateListDialog } from "@/components/lists/create-list-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertQuestionList, QuestionList } from "@shared/schema";
import { Plus, Loader2 } from "lucide-react";

export default function ListsPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
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

  const handleCreateList = async (data: InsertQuestionList) => {
    await createListMutation.mutateAsync(data);
  };

  // Simple placeholder stat function
  const getListStats = () => {
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
            </TabsList>

            <TabsContent value="my-lists">
              {isQuestionListsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : questionLists && questionLists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {questionLists.map(list => {
                    const stats = getListStats();
                    return (
                      <div key={list.id}>
                        <QuestionListCard
                          id={list.id}
                          name={list.name}
                          description={list.description || ""}
                          isPublic={list.isPublic || false}
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
                    const stats = getListStats();
                    return (
                      <div key={list.id}>
                        <QuestionListCard
                          id={list.id}
                          name={list.name}
                          description={list.description || ""}
                          isPublic={list.isPublic || false}
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
          </Tabs>
        </div>
      </main>
    </div>
  );
}