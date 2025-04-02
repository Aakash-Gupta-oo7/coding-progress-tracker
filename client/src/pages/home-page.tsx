import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CodeIcon, BarChartIcon, ListChecksIcon, UserIcon } from "lucide-react";
import Header from "@/components/layout/header";
import { useState } from "react";

export default function HomePage() {
  // For simplicity, assume user is not logged in 
  // to avoid issues with auth provider initialization
  const user = null;
  
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-block">
            <CodeIcon className="h-16 w-16 text-primary mx-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Track Your Coding Progress Across Platforms
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Monitor your LeetCode, CodeForces, and GeeksForGeeks activity in one place. 
            Compare with others and organize your problem-solving journey.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-6">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button size="lg" className="px-6">
                    Get Started
                  </Button>
                </Link>
                <Link href="/compare">
                  <Button variant="outline" size="lg" className="px-6">
                    Try Comparison
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <BarChartIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect your accounts and automatically sync your solved problems, contest ratings, and more from multiple coding platforms.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Compare Profiles</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Compare your progress with friends or colleagues. See how you stack up in total problems, difficulty distribution, and topics covered.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
              <div className="h-12 w-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <ListChecksIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Custom Lists</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create and share custom problem lists. Track your progress as you solve problems and organize them by topics or difficulty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <CodeIcon className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-semibold">CodeTrack</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track, compare, and improve your coding skills across platforms
          </p>
        </div>
      </footer>
    </div>
  );
}
