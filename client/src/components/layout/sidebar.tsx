import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  BarChartHorizontal, 
  List, 
  User, 
  Code, 
  FileCode, 
  Terminal, 
  Menu, 
  X,
  Calendar
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const sidebarLinks = [
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboard className="mr-3 text-lg" /> 
    },
    { 
      href: "/compare", 
      label: "Compare Profiles", 
      icon: <BarChartHorizontal className="mr-3 text-lg" /> 
    },
    { 
      href: "/lists", 
      label: "Question Lists", 
      icon: <List className="mr-3 text-lg" /> 
    },
    { 
      href: "/calendar", 
      label: "Contest Calendar", 
      icon: <Calendar className="mr-3 text-lg" /> 
    },
    { 
      href: "/profile", 
      label: "My Profile", 
      icon: <User className="mr-3 text-lg" /> 
    }
  ];

  const renderSidebarContent = () => (
    <>
      <nav className="space-y-1 flex-1">
        {sidebarLinks.map((link) => (
          <Link href={link.href} key={link.href}>
            <a className={cn(
              "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
              location === link.href 
                ? "bg-primary bg-opacity-10 text-primary" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}>
              {link.icon}
              <span>{link.label}</span>
            </a>
          </Link>
        ))}
      </nav>
      
      {user && (
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Linked Profiles</h3>
            <div className="mt-2 space-y-2">
              {user.leetcodeUsername && (
                <a 
                  href={`https://leetcode.com/${user.leetcodeUsername}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Code className="h-4 w-4" />
                  <span>LeetCode</span>
                </a>
              )}
              {user.codeforcesUsername && (
                <a 
                  href={`https://codeforces.com/profile/${user.codeforcesUsername}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <FileCode className="h-4 w-4" />
                  <span>CodeForces</span>
                </a>
              )}
              {user.gfgUsername && (
                <a 
                  href={`https://www.geeksforgeeks.org/user/${user.gfgUsername}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Terminal className="h-4 w-4" />
                  <span>GeeksForGeeks</span>
                </a>
              )}
              {!user.leetcodeUsername && !user.codeforcesUsername && !user.gfgUsername && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No profiles linked yet. Visit your profile to add them.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "w-64 fixed inset-y-0 pt-16 hidden md:block bg-white dark:bg-dark-surface shadow-sm",
        className
      )}>
        <div className="px-4 py-6 h-full flex flex-col">
          {renderSidebarContent()}
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <Button 
        variant="default"
        size="icon"
        className="fixed bottom-4 right-4 z-20 md:hidden bg-primary text-white p-4 rounded-full shadow-lg"
        onClick={toggleMobileMenu}
      >
        <Menu />
      </Button>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-40 md:hidden">
          <div className="bg-white dark:bg-dark-surface h-full w-64 p-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-1">
                <Code className="text-primary text-xl" />
                <h1 className="text-lg font-semibold">CodeTrack</h1>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMobileMenu}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
}
