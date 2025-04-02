import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, FileCode, Terminal, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UpdateUser } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";

const profileFormSchema = z.object({
  leetcodeUsername: z.string().optional(),
  codeforcesUsername: z.string().optional(),
  gfgUsername: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function PlatformLinking() {
  const { user, updateProfileMutation } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      leetcodeUsername: user?.leetcodeUsername || "",
      codeforcesUsername: user?.codeforcesUsername || "",
      gfgUsername: user?.gfgUsername || "",
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values as UpdateUser);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Problem Solving Profiles</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="leetcodeUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Code className="mr-2 h-5 w-5 text-orange-500" />
                    LeetCode
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">https://leetcode.com/</span>
                      <Input {...field} placeholder="username" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codeforcesUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <FileCode className="mr-2 h-5 w-5 text-blue-500" />
                    CodeForces
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">https://codeforces.com/profile/</span>
                      <Input {...field} placeholder="username" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gfgUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Terminal className="mr-2 h-5 w-5 text-green-500" />
                    GeeksForGeeks
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">https://www.geeksforgeeks.org/user/</span>
                      <Input {...field} placeholder="username" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              className="w-full"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profiles"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
