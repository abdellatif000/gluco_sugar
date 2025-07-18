
"use client";

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { calculateBMI } from '@/lib/utils';
import type { MealType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { TrendingDown, TrendingUp, ArrowRight, Scale, Droplet, PlusCircle, Activity, BarChart, User, BookText } from 'lucide-react';
import Link from 'next/link';

const glucoseLogSchema = z.object({
  glycemia: z.coerce.number().min(0.1, 'Glycemia is required.'),
  dosage: z.coerce.number().min(0, 'Dosage must be 0 or more.'),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Fasting']),
  weight: z.coerce.number().positive("Weight must be a positive number.").optional().or(z.literal('')),
});

export default function DashboardPage() {
  const { profile, weightHistory, glucoseLogs, addGlucoseLog, addWeightEntry, user } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof glucoseLogSchema>>({
    resolver: zodResolver(glucoseLogSchema),
    defaultValues: {
      glycemia: 1.0,
      dosage: 0,
      mealType: 'Fasting',
      weight: '',
    },
  });
  
  const latestLog = glucoseLogs[0];
  const previousLog = glucoseLogs[1];

  const trend = useMemo(() => {
    if (!latestLog || !previousLog) return { icon: Activity, color: 'text-muted-foreground', text: 'Stable' };
    if (latestLog.glycemia > previousLog.glycemia) return { icon: TrendingUp, color: 'text-red-500', text: 'Trending Up' };
    if (latestLog.glycemia < previousLog.glycemia) return { icon: TrendingDown, color: 'text-green-500', text: 'Trending Down' };
    return { icon: ArrowRight, color: 'text-muted-foreground', text: 'Stable' };
  }, [latestLog, previousLog]);
  
  const TrendIcon = trend.icon;

  const latestWeight = weightHistory[0]?.weight;
  const bmi = useMemo(() => {
    if (!profile || !latestWeight || !profile.height) return null;
    return calculateBMI(profile.height, latestWeight)
  }, [profile, latestWeight]);

  async function onSubmit(values: z.infer<typeof glucoseLogSchema>) {
    try {
        await addGlucoseLog({
          glycemia: values.glycemia,
          dosage: values.dosage,
          mealType: values.mealType as MealType,
        });

        if (values.weight && typeof values.weight === 'number' && values.weight > 0) {
            await addWeightEntry(values.weight);
        }
        
        toast({
          title: 'Success!',
          description: 'New health data has been added.',
        });

        form.reset({
          glycemia: 1.0,
          dosage: 0,
          mealType: 'Fasting',
          weight: ''
        });
    } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to add log. ' + error.message,
          variant: 'destructive',
        });
    }
  }
  
  if (!profile) return null; // Or a loading skeleton

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.displayName?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Here's a summary of your health today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Glucose</CardTitle>
              <Droplet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {latestLog ? (
                <>
                  <div className="text-2xl font-bold">{latestLog.glycemia.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">g/L</span></div>
                  <div className="flex items-center text-xs text-muted-foreground">
                     <TrendIcon className={`mr-1 h-4 w-4 ${trend.color}`} />
                     {trend.text}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No logs yet.</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BMI</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {bmi ? (
                  <>
                      <div className="text-2xl font-bold">{bmi}</div>
                      <p className="text-xs text-muted-foreground">From {latestWeight}kg and {profile.height}cm</p>
                  </>
              ) : (
                <p className="text-sm text-muted-foreground">Enter weight & height in profile.</p>
              )}
            </CardContent>
          </Card>
           <Card className="lg:col-span-1 bg-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
               <Button asChild variant="ghost" className="justify-start">
                <Link href="/logs"><BookText className="mr-2 h-4 w-4"/> View All Logs</Link>
               </Button>
               <Button asChild variant="ghost" className="justify-start">
                 <Link href="/reports"><BarChart className="mr-2 h-4 w-4"/> See Reports</Link>
               </Button>
                <Button asChild variant="ghost" className="justify-start">
                 <Link href="/profile"><User className="mr-2 h-4 w-4"/> Update Profile</Link>
               </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-glass">
          <CardHeader>
            <div className="flex items-center gap-2">
                <PlusCircle className="h-6 w-6 text-primary"/>
                <CardTitle>Add Health Log</CardTitle>
            </div>
            <CardDescription>
              Quickly add a new reading for today. Weight is optional.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="glycemia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Glycemia (g/L)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Novorapide Dosage</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mealType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a meal type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Breakfast">Breakfast</SelectItem>
                            <SelectItem value="Lunch">Lunch</SelectItem>
                            <SelectItem value="Dinner">Dinner</SelectItem>
                            <SelectItem value="Snack">Snack</SelectItem>
                            <SelectItem value="Fasting">Fasting</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Log</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </AppLayout>
  );
}
