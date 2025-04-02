import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface QuestionListCardProps {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  totalProblems: number;
  solvedProblems: number;
}

export function QuestionListCard({
  id,
  name,
  description,
  isPublic,
  totalProblems,
  solvedProblems
}: QuestionListCardProps) {
  const progressPercentage = totalProblems > 0 
    ? Math.round((solvedProblems / totalProblems) * 100) 
    : 0;

  return (
    <Link href={`/lists/${id}`}>
      <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:shadow-md transition duration-200 cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium">{name}</h4>
          <Badge variant={isPublic ? "default" : "secondary"}>
            {isPublic ? "Public" : "Private"}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{description}</p>
        <div className="flex justify-between items-center text-xs">
          <span>{totalProblems} problems</span>
          <span>{solvedProblems} solved</span>
        </div>
        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <Progress value={progressPercentage} className="h-full" />
        </div>
      </div>
    </Link>
  );
}
