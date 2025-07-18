
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
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  height: z.coerce.number().min(1, "Height must be positive.").nullable(),
  birthdate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format.",
  }).nullable(),
});

export default function ProfilePage() {
  const { profile, weightHistory, updateProfile } = useApp();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const latestWeight = weightHistory[0]?.weight;
  const bmi = (profile && profile.height && latestWeight) ? calculateBMI(profile.height, latestWeight) : null;
  const age = (profile && profile.birthdate) ? calculateAge(profile.birthdate) : null;

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', height: null, birthdate: null }
  });

  useEffect(() => {
    if (profile && !isEditingProfile) {
      profileForm.reset({
        name: profile.name,
        height: profile.height,
        birthdate: profile.birthdate ? format(new Date(profile.birthdate), 'yyyy-MM-dd') : null,
      });
    }
  }, [profile, isEditingProfile, profileForm]);

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
            <Card className="bg-glass">
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                        <CardHeader>
                            <CardTitle>User Details</CardTitle>
                            <CardDescription>Your personal information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {isEditingProfile ? (
                            <>
                              <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                            <Input type="date" {...field} value={field.value ?? ''}/>
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
                                            <Input type="number" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                               />
                            </>
                           ) : (
                             <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4">
                                    <FormLabel className="text-muted-foreground col-span-1">Name</FormLabel>
                                    <div className="md:col-span-2 text-sm py-2">{profile.name}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4">
                                    <FormLabel className="text-muted-foreground col-span-1">Birthdate</FormLabel>
                                    <div className="md:col-span-2 text-sm py-2">{profile.birthdate ? `${format(new Date(profile.birthdate), 'PPP')} (${age} years old)` : 'Not set'}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4">
                                    <FormLabel className="text-muted-foreground col-span-1">Height (cm)</FormLabel>
                                    <div className="md:col-span-2 text-sm py-2">{(profile.height && profile.height > 0) ? profile.height : 'Not set'}</div>
                                </div>
                             </div>
                           )}
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            {isEditingProfile ? (
                                <>
                                    <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Save
                                    </Button>
                                </>
                            ) : (
                                <Button type="button" variant="outline" onClick={() => setIsEditingProfile(true)}>Edit Profile</Button>
                            )}
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            <Card className="bg-glass">
                <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
                <CardDescription>Calculated based on your data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">BMI:</span>
                        <span className="font-bold text-xl">{bmi || 'N/A'}</span>
                    </div>
                    {bmi && profile.height && latestWeight && <p className="text-xs text-muted-foreground">(Based on {latestWeight}kg & {profile.height}cm)</p>}
                    {!bmi && <p className="text-sm text-muted-foreground pt-2">Enter your weight & height to calculate BMI.</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
