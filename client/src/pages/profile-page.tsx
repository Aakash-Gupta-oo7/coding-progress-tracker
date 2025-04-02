import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { UserIcon, CalendarIcon, History } from "lucide-react";
import PlatformLinking from "@/components/profile/platform-linking";
import { SearchHistoryModal } from "@/components/profile/search-history-modal";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      document.documentElement.classList.toggle('dark');
      return newValue;
    });
  };

  // Format the creation date
  const formattedCreationDate = user?.createdAt 
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) 
    : "";

  return (
    <div>
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar />

      <main className="ml-0 md:ml-64 pt-16 min-h-screen">
        <div className="px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">My Profile</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your profile and platform connections</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4 bg-primary text-white">
                  <AvatarFallback>
                    <UserIcon className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{user?.username}</h3>
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Member since {formattedCreationDate}</span>
                </div>
                
                <div className="w-full mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Linked Accounts</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>LeetCode</span>
                        <span className={user?.leetcodeUsername ? "text-green-500" : "text-gray-400"}>
                          {user?.leetcodeUsername || "Not linked"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>CodeForces</span>
                        <span className={user?.codeforcesUsername ? "text-green-500" : "text-gray-400"}>
                          {user?.codeforcesUsername || "Not linked"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>GeeksForGeeks</span>
                        <span className={user?.gfgUsername ? "text-green-500" : "text-gray-400"}>
                          {user?.gfgUsername || "Not linked"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <SearchHistoryModal>
                    <Button variant="outline" className="w-full">
                      <History className="mr-2 h-4 w-4" />
                      View Search History
                    </Button>
                  </SearchHistoryModal>
                </div>
              </CardContent>
            </Card>

            {/* Platform Profile Linking */}
            <div className="lg:col-span-2">
              <PlatformLinking />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
