'use client';

// =================================================================================
// 1. Custom Hook for Logic: /hooks/useManualJournal.js
// =================================================================================
// Encapsulates all state, derived values, and functions for the journal page.
// =================================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

const createNewEntry = () => ({
    account_id: '',
    debit: '',
    credit: '',
    key: `entry_${Date.now()}_${Math.random()}`
});

const INITIAL_ENTRIES = [createNewEntry(), createNewEntry()];

export function useManualJournal() {
    const { data: session } = useSession();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState({ fetch: false, post: false });

    const [journalDate, setJournalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [description, setDescription] = useState('');
    const [entries, setEntries] = useState(INITIAL_ENTRIES);

    const fetchAccounts = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(prev => ({ ...prev, fetch: true }));
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to fetch accounts.');
        } finally {
            setLoading(prev => ({ ...prev, fetch: false }));
        }
    }, [session]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const totals = useMemo(() => {
        return entries.reduce((acc, e) => {
            acc.debit += (parseFloat(e.debit) || 0);
            acc.credit += (parseFloat(e.credit) || 0);
            return acc;
        }, { debit: 0, credit: 0 });
    }, [entries]);

    const isBalanced = useMemo(() => {
        return totals.debit > 0 && Math.abs(totals.debit - totals.credit) < 0.01;
    }, [totals]);

    const hasValidEntries = useMemo(() => {
        return entries.some(e => (parseFloat(e.debit) > 0 || parseFloat(e.credit) > 0) && e.account_id);
    }, [entries]);

    const canPost = useMemo(() => {
        const activeEntries = entries.filter(e => (parseFloat(e.debit) > 0 || parseFloat(e.credit) > 0));
        return isBalanced && description && hasValidEntries && activeEntries.every(e => e.account_id);
    }, [isBalanced, description, hasValidEntries, entries]);

    const addEntry = useCallback(() => {
        setEntries(prev => [...prev, createNewEntry()]);
    }, []);

    const removeEntry = useCallback((key) => {
        setEntries(prev => {
            if (prev.length <= 2) {
                toast.error('At least two entries are required');
                return prev;
            }
            return prev.filter(e => e.key !== key);
        });
    }, []);

    const updateEntry = useCallback((key, field, value) => {
        setEntries(prev => prev.map(e => {
            if (e.key === key) {
                const updated = { ...e, [field]: value };
                if (field === 'debit' && value) updated.credit = '';
                if (field === 'credit' && value) updated.debit = '';
                return updated;
            }
            return e;
        }));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!canPost) {
            if (!description) toast.error('Description is required');
            else if (!isBalanced) toast.error('Journal entry must balance');
            else toast.error('All line items require a selected account.');
            return;
        }

        setLoading(prev => ({ ...prev, post: true }));
        try {
            const backendEntries = entries
                .filter(e => (parseFloat(e.debit) > 0 || parseFloat(e.credit) > 0) && e.account_id)
                .map(e => ({
                    account_id: e.account_id,
                    amount: e.debit ? parseFloat(e.debit) : parseFloat(e.credit),
                    type: e.debit ? 'debit' : 'credit'
                }));

            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/journal`, {
                date: journalDate,
                description,
                entries: backendEntries
            }, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });

            toast.success('Journal entry recorded successfully');
            setDescription('');
            setEntries(INITIAL_ENTRIES);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record journal entry');
        } finally {
            setLoading(prev => ({ ...prev, post: false }));
        }
    }, [canPost, entries, journalDate, description, session, isBalanced]);

    return {
        accounts, loading, journalDate, description, entries,
        setJournalDate, setDescription, totals, isBalanced, canPost,
        addEntry, removeEntry, updateEntry, handleSubmit,
    };
}


// =================================================================================
// 2. Memoized Child Component: /components/JournalEntryRow.jsx
// =================================================================================
// This component is wrapped in React.memo to prevent re-renders unless its
// specific props change, boosting performance significantly for lists.
// =================================================================================
import React, { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";


const JournalEntryRow = memo(function JournalEntryRow({ entry, accounts, onUpdate, onRemove, isRemoveDisabled }) {
    const handleUpdate = (field, value) => onUpdate(entry.key, field, value);
    const handleRemove = () => onRemove(entry.key);
    
    const isDebit = parseFloat(entry.debit) > 0;
    const isCredit = parseFloat(entry.credit) > 0;

    return (
        <TableRow className="hover:bg-slate-50/50 group border-slate-100">
            <TableCell className="py-4 px-8">
                <Select value={entry.account_id} onValueChange={(v) => handleUpdate('account_id', v)}>
                    <SelectTrigger className="h-11 border-slate-200 rounded-xl font-bold text-[11px] uppercase tracking-tight bg-white">
                        <SelectValue placeholder="SELECT AN ACCOUNT..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id} className="text-xs font-bold uppercase tracking-wider">
                                {a.code} - {a.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell className="py-4 px-8">
                <div className="relative">
                    <Input
                        type="number" placeholder="0.00"
                        className={cn("h-11 rounded-xl font-mono font-bold text-right pl-8 transition-all border-2", isDebit ? "bg-white border-indigo-600 ring-1 ring-indigo-600" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600")}
                        value={entry.debit} onChange={(e) => handleUpdate('debit', e.target.value)}
                    />
                    {isDebit && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                </div>
            </TableCell>
            <TableCell className="py-4 px-8">
                <div className="relative">
                    <Input
                        type="number" placeholder="0.00"
                        className={cn("h-11 rounded-xl font-mono font-bold text-right pl-8 transition-all border-2", isCredit ? "bg-white border-emerald-600 ring-1 ring-emerald-600" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-600")}
                        value={entry.credit} onChange={(e) => handleUpdate('credit', e.target.value)}
                    />
                    {isCredit && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </div>
            </TableCell>
            <TableCell className="py-4 px-8 text-right">
                <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={handleRemove} disabled={isRemoveDisabled}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
});


// =================================================================================
// 3. Main Page Component: /app/manual-journal/page.jsx
// =================================================================================
// This is now a clean, lean, presentational component. Its only job is to
// render the UI based on the state provided by the useManualJournal hook.
// =================================================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader } from '@/components/ui/table';
import { Plus, Save, RotateCcw, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ManualJournalPage() {
    const {
        accounts, loading, journalDate, description, entries,
        setJournalDate, setDescription, totals, isBalanced, canPost,
        addEntry, removeEntry, updateEntry, handleSubmit,
    } = useManualJournal();

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-lg">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        Manual Journal Entry
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Record multi-line financial adjustments and manual transactions
                    </p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Journal Date</label>
                            <Input
                                type="date"
                                className="h-12 bg-white border-slate-200 rounded-xl font-bold text-sm shadow-sm"
                                value={journalDate}
                                onChange={(e) => setJournalDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reference / Description</label>
                            <Input
                                placeholder="E.g. Monthly Rent Payment / Owner Investment..."
                                className="h-12 bg-white border-slate-200 rounded-xl font-bold text-sm shadow-sm uppercase placeholder:normal-case"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white">
                            <TableRow className="hover:bg-transparent border-slate-100 italic-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6 px-8">Account Selection</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6 px-8 text-right w-[200px]">Debit (LKR)</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6 px-8 text-right w-[200px]">Credit (LKR)</TableHead>
                                <TableHead className="text-right py-6 px-8 w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry) => (
                                <JournalEntryRow
                                    key={entry.key}
                                    entry={entry}
                                    accounts={accounts}
                                    onUpdate={updateEntry}
                                    onRemove={removeEntry}
                                    isRemoveDisabled={entries.length <= 2}
                                />
                            ))}
                        </TableBody>
                    </Table>

                    <div className="p-8 bg-slate-50 flex justify-center border-t border-slate-100">
                        <Button
                            variant="outline"
                            className="h-10 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 rounded-xl px-8 font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm transition-all"
                            onClick={addEntry}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Line Item
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="bg-slate-900 text-white p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 border-blue-600">
                    <div className="flex flex-col justify-center gap-1">
                        <div className="flex items-center gap-2">
                            {isBalanced ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
                            <span className={cn("text-xs font-black uppercase tracking-widest", isBalanced ? "text-emerald-400" : "text-amber-500")}>
                                {isBalanced ? "Journal Entry Balanced" : "Journal Out of Balance"}
                            </span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-medium italic">All debits must equal credits before saving</p>
                    </div>

                    <div className="flex items-center justify-end gap-12">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Debit</p>
                            <p className="font-mono text-xl font-black text-indigo-400">LKR {totals.debit.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Credit</p>
                            <p className="font-mono text-xl font-black text-emerald-400">LKR {totals.credit.toFixed(2)}</p>
                        </div>
                        <Button
                            className={cn("h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl ml-4 transition-all duration-300", canPost ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xl" : "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed shadow-none")}
                            disabled={!canPost || loading.post}
                            onClick={handleSubmit}
                        >
                            {loading.post ? <RotateCcw className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Post Journal</>}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
