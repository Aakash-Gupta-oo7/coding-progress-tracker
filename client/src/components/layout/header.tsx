import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SunIcon, MoonIcon, ChevronDownIcon, Code as CodeIcon, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

export default function Header({ toggleDarkMode, isDarkMode }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account",
        });
        setLocation("/auth");
      }
    });
  };

  return (
    <header className="bg-white dark:bg-dark-surface shadow-md fixed top-0 left-0 right-0 z-30 border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CodeIcon className="text-primary text-2xl" />
          <Link href={user ? "/dashboard" : "/"}>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              CodeTrack
            </span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme toggle button */}
          <Button variant="outline" size="icon" onClick={toggleDarkMode} className="rounded-full border-gray-200 dark:border-gray-700">
            {isDarkMode ? (
              <SunIcon className="h-5 w-5 text-yellow-400" />
            ) : (
              <MoonIcon className="h-5 w-5 text-primary" />
            )}
          </Button>
          
          {/* Show login buttons when not authenticated */}
          {!user && (
            <div className="flex items-center space-x-2">
              <Link href="/auth">
                <Button variant="outline" className="border-gray-200 hover:border-primary hover:text-primary">
                  Login
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
          
          {/* Show user menu when authenticated */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 border-gray-200 dark:border-gray-700">
                  <span className="font-medium">{user.username}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    Dashboard
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/lists")}>
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    My Lists
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/stats")}>
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18"></path>
                      <path d="M18 17l3 3 3-3"></path>
                      <path d="M15 10l-4 4-4-4"></path>
                      <path d="M9 17l-3 3-3-3"></path>
                    </svg>
                    Visualizations
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <span className="flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
