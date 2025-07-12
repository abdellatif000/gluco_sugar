

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
import { Calendar, User, Scale, Loader2 } from 'lucide-react';


const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  height: z.coerce.number().min(1, "Height must be positive."),
});

const weightSchema = z.object({
  weight: z.coerce.number().min(1, "Weight must be positive."),
});

export default function ProfilePage() {
  const { profile, weightHistory, updateProfile, addWeightEntry } = useApp();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const latestWeight = weightHistory[0]?.weight;
  const bmi = profile ? calculateBMI(profile.height, latestWeight) : null;
  const age = profile ? calculateAge(profile.birthdate) : null;

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      height: 0,
    },
  });

  const weightForm = useForm<z.infer<typeof weightSchema>>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      weight: 0,
    },
  });
  
  useEffect(() => {
    if (profile) {
      profileForm.reset({
          name: profile.name,
          height: profile.height,
      });
    }
    if(latestWeight) {
        weightForm.reset({ weight: latestWeight });
    }
  }, [profile, latestWeight, profileForm, weightForm]);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsSaving(true);
    try {
      await updateProfile(data);
      toast({ title: 'Success', description: 'Profile updated.' });
      setIsEditing(false);
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
                                    <Input {...field} readOnly={!isEditing} className={!isEditing ? 'border-none bg-transparent p-0 shadow-none h-auto' : ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <div className="flex items-center gap-4">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium text-sm">Birthdate:</span>
                                <span className="text-sm">{profile.birthdate ? `${format(new Date(profile.birthdate), 'PPP')} (${age} years old)` : 'Not set'}</span>
                            </div>
                            <FormField
                                control={profileForm.control}
                                name="height"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Height (cm)</FormLabel>
                                    <FormControl>
                                    <Input type="number" {...field} readOnly={!isEditing} className={!isEditing ? 'border-none bg-transparent p-0 shadow-none h-auto' : ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={() => { setIsEditing(false); profileForm.reset({ name: profile.name, height: profile.height }); }}>Cancel</Button>
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
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
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Weight (kg)</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {weightHistory.map((entry) => (
                                <TableRow key={entry.id}>
                                <TableCell>{format(new Date(entry.date), 'PPP')}</TableCell>
                                <TableCell className="text-right">{entry.weight.toFixed(1)}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Add Weight</Button>
                </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </AppLayout>
  );
}
