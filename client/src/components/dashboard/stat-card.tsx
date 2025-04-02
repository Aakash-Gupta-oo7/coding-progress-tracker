import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: "primary" | "red" | "green" | "blue" | "yellow" | "purple";
  change?: {
    value: string | number;
    positive?: boolean;
    text?: string;
  };
}

export function StatCard({ title, value, icon, color, change }: StatCardProps) {
  const colorClasses = {
    primary: {
      bg: "bg-primary bg-opacity-10",
      text: "text-primary"
    },
    red: {
      bg: "bg-red-500 bg-opacity-10",
      text: "text-red-500"
    },
    green: {
      bg: "bg-green-500 bg-opacity-10",
      text: "text-green-500"
    },
    blue: {
      bg: "bg-blue-500 bg-opacity-10",
      text: "text-blue-500"
    },
    yellow: {
      bg: "bg-yellow-500 bg-opacity-10",
      text: "text-yellow-500"
    },
    purple: {
      bg: "bg-purple-500 bg-opacity-10",
      text: "text-purple-500"
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
            <h3 className="text-2xl font-semibold mt-1">{value}</h3>
          </div>
          <div className={`${colorClasses[color].bg} p-2 rounded-md`}>
            <div className={colorClasses[color].text}>{icon}</div>
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center text-sm">
            <span className={change.positive ? "text-success flex items-center" : "text-gray-500 dark:text-gray-400 flex items-center"}>
              {change.positive && <ArrowUpIcon className="mr-1 h-4 w-4" />}
              {change.value} {change.text || (change.positive ? "this week" : "")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
