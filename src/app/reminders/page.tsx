
"use client";

import { useState, useTransition } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/context/app-context';
import { getSuggestedReminders } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Lightbulb, Bell, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Reminder = {
  time: string;
  message: string;
};

export default function RemindersPage() {
  const { glucoseLogs } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateReminders = () => {
    startTransition(async () => {
      try {
        const result = await getSuggestedReminders(glucoseLogs);
        if (result.length > 0 && result[0].time === "Error") {
             toast({
                variant: "destructive",
                title: "Error",
                description: result[0].message,
             });
             setReminders([]);
        } else {
            setReminders(result);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "An unexpected error occurred.",
          description: "Please try again.",
        });
      }
    });
  };

  return (
    <AppLayout>
      <Card className="bg-glass">
        <CardHeader>
          <CardTitle>Smart Reminders</CardTitle>
          <CardDescription>
            Get personalized reminders based on your glucose patterns, powered by AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-start">
            <Button onClick={handleGenerateReminders} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Smart Reminders'
              )}
            </Button>
          </div>

          {reminders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Suggested Reminders</h3>
              {reminders.map((reminder, index) => {
                let Icon = Bell;
                let variant: "default" | "destructive" | undefined = "default";
                
                if(reminder.time === "Info") {
                    Icon = Lightbulb;
                } else if (reminder.time === "Error") {
                    Icon = AlertTriangle;
                    variant = "destructive"
                }

                return (
                    <Alert key={index} variant={variant} className="bg-glass">
                        <Icon className="h-4 w-4" />
                        <AlertTitle>{reminder.time}</AlertTitle>
                        <AlertDescription>{reminder.message}</AlertDescription>
                    </Alert>
                )
              })}
            </div>
          )}

          {!isPending && reminders.length === 0 && (
            <Alert className="bg-glass">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Ready to get started?</AlertTitle>
              <AlertDescription>
                Click the "Generate Smart Reminders" button to analyze your glucose logs and receive personalized suggestions. The more logs you have, the better the suggestions will be.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
