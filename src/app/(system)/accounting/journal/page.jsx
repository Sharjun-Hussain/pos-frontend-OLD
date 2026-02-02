'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, RotateCcw, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function ManualJournalPage() {
    const { data: session } = useSession();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [journalDate, setJournalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [description, setDescription] = useState('');
    const [entries, setEntries] = useState([
        { account_id: '', debit: '', credit: '', key: Date.now() },
        { account_id: '', debit: '', credit: '', key: Date.now() + 1 }
    ]);

    useEffect(() => {
        if (session) {
            fetchAccounts();
        }
    }, [session]);

    const fetchAccounts = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const addEntry = () => {
        setEntries([...entries, { account_id: '', debit: '', credit: '', key: Date.now() }]);
    };

    const removeEntry = (key) => {
        if (entries.length <= 2) {
            toast.error('At least two entries are required');
            return;
        }
        setEntries(entries.filter(e => e.key !== key));
    };

    const updateEntry = (key, field, value) => {
        setEntries(entries.map(e => {
            if (e.key === key) {
                const updated = { ...e, [field]: value };
                // If debit is entered, clear credit and vice versa
                if (field === 'debit' && value) updated.credit = '';
                if (field === 'credit' && value) updated.debit = '';
                return updated;
            }
            return e;
        }));
    };

    const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);

    const isBalanced = totalDebit.toFixed(2) === totalCredit.toFixed(2) && totalDebit > 0;

    const handleSubmit = async () => {
        if (!description) {
            toast.error('Description is required');
            return;
        }
        if (!isBalanced) {
            toast.error('Journal entry must balance');
            return;
        }

        // Validate all entries have an account
        const validEntries = entries.filter(e => (parseFloat(e.debit) > 0 || parseFloat(e.credit) > 0));
        if (validEntries.some(e => !e.account_id)) {
            toast.error('All entries must have an account selected');
            return;
        }

        try {
            setLoading(true);
            const backendEntries = validEntries.map(e => ({
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
            // Reset form
            setDescription('');
            setEntries([
                { account_id: '', debit: '', credit: '', key: Date.now() },
                { account_id: '', debit: '', credit: '', key: Date.now() + 1 }
            ]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record journal entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 bg-slate-900 text-white flex items-center justify-center rounded-xl shadow-lg">
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
                                <TableRow key={entry.key} className="hover:bg-slate-50/50 group border-slate-100">
                                    <TableCell className="py-4 px-8">
                                        <Select 
                                            value={entry.account_id} 
                                            onValueChange={(v) => updateEntry(entry.key, 'account_id', v)}
                                        >
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
                                                type="number"
                                                placeholder="0.00"
                                                className={cn(
                                                    "h-11 rounded-xl font-mono font-bold text-right pl-8 transition-all",
                                                    parseFloat(entry.debit) > 0 ? "bg-white border-slate-900 ring-1 ring-slate-900" : "bg-white border-slate-200 opacity-60 hover:opacity-100"
                                                )}
                                                value={entry.debit}
                                                onChange={(e) => updateEntry(entry.key, 'debit', e.target.value)}
                                            />
                                            {parseFloat(entry.debit) > 0 && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-900" />}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-8">
                                        <div className="relative">
                                            <Input 
                                                type="number"
                                                placeholder="0.00"
                                                className={cn(
                                                    "h-11 rounded-xl font-mono font-bold text-right pl-8 transition-all",
                                                    parseFloat(entry.credit) > 0 ? "bg-white border-emerald-500 ring-1 ring-emerald-500" : "bg-white border-slate-200 opacity-60 hover:opacity-100"
                                                )}
                                                value={entry.credit}
                                                onChange={(e) => updateEntry(entry.key, 'credit', e.target.value)}
                                            />
                                            {parseFloat(entry.credit) > 0 && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-8 text-right">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                            onClick={() => removeEntry(entry.key)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    
                    <div className="p-8 bg-slate-50 flex justify-center border-t border-slate-100">
                        <Button 
                            variant="outline" 
                            className="h-10 border-slate-200 bg-white rounded-xl px-8 font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm"
                            onClick={addEntry}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Line Item
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-900 text-white p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col justify-center gap-1">
                        <div className="flex items-center gap-2">
                             {isBalanced ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                             ) : (
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                             )}
                             <span className={cn(
                                "text-xs font-black uppercase tracking-widest",
                                isBalanced ? "text-emerald-400" : "text-amber-500"
                             )}>
                                {isBalanced ? "Journal Entry Balanced" : "Journal Out of Balance"}
                             </span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-medium italic">All debits must equal credits before saving</p>
                    </div>
                    <div className="flex items-center justify-end gap-12">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Debit</p>
                            <p className="font-mono text-xl font-black">LKR {totalDebit.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Credit</p>
                            <p className="font-mono text-xl font-black text-emerald-400">LKR {totalCredit.toFixed(2)}</p>
                        </div>
                        <Button 
                            className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl ml-4"
                            disabled={!isBalanced || loading}
                            onClick={handleSubmit}
                        >
                            {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Post Journal
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
