import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export interface CodeForcesQuestion {
  problemId: string;
  title: string;
  url: string;
  difficulty?: string;
}

export function useCodeForcesQuestions(initialQuery = "") {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  // Debounce search to prevent too many API calls
  const debouncedSearch = useDebouncedCallback((query: string) => {
    setSearchQuery(query);
  }, 300);
  
  const {
    data: questions = [],
    isLoading,
    error,
  } = useQuery<CodeForcesQuestion[]>({
    queryKey: ["/api/codeforces/questions", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/codeforces/questions?q=${encodeURIComponent(searchQuery || "")}`);
      if (!response.ok) {
        throw new Error("Failed to fetch CodeForces questions");
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