import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export interface LeetCodeQuestion {
  questionNumber: string;
  title: string;
  link: string;
  difficulty: string;
  premium: boolean;
}

export function useLeetCodeQuestions(initialQuery = "") {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  // Debounce search to prevent too many API calls
  const debouncedSearch = useDebouncedCallback((query: string) => {
    setSearchQuery(query);
  }, 300);
  
  const {
    data: questions = [],
    isLoading,
    error,
  } = useQuery<LeetCodeQuestion[]>({
    queryKey: ["/api/leetcode/questions", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/leetcode/questions?q=${encodeURIComponent(searchQuery || "")}`);
      if (!response.ok) {
        throw new Error("Failed to fetch LeetCode questions");
      }
      return response.json();
    },
  });
  
  return {
    questions,
    isLoading,
    error,
    searchQuery,
    setSearchQuery: debouncedSearch,
  };
}