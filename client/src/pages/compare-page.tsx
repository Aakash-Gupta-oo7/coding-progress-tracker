import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { ComparisonForm } from "@/components/compare/comparison-form";
import { ComparisonResults } from "@/components/compare/comparison-results";
import { apiRequest } from "@/lib/queryClient";
import { CompareData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ComparePage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [comparisonData, setComparisonData] = useState<{[username: string]: CompareData}>({});
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      document.documentElement.classList.toggle('dark');
      return newValue;
    });
  };

  const compareMutation = useMutation({
    mutationFn: async (data: {
      leetcodeUsername?: string,
      codeforcesHandle?: string,
      gfgUsername?: string
    }) => {
      const res = await apiRequest("POST", "/api/compare", data);
      return res.json();
    },
    onSuccess: (data) => {
      // Create a key for the comparison data based on the usernames
      const usernameKey = data.leetcode?.username || 
                        data.codeforces?.handle || 
                        data.gfg?.username || 
                        "User";
      
      setComparisonData(prev => ({
        ...prev,
        [usernameKey]: data
      }));
      
      toast({
        title: "Comparison Data Loaded",
        description: `Successfully loaded data for ${usernameKey}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Comparison Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: {
    leetcodeUsername?: string,
    codeforcesHandle?: string,
    gfgUsername?: string
  }) => {
    compareMutation.mutate(data);
  };

  return (
    <div>
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar />

      <main className="ml-0 md:ml-64 pt-16 min-h-screen">
        <div className="px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Compare Profiles</h2>
            <p className="text-gray-600 dark:text-gray-400">Compare progress across different coding platforms</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <ComparisonForm 
              onSubmit={handleSubmit} 
              isLoading={compareMutation.isPending} 
            />
            
            {Object.keys(comparisonData).length > 0 && (
              <ComparisonResults data={comparisonData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
