import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface CodeForcesQuestion {
  problemId: string;
  title: string;
  url: string;
  difficulty?: string; // Optional as CodeForces doesn't have explicit difficulty levels like LeetCode
}

let cachedQuestions: CodeForcesQuestion[] = [];

export function loadCodeForcesQuestions(): CodeForcesQuestion[] {
  if (cachedQuestions.length > 0) {
    return cachedQuestions;
  }
  
  try {
    const csvFilePath = path.join(process.cwd(), 'attached_assets', 'codeforces_problems.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    const newQuestions = records.map((record: any) => {
      // Extract problem difficulty level from problem ID if possible
      // CodeForces problems usually have IDs like "123A", "456B", where the letter indicates difficulty
      const problemId = record['Problem ID'] || '';
      const letter = problemId.match(/[A-Z]$/);
      
      // Map CodeForces A-E letters to difficulty levels
      let difficulty = 'unknown';
      if (letter) {
        const difficultyLetter = letter[0];
        if (difficultyLetter === 'A' || difficultyLetter === 'B') {
          difficulty = 'easy';
        } else if (difficultyLetter === 'C' || difficultyLetter === 'D') {
          difficulty = 'medium';
        } else {
          difficulty = 'hard';
        }
      }
      
      return {
        problemId: problemId,
        title: record['Title'],
        url: record['Link'],
        difficulty: difficulty
      };
    });
    
    cachedQuestions = newQuestions;
    return newQuestions;
  } catch (error) {
    console.error('Error loading CodeForces questions:', error);
    return [];
  }
}

export function searchCodeForcesQuestions(query: string): CodeForcesQuestion[] {
  const questions = loadCodeForcesQuestions();
  
  if (!query || query.trim() === '') {
    return questions.slice(0, 100); // Return first 100 if no query
  }
  
  const lowerCaseQuery = query.toLowerCase();
  
  return questions.filter(question => {
    const matchesTitle = question.title.toLowerCase().includes(lowerCaseQuery);
    const matchesId = question.problemId.toLowerCase() === lowerCaseQuery;
    const matchesDifficulty = question.difficulty?.toLowerCase() === lowerCaseQuery;
    
    return matchesTitle || matchesId || matchesDifficulty;
  }).slice(0, 100); // Limit results to 100
}