import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  ClipboardCopy,
  List,
  BookOpen,
  FileText,
  User,
  LogOut,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Form schemas
const sharedListSchema = z.object({
  name: z.string().min(1, "List name is required"),
  description: z.string().optional(),
});

type SharedListFormValues = z.infer<typeof sharedListSchema>;

const privateTestSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  durationMinutes: z.number().min(5, "Duration must be at least 5 minutes"),
  difficulty: z.string().min(1, "Difficulty is required"),
  numQuestions: z.number().min(1, "Must have at least 1 question"),
});

type PrivateTestFormValues = z.infer<typeof privateTestSchema>;

const GroupDetailPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const [, navigate] = useLocation();
  const groupId = parseInt(params.groupId || "0");
  const [createListDialogOpen, setCreateListDialogOpen] = useState(false);
  const [createTestDialogOpen, setCreateTestDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch group details
  const { data: groupData, isLoading } = useQuery({
    queryKey: [`/api/groups/${groupId}`],
    enabled: !!user && !!groupId,
  });

  const isGroupAdmin = groupData?.members?.find(
    (member: any) => member.userId === user?.id && (member.role === "admin" || member.role === "owner")
  );

  // Create shared list mutation
  const createListMutation = useMutation({
    mutationFn: async (data: SharedListFormValues) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/shared-lists`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      setCreateListDialogOpen(false);
      toast({
        title: "Shared list created",
        description: "Your new shared question list has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create list",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create private test mutation
  const createTestMutation = useMutation({
    mutationFn: async (data: PrivateTestFormValues) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/tests`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      setCreateTestDialogOpen(false);
      toast({
        title: "Private test created",
        description: "Your new private test has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create test",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/groups/${groupId}/members/${user?.id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Left group",
        description: "You have successfully left the group.",
      });
      navigate("/groups");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to leave group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/groups/${groupId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Group deleted",
        description: "The group has been successfully deleted.",
      });
      navigate("/groups");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Shared list form
  const listForm = useForm<SharedListFormValues>({
    resolver: zodResolver(sharedListSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Private test form
  const testForm = useForm<PrivateTestFormValues>({
    resolver: zodResolver(privateTestSchema),
    defaultValues: {
      name: "",
      description: "",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow
      durationMinutes: 60,
      difficulty: "medium",
      numQuestions: 5,
    },
  });

  // Form submission handlers
  function onCreateListSubmit(data: SharedListFormValues) {
    createListMutation.mutate(data);
  }

  function onCreateTestSubmit(data: PrivateTestFormValues) {
    // Convert string to ISO date string
    createTestMutation.mutate(data);
  }

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    if (groupData?.group?.inviteCode) {
      navigator.clipboard.writeText(groupData.group.inviteCode);
      toast({
        title: "Invite code copied",
        description: "Invite code copied to clipboard.",
      });
    }
  };

  // Confirm leave group
  const confirmLeaveGroup = () => {
    const isOwner = groupData?.members?.find(
      (member: any) => member.userId === user?.id && member.role === "owner"
    );

    if (isOwner) {
      const otherOwners = groupData?.members?.filter(
        (member: any) => member.userId !== user?.id && member.role === "owner"
      );

      if (!otherOwners?.length) {
        toast({
          title: "Cannot leave group",
          description: "You are the only owner. Please delete the group or transfer ownership first.",
          variant: "destructive",
        });
        return;
      }
    }

    if (confirm("Are you sure you want to leave this group?")) {
      leaveGroupMutation.mutate();
    }
  };

  // Confirm delete group
  const confirmDeleteGroup = () => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteGroupMutation.mutate();
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">You need to be logged in</h1>
          <p className="mb-4">Please log in to view group details.</p>
          <Button asChild>
            <Link href="/auth">Login / Register</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!groupData?.group) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Group not found</h1>
          <p className="mb-4">
            The group you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link href="/groups">Back to Groups</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { group, members, sharedLists, privateTests } = groupData;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/groups">
              <Button variant="ghost" className="p-0 h-auto">
                <span className="text-sm text-muted-foreground">Groups</span>
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold">{group.name}</h1>
          </div>
          <p className="text-muted-foreground">
            {group.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={copyInviteCode}>
            <ClipboardCopy className="h-4 w-4 mr-2" />
            Copy Invite Code
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Group Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isGroupAdmin && (
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Group
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={confirmLeaveGroup}>
                <LogOut className="h-4 w-4 mr-2" />
                Leave Group
              </DropdownMenuItem>
              {isGroupAdmin && isGroupAdmin.role === "owner" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={confirmDeleteGroup}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="shared-lists">Shared Lists</TabsTrigger>
          <TabsTrigger value="tests">Private Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">
                  {members.filter((m: any) => m.role === "owner").length} owners,{" "}
                  {members.filter((m: any) => m.role === "admin").length} admins
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-0 h-auto" 
                  onClick={() => setActiveTab("members")}
                >
                  <span className="text-sm text-primary">View all members</span>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Shared Lists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{sharedLists.length}</p>
                <p className="text-sm text-muted-foreground">
                  Collaborative question lists
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-0 h-auto"
                  onClick={() => setActiveTab("shared-lists")}
                >
                  <span className="text-sm text-primary">View all lists</span>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Private Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{privateTests.length}</p>
                <p className="text-sm text-muted-foreground">
                  Upcoming and completed tests
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-0 h-auto"
                  onClick={() => setActiveTab("tests")}
                >
                  <span className="text-sm text-primary">View all tests</span>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Group Name</p>
                <p>{group.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p>{group.description || "No description provided."}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Invite Code</p>
                <div className="flex items-center">
                  <code className="bg-muted p-1 rounded">{group.inviteCode}</code>
                  <Button variant="ghost" size="icon" onClick={copyInviteCode}>
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Created</p>
                <p>{new Date(group.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? "member" : "members"} in this group
                </CardDescription>
              </div>
              {isGroupAdmin && (
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {isGroupAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{member.username?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          {member.username}
                          {member.userId === user.id && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`capitalize ${member.role === "owner" ? "text-primary" : ""}`}>
                          {member.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      {isGroupAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem disabled={member.userId === user.id}>
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                disabled={member.userId === user.id} 
                                className="text-destructive focus:text-destructive"
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared-lists">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Shared Question Lists</h2>
            <Dialog open={createListDialogOpen} onOpenChange={setCreateListDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Shared List</DialogTitle>
                  <DialogDescription>
                    Create a shared question list for your group members to collaborate on.
                  </DialogDescription>
                </DialogHeader>
                <Form {...listForm}>
                  <form onSubmit={listForm.handleSubmit(onCreateListSubmit)}>
                    <FormField
                      control={listForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>List Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter list name..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={listForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the purpose of this list..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional description for your list.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="mt-6">
                      <Button
                        type="submit"
                        disabled={createListMutation.isPending}
                      >
                        {createListMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create List
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {sharedLists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedLists.map((list: any) => (
                <Card key={list.id}>
                  <CardHeader>
                    <CardTitle>{list.name}</CardTitle>
                    <CardDescription>
                      {list.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <User className="h-4 w-4 mr-2" />
                      <span>Created by: {members.find((m: any) => m.userId === list.createdBy)?.username || "Unknown"}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Created {new Date(list.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/shared-lists/${list.id}`}>View List</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Shared Lists Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create a new shared question list for your group members to collaborate on.
              </p>
              <Button onClick={() => setCreateListDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create List
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Private Tests</h2>
            {isGroupAdmin && (
              <Dialog open={createTestDialogOpen} onOpenChange={setCreateTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Test
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Private Test</DialogTitle>
                    <DialogDescription>
                      Create a timed test for your group members to practice coding skills.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...testForm}>
                    <form onSubmit={testForm.handleSubmit(onCreateTestSubmit)}>
                      <FormField
                        control={testForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Test Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter test name..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={testForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the purpose of this test..."
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional description for your test.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={testForm.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={testForm.control}
                          name="durationMinutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration (minutes)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={5}
                                  step={5}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={testForm.control}
                          name="difficulty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Difficulty</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full px-3 py-2 border rounded-md"
                                  {...field}
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                  <option value="mixed">Mixed</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={testForm.control}
                          name="numQuestions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Questions</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter className="mt-6">
                        <Button
                          type="submit"
                          disabled={createTestMutation.isPending}
                        >
                          {createTestMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Test
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {privateTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {privateTests.map((test: any) => {
                const startDate = new Date(test.startTime);
                const isUpcoming = startDate > new Date();
                const statusBadge = () => {
                  switch (test.status) {
                    case "scheduled":
                      return (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Scheduled
                        </span>
                      );
                    case "active":
                      return (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Active
                        </span>
                      );
                    case "completed":
                      return (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Completed
                        </span>
                      );
                    default:
                      return null;
                  }
                };

                return (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{test.name}</CardTitle>
                        {statusBadge()}
                      </div>
                      <CardDescription>
                        {test.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Time:</span>
                          <span>
                            {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{test.durationMinutes} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Questions:</span>
                          <span>{test.numQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span className="capitalize">{test.difficulty}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={`/tests/${test.id}`}>
                          {isUpcoming ? "View Details" : "View Test"}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Private Tests Yet</h3>
              <p className="text-muted-foreground mb-6">
                {isGroupAdmin
                  ? "Create a new private test for your group members to practice."
                  : "No private tests have been created for this group yet."}
              </p>
              {isGroupAdmin && (
                <Button onClick={() => setCreateTestDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupDetailPage;