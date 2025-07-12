
"use client";

import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDown, ArrowUp, Gauge, Scale, TrendingDown, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, unit, icon: Icon, trend, trendText }: { title: string, value: string, unit?: string, icon: React.ElementType, trend?: 'up' | 'down' | 'stable', trendText?: string }) => {
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
    const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-muted-foreground';

    return (
        <Card className="bg-glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value} {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}</div>
                {trend && TrendIcon && trendText && (
                    <p className={`text-xs flex items-center ${trendColor}`}>
                        <TrendIcon className="mr-1 h-3 w-3" />
                        {trendText}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};


export default function ReportsPage() {
  const { glucoseLogs, weightHistory } = useApp();
  const [timeRange, setTimeRange] = useState('7'); // Default to 7 days
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { filteredGlucose, filteredWeight } = useMemo(() => {
    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    const fGlucose = glucoseLogs
      .filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(a.timestamp).getTime());

    const fWeight = weightHistory
        .filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { filteredGlucose: fGlucose, filteredWeight: fWeight };
  }, [glucoseLogs, weightHistory, timeRange]);

  const glucoseStats = useMemo(() => {
    if (filteredGlucose.length === 0) return { avg: 0, max: 0, min: 0 };
    const values = filteredGlucose.map(log => log.glycemia);
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
    }
  }, [filteredGlucose]);

  const weightStats = useMemo(() => {
    if (filteredWeight.length < 2) return { change: 0, trend: 'stable' };
    const firstWeight = filteredWeight[0].weight;
    const lastWeight = filteredWeight[filteredWeight.length - 1].weight;
    const change = lastWeight - firstWeight;
    return {
      change: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    }
  }, [filteredWeight]);
  
  const sortedGlucoseForChart = useMemo(() => [...filteredGlucose].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), [filteredGlucose]);


  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <Card className="bg-glass">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
                <CardTitle>Reports Dashboard</CardTitle>
                <CardDescription>
                Your health statistics for the selected period.
                </CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
                <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full md:w-[180px]">
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Avg. Glucose" value={glucoseStats.avg.toFixed(2)} unit="g/L" icon={Gauge} />
                    <StatCard title="Highest Glucose" value={glucoseStats.max.toFixed(2)} unit="g/L" icon={ArrowUp} />
                    <StatCard title="Lowest Glucose" value={glucoseStats.min.toFixed(2)} unit="g/L" icon={ArrowDown} />
                    <StatCard 
                        title="Weight Change" 
                        value={`${weightStats.change > 0 ? '+' : ''}${weightStats.change.toFixed(1)}`} 
                        unit="kg" 
                        icon={Scale} 
                        trend={weightStats.trend as "up" | "down" | "stable"}
                        trendText={weightStats.trend === 'up' ? 'Trending up' : weightStats.trend === 'down' ? 'Trending down' : 'Stable'}
                    />
                </div>
            </CardContent>
        </Card>

        <Card className="bg-glass">
            <CardHeader>
                <CardTitle>Glucose Trends</CardTitle>
                <CardDescription>
                Your glucose levels over time.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="h-[400px]">
                {!isClient ? (
                    <div className="flex items-center justify-center h-full">
                        <Skeleton className="w-full h-full" />
                    </div>
                ) : sortedGlucoseForChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sortedGlucoseForChart}>
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
                                background: 'hsla(var(--card) / 0.75)',
                                backdropFilter: 'blur(12px)',
                                borderColor: 'hsla(var(--border) / 0.2)'
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
                        <p className="text-muted-foreground">No glucose data available for the selected time range.</p>
                    </div>
                )}
            </div>
            </CardContent>
        </Card>
        
        <Card className="bg-glass">
            <CardHeader>
                <CardTitle>Weight Trends</CardTitle>
                <CardDescription>
                Your weight history over time.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="h-[400px]">
                {!isClient ? (
                    <div className="flex items-center justify-center h-full">
                        <Skeleton className="w-full h-full" />
                    </div>
                ) : filteredWeight.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredWeight}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => format(new Date(str), 'MMM d')}
                            stroke="hsl(var(--foreground))"
                            />
                        <YAxis 
                            domain={['dataMin - 2', 'dataMax + 2']} 
                            stroke="hsl(var(--foreground))"
                            />
                        <Tooltip 
                            labelFormatter={(label) => format(new Date(label), 'PPP')}
                            formatter={(value) => [`${value} kg`, 'Weight']}
                            contentStyle={{
                                background: 'hsla(var(--card) / 0.75)',
                                backdropFilter: 'blur(12px)',
                                borderColor: 'hsla(var(--border) / 0.2)'
                            }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ r: 4, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 6 }}
                        />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No weight data available for the selected time range.</p>
                    </div>
                )}
            </div>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
