
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/context/app-context';
import type { GlucoseLog, MealType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";


const glucoseLogSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().optional(),
  glycemia: z.coerce.number().min(0.1, 'Glycemia is required.'),
  dosage: z.coerce.number().min(0, 'Dosage must be 0 or more.'),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Fasting']),
});

type FormData = z.infer<typeof glucoseLogSchema>;

export default function LogsPage() {
  const { glucoseLogs, addGlucoseLog, updateGlucoseLog, deleteGlucoseLog, deleteMultipleGlucoseLogs } = useApp();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<GlucoseLog | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(glucoseLogSchema),
  });

  const handleAddNew = () => {
    setEditingLog(null);
    form.reset({
      glycemia: 1.0,
      dosage: 0,
      mealType: 'Fasting',
      timestamp: new Date().toISOString(),
    });
    setIsSheetOpen(true);
  };
  
  const handleEdit = (log: GlucoseLog) => {
    setEditingLog(log);
    form.reset({
      ...log,
      timestamp: new Date(log.timestamp).toISOString(),
    });
    setIsSheetOpen(true);
  };
  
  const handleDelete = (id: string) => {
    setDeletingLogId(id);
  };
  
  const confirmDelete = () => {
    if (deletingLogId) {
      deleteGlucoseLog(deletingLogId);
      toast({ title: 'Success', description: 'Log entry deleted.' });
      setDeletingLogId(null);
    }
  };

  const onSubmit = (data: FormData) => {
    const logData = {
      ...data,
      mealType: data.mealType as MealType,
      timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
    };

    if (editingLog) {
      updateGlucoseLog({ ...editingLog, ...logData });
      toast({ title: 'Success', description: 'Log entry updated.' });
    } else {
      addGlucoseLog(logData);
      toast({ title: 'Success', description: 'New log entry added.' });
    }
    setIsSheetOpen(false);
    setEditingLog(null);
  };
  
  const handleSelectLog = (id: string, checked: boolean | string) => {
    if (checked) {
      setSelectedLogIds(prev => [...prev, id]);
    } else {
      setSelectedLogIds(prev => prev.filter(logId => logId !== id));
    }
  };

  const handleSelectAllLogs = (checked: boolean | string) => {
    if (checked) {
      setSelectedLogIds(glucoseLogs.map(log => log.id));
    } else {
      setSelectedLogIds([]);
    }
  };

  const handleDeleteSelected = () => {
    deleteMultipleGlucoseLogs(selectedLogIds);
    toast({
      title: 'Success',
      description: `${selectedLogIds.length} log(s) deleted.`,
    });
    setSelectedLogIds([]);
  };

  return (
    <AppLayout>
      <Card className="bg-glass">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Glucose Logs</CardTitle>
                <CardDescription>View, manage, and add your glucose readings.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedLogIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete ({selectedLogIds.length})
                </Button>
              )}
              <Button size="sm" className="gap-1" onClick={handleAddNew}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Log
                  </span>
              </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedLogIds.length === glucoseLogs.length && glucoseLogs.length > 0}
                    onCheckedChange={handleSelectAllLogs}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Meal Type</TableHead>
                <TableHead>Glycemia (g/L)</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {glucoseLogs.length > 0 ? glucoseLogs.map(log => (
                <TableRow key={log.id} data-state={selectedLogIds.includes(log.id) && "selected"} className="data-[state=selected]:bg-muted">
                  <TableCell>
                    <Checkbox
                      checked={selectedLogIds.includes(log.id)}
                      onCheckedChange={(checked) => handleSelectLog(log.id, checked)}
                      aria-label={`Select log from ${format(new Date(log.timestamp), 'Pp')}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{format(new Date(log.timestamp), 'Pp')}</TableCell>
                  <TableCell>{log.mealType}</TableCell>
                  <TableCell>{log.glycemia.toFixed(2)}</TableCell>
                  <TableCell>{log.dosage}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEdit(log)} className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDelete(log.id)} className="flex items-center gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No logs found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-glass-popover">
          <SheetHeader>
            <SheetTitle>{editingLog ? 'Edit' : 'Add'} Glucose Log</SheetTitle>
            <SheetDescription>
              {editingLog ? 'Update the details of your glucose reading.' : 'Enter a new glucose reading.'}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        defaultValue={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="glycemia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glycemia (g/L)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                    <FormControl><Input type="number" step="1" {...field} /></FormControl>
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
              <SheetFooter className="pt-4">
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </SheetClose>
                <Button type="submit">Save changes</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingLogId} onOpenChange={(open) => !open && setDeletingLogId(null)}>
        <AlertDialogContent className="bg-glass-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the glucose log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingLogId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
