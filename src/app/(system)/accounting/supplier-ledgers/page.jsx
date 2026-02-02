'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, RotateCcw, Truck, ArrowUpRight, ArrowDownLeft, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function SupplierLedgersPage() {
    const { data: session } = useSession();
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        if (session) {
            fetchSuppliers();
        }
    }, [session]);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active-list`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setSuppliers(response.data.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchLedger = async (supplierId) => {
        if (!supplierId) return;
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplierId}/ledger`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setLedger(response.data.data.ledger);
            setBalance(response.data.data.current_balance);
        } catch (error) {
            console.error('Error fetching ledger:', error);
            toast.error('Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded-xl shadow-sm border border-amber-100">
                            <Truck className="h-6 w-6" />
                        </div>
                        Supplier Ledger
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Track accounts payable and transaction history for your suppliers
                    </p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-slate-50/30">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Supplier</label>
                        <Select 
                            value={selectedSupplier} 
                            onValueChange={(v) => {
                                setSelectedSupplier(v);
                                fetchLedger(v);
                            }}
                        >
                            <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl font-bold text-xs uppercase tracking-tight shadow-sm">
                                <SelectValue placeholder="CHOOSE A SUPPLIER..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {suppliers.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs font-bold uppercase tracking-wider">{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button 
                        variant="outline" 
                        className="h-11 rounded-xl px-6 border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm"
                        onClick={() => fetchLedger(selectedSupplier)}
                        disabled={!selectedSupplier || loading}
                    >
                        <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        Fetch Statement
                    </Button>
                </CardContent>
            </Card>

            {selectedSupplier && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="col-span-2 border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
                        <CardHeader className="bg-slate-900 text-white border-b-0 pb-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">Supplier Statement</CardTitle>
                                    <CardDescription className="text-slate-400 font-medium">
                                        Accounts Payable for <span className="text-amber-400 font-bold">{suppliers.find(s => s.id === selectedSupplier)?.name}</span>
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" className="h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 text-[10px] font-black uppercase tracking-widest">
                                    <FileText className="h-3.5 w-3.5 mr-2" />
                                    Print PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 -mt-4 mx-4 mb-4 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="hover:bg-transparent border-slate-100 italic-none">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6">Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6">Reference</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6 text-right">Debit (Paid)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6 text-right">Credit (Purchased)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6 text-right">Running Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20">
                                                <RotateCcw className="h-8 w-8 animate-spin mx-auto text-slate-200 mb-4" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading ledger data...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : ledger.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No history found for this supplier</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ledger.map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                <TableCell className="py-4 px-6 font-bold text-[11px] text-slate-500">
                                                    {format(new Date(row.transaction_date), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black uppercase text-slate-900 tracking-tight">{row.reference_type}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{row.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right font-mono text-sm font-bold text-emerald-600">
                                                    {row.type === 'debit' ? `LKR ${parseFloat(row.amount).toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right font-mono text-sm font-bold text-red-600">
                                                    {row.type === 'credit' ? `LKR ${parseFloat(row.amount).toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right font-mono text-sm font-black text-slate-900">
                                                    LKR {parseFloat(row.balance).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-amber-600 text-white rounded-2xl overflow-hidden">
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Total Payable</p>
                                    <h2 className="text-4xl font-black tracking-tighter">
                                        LKR {parseFloat(balance).toFixed(2)}
                                    </h2>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-white/70">
                                            <ArrowDownLeft className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Total Settled</span>
                                        </div>
                                        <p className="text-lg font-black tracking-tight">LKR {'0.00'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-white/70">
                                            <ArrowUpRight className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Late Charges</span>
                                        </div>
                                        <p className="text-lg font-black tracking-tight">LKR {'0.00'}</p>
                                    </div>
                                </div>

                                <Button className="w-full h-12 bg-white text-amber-700 hover:bg-slate-100 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg border-none mt-4">
                                    Settle Dues
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                                    Statement Period
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">From Date</label>
                                    <Input type="date" className="h-10 rounded-xl font-bold text-xs" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">To Date</label>
                                    <Input type="date" className="h-10 rounded-xl font-bold text-xs" />
                                </div>
                                <Button className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 shadow-none font-black text-[10px] uppercase tracking-widest rounded-xl h-10 mt-2">
                                    Update Statement
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
