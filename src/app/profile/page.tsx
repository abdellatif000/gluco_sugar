
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/context/app-context';
import { calculateBMI, calculateAge } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, User, Scale, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { WeightEntry } from '@/lib/types';
import { Checkbox } from "@/components/ui/checkbox";


const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  height: z.coerce.number().min(1, "Height must be positive."),
  birthdate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format.",
  }),
});

const weightSchema = z.object({
  weight: z.coerce.number().min(1, "Weight must be positive."),
});

const editWeightSchema = z.object({
  id: z.string(),
  date: z.string(),
  weight: z.coerce.number().min(1, "Weight must be positive."),
});

export default function ProfilePage() {
  const { profile, weightHistory, updateProfile, addWeightEntry, updateWeightEntry, deleteWeightEntry, deleteMultipleWeightEntries } = useApp();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);
  const [deletingWeightId, setDeletingWeightId] = useState<string | null>(null);
  const [selectedWeightIds, setSelectedWeightIds] = useState<string[]>([]);

  const latestWeight = weightHistory[0]?.weight;
  const bmi = profile ? calculateBMI(profile.height, latestWeight) : null;
  const age = profile ? calculateAge(profile.birthdate) : null;

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', height: 0, birthdate: '' }
  });

  const weightForm = useForm<z.infer<typeof weightSchema>>({
    resolver: zodResolver(weightSchema),
    defaultValues: { weight: 0 }
  });
  
  const editWeightForm = useForm<z.infer<typeof editWeightSchema>>({
    resolver: zodResolver(editWeightSchema),
    defaultValues: { id: '', date: '', weight: 0 },
  });

  const resetProfileForm = () => {
    if (profile) {
      profileForm.reset({
        name: profile.name,
        height: profile.height,
        birthdate: profile.birthdate ? format(new Date(profile.birthdate), 'yyyy-MM-dd') : '',
      });
    }
  };

  useEffect(() => {
    if (profile) {
      resetProfileForm();
    }
    if(latestWeight) {
        weightForm.reset({ weight: latestWeight || 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, latestWeight]);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsSaving(true);
    try {
      await updateProfile(data);
      toast({ title: 'Success', description: 'Profile updated.' });
      setIsEditingProfile(false);
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const onWeightSubmit = (data: z.infer<typeof weightSchema>) => {
    addWeightEntry(data.weight);
    toast({ title: 'Success', description: 'New weight entry added.' });
    weightForm.reset({ weight: data.weight });
  };

  const handleEditWeight = (entry: WeightEntry) => {
    setEditingWeight(entry);
    editWeightForm.reset({
      id: entry.id,
      date: entry.date,
      weight: entry.weight
    });
  };

  const onEditWeightSubmit = (data: z.infer<typeof editWeightSchema>) => {
    updateWeightEntry(data);
    toast({ title: 'Success', description: 'Weight entry updated.' });
    setEditingWeight(null);
  };
  
  const confirmDeleteWeight = () => {
    if (deletingWeightId) {
      deleteWeightEntry(deletingWeightId);
      toast({ title: 'Success', description: 'Weight entry deleted.' });
      setDeletingWeightId(null);
    }
  };
  
  const handleSelectWeight = (id: string, checked: boolean | string) => {
    if (checked) {
        setSelectedWeightIds((prev) => [...prev, id]);
    } else {
        setSelectedWeightIds((prev) => prev.filter((weightId) => weightId !== id));
    }
  };

  const handleSelectAllWeights = (checked: boolean | string) => {
      if (checked) {
          setSelectedWeightIds(weightHistory.map((entry) => entry.id));
      } else {
          setSelectedWeightIds([]);
      }
  };

  const handleDeleteSelected = () => {
      deleteMultipleWeightEntries(selectedWeightIds);
      toast({
          title: 'Success',
          description: `${selectedWeightIds.length} weight(s) deleted.`,
      });
      setSelectedWeightIds([]);
  };

  if (!profile) return (
    <AppLayout>
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>Your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                    <Input {...field} readOnly={!isEditingProfile} className={!isEditingProfile ? 'border-none bg-transparent p-0 shadow-none h-auto' : ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="birthdate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Birthdate</FormLabel>
                                    <FormControl>
                                      {isEditingProfile ? (
                                        <Input type="date" {...field} />
                                      ) : (
                                        <p className="text-sm pt-2">{profile.birthdate ? `${format(new Date(profile.birthdate), 'PPP')} (${age} years old)` : 'Not set'}</p>
                                      )}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="height"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Height (cm)</FormLabel>
                                    <FormControl>
                                    <Input type="number" {...field} readOnly={!isEditingProfile} className={!isEditingProfile ? 'border-none bg-transparent p-0 shadow-none h-auto' : ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                {isEditingProfile ? (
                                    <>
                                        <Button variant="outline" onClick={() => { setIsEditingProfile(false); resetProfileForm(); }}>Cancel</Button>
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outline" onClick={() => setIsEditingProfile(true)}>Edit Profile</Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
                <CardDescription>Calculated based on your data.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="flex items-center gap-4">
                  <Scale className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">BMI:</span>
                  <span className="font-bold text-xl">{bmi || 'N/A'}</span>
                  {bmi && <span className="text-muted-foreground text-sm">(Based on {latestWeight}kg & {profile.height}cm)</span>}
                </div>
                {!bmi && <p className="text-sm text-muted-foreground pt-2">Enter your weight to calculate BMI.</p>}
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weight Management</CardTitle>
            <CardDescription>Track your weekly weight.</CardDescription>
          </CardHeader>
          <Form {...weightForm}>
            <form onSubmit={weightForm.handleSubmit(onWeightSubmit)}>
                <CardContent className="space-y-4">
                    <FormField
                        control={weightForm.control}
                        name="weight"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Weight Entry (kg)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                  <Checkbox
                                      checked={selectedWeightIds.length === weightHistory.length && weightHistory.length > 0}
                                      onCheckedChange={handleSelectAllWeights}
                                      aria-label="Select all"
                                  />
                                </TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Weight (kg)</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {weightHistory.map((entry) => (
                                <TableRow key={entry.id} data-state={selectedWeightIds.includes(entry.id) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedWeightIds.includes(entry.id)}
                                        onCheckedChange={(checked) => handleSelectWeight(entry.id, checked)}
                                        aria-label={`Select weight entry from ${format(new Date(entry.date), 'PPP')}`}
                                    />
                                </TableCell>
                                <TableCell>{format(new Date(entry.date), 'PPP')}</TableCell>
                                <TableCell className="text-right">{entry.weight.toFixed(1)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => handleEditWeight(entry)} className="flex items-center gap-2">
                                                <Pencil className="h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setDeletingWeightId(entry.id)} className="flex items-center gap-2 text-destructive">
                                                <Trash2 className="h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button type="submit">Add Weight</Button>
                    {selectedWeightIds.length > 0 && (
                        <Button variant="destructive" onClick={handleDeleteSelected}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete ({selectedWeightIds.length})
                        </Button>
                    )}
                </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <Dialog open={!!editingWeight} onOpenChange={(open) => !open && setEditingWeight(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Weight Entry</DialogTitle>
                <DialogDescription>Update the weight for {editingWeight ? format(new Date(editingWeight.date), 'PPP') : ''}.</DialogDescription>
            </DialogHeader>
            <Form {...editWeightForm}>
                <form onSubmit={editWeightForm.handleSubmit(onEditWeightSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={editWeightForm.control}
                        name="weight"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Weight (kg)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingWeightId} onOpenChange={(open) => !open && setDeletingWeightId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the weight entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingWeightId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWeight}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
