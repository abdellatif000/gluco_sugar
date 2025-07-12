
"use client";

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

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
import { TrendingDown, TrendingUp, ArrowRight, Scale, Droplet } from 'lucide-react';

const glucoseLogSchema = z.object({
  glycemia: z.coerce.number().min(0.1, 'Glycemia is required.'),
  dosage: z.coerce.number().min(0, 'Dosage must be 0 or more.'),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Fasting']),
});

export default function DashboardPage() {
  const { profile, weightHistory, glucoseLogs, addGlucoseLog } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof glucoseLogSchema>>({
    resolver: zodResolver(glucoseLogSchema),
    defaultValues: {
      glycemia: 1.0,
      dosage: 0,
      mealType: 'Fasting',
    },
  });

  const latestLog = glucoseLogs[0];
  const previousLog = glucoseLogs[1];

  const trend = useMemo(() => {
    if (!latestLog || !previousLog) return { icon: ArrowRight, color: '' };
    if (latestLog.glycemia > previousLog.glycemia) return { icon: TrendingUp, color: 'text-destructive' };
    if (latestLog.glycemia < previousLog.glycemia) return { icon: TrendingDown, color: 'text-green-500' };
    return { icon: ArrowRight, color: '' };
  }, [latestLog, previousLog]);
  
  const TrendIcon = trend.icon;

  const latestWeight = weightHistory[0]?.weight;
  const bmi = useMemo(() => {
    if (!profile) return null;
    return calculateBMI(profile.height, latestWeight)
  }, [profile, latestWeight]);

  function onSubmit(values: z.infer<typeof glucoseLogSchema>) {
    addGlucoseLog({
      ...values,
      mealType: values.mealType as MealType,
    });
    toast({
      title: 'Success!',
      description: 'New glucose log has been added.',
    });
    form.reset();
  }

  return (
    <AppLayout>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Latest Glucose
            </CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestLog ? (
              <>
                <div className="text-2xl font-bold flex items-center">
                  {latestLog.glycemia} g/L
                  <TrendIcon className={`ml-2 h-5 w-5 ${trend.color}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(latestLog.timestamp), 'PPP p')}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No logs yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BMI</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bmi ? (
                <>
                    <div className="text-2xl font-bold">{bmi}</div>
                    <p className="text-xs text-muted-foreground">Based on weight of {latestWeight}kg</p>
                </>
            ) : (
              <p className="text-sm text-muted-foreground">Enter weight and height in profile.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Add Glucose Log</CardTitle>
            <CardDescription>
              Quickly add a new blood glucose reading.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
