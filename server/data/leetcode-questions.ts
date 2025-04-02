import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface LeetCodeQuestion {
  questionNumber: string;
  title: string;
  link: string;
  difficulty: string;
  premium: boolean;
}

let cachedQuestions: LeetCodeQuestion[] = [];

export function loadLeetCodeQuestions(): LeetCodeQuestion[] {
  if (cachedQuestions.length > 0) {
    return cachedQuestions;
  }
  
  try {
    const csvFilePath = path.join(process.cwd(), 'attached_assets', 'leetcode_problems_full.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    const newQuestions = records.map((record: any) => ({
      questionNumber: record['Question Number'],
      title: record['Title'],
      link: record['Link'],
      difficulty: record['Difficulty'].toLowerCase(),
      premium: record['Premium'] === 'True'
    }));
    
    cachedQuestions = newQuestions;
    return newQuestions;
  } catch (error) {
    console.error('Error loading LeetCode questions:', error);
    return [];
  }
}

export function searchLeetCodeQuestions(query: string): LeetCodeQuestion[] {
  const questions = loadLeetCodeQuestions();
  
  if (!query || query.trim() === '') {
    return questions.slice(0, 100); // Return first 100 if no query
  }
  
  const lowerCaseQuery = query.toLowerCase();
  
  return questions.filter(question => {
    const matchesTitle = question.title.toLowerCase().includes(lowerCaseQuery);
    const matchesNumber = question.questionNumber === query;
    const matchesDifficulty = question.difficulty.toLowerCase() === lowerCaseQuery;
    
    return matchesTitle || matchesNumber || matchesDifficulty;
  }).slice(0, 100); // Limit results to 100
}