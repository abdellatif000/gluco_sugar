
"use client";

import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { glucoseLogs } = useApp();
  const [timeRange, setTimeRange] = useState('7'); // Default to 7 days
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredData = useMemo(() => {
    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    return glucoseLogs
      .filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [glucoseLogs, timeRange]);

  return (
    <AppLayout>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Glucose Trends</CardTitle>
            <CardDescription>
              Your glucose levels over time.
            </CardDescription>
          </div>
          <div className="mt-4 md:mt-0">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="14">Last 14 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {!isClient ? (
                <div className="flex items-center justify-center h-full">
                    <Skeleton className="w-full h-full" />
                </div>
            ) : filteredData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                        stroke="hsl(var(--foreground))"
                        />
                    <YAxis 
                        domain={['dataMin - 0.2', 'dataMax + 0.2']} 
                        stroke="hsl(var(--foreground))"
                    />
                    <Tooltip 
                        labelFormatter={(label) => format(new Date(label), 'PPP p')}
                        formatter={(value) => [`${value} g/L`, 'Glycemia']}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                        }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="glycemia" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 6 }}
                    />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available for the selected time range.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
