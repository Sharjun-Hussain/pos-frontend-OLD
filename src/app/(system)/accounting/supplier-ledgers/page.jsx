'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowUpRight, ArrowDownLeft, Search, RotateCcw, Truck, FileText, Plus } from "lucide-react";
import { format } from 'date-fns';

export default function SupplierLedgersPage() {
    const { data: session } = useSession();
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [totalSettled, setTotalSettled] = useState(0);
    const [totalPurchased, setTotalPurchased] = useState(0);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [chequeDetails, setChequeDetails] = useState({
        bank_name: "",
        cheque_number: "",
        cheque_date: format(new Date(), "yyyy-MM-dd"),
        payee_payor_name: "",
    });

    useEffect(() => {
        if (session) {
            fetchSuppliers();
        }
    }, [session]);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
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

            // Calculate totals
            let settled = 0;
            let purchased = 0;
            response.data.data.ledger.forEach(item => {
                if (item.type === 'debit') settled += parseFloat(item.amount);
                else if (item.type === 'credit') purchased += parseFloat(item.amount);
            });
            setTotalSettled(settled);
            setTotalPurchased(purchased);
        } catch (error) {
            console.error('Error fetching ledger:', error);
            toast.error('Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get("amount"));
        
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const payload = {
            amount,
            payment_method: paymentMethod,
            description: formData.get("description"),
            transaction_date: new Date().toISOString(),
            cheque_details: paymentMethod === "cheque" ? chequeDetails : null,
        };

        try {
            setPaymentLoading(true);
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${selectedSupplier}/payments`,
                payload,
                { headers: { Authorization: `Bearer ${session.accessToken}` } }
            );
            if (response.data.status === "success" || response.status === 201) {
                toast.success("Payment recorded successfully");
                setPaymentOpen(false);
                fetchLedger(selectedSupplier);
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error(error.response?.data?.message || "Failed to record payment");
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-lg border border-blue-500/20">
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
                    <div className="w-full md:w-64 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Search Supplier</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="NAME OR PHONE..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 bg-white border-slate-200 rounded-xl font-bold text-xs uppercase tracking-tight shadow-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Supplier</label>
                        <Select 
                            value={selectedSupplier} 
                            onValueChange={(v) => {
                                setSelectedSupplier(v);
                                fetchLedger(v);
                            }}
                        >
                            <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl font-bold text-xs uppercase tracking-tight shadow-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                                <SelectValue placeholder="CHOOSE A SUPPLIER..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {suppliers
                                    .filter(s => 
                                        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        s.phone?.includes(searchTerm)
                                    )
                                    .map(s => (
                                        <SelectItem key={s.id} value={String(s.id)} className="text-xs font-bold uppercase tracking-wider">{s.name}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>
                    <Button 
                        variant="outline" 
                        className="h-11 rounded-xl px-6 border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all"
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
                        <CardHeader className="bg-gradient-to-br from-blue-700 to-blue-900 text-white border-b-0 pb-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">System Verified Statement</span>
                                    </div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight leading-none">Supplier Statement</CardTitle>
                                    <CardDescription className="text-blue-100/70 font-medium">
                                        Accounts Payable for <span className="text-white font-black">{suppliers.find(s => String(s.id) === selectedSupplier)?.name}</span>
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" className="h-9 bg-white/10 border-white/20 text-white hover:bg-white hover:text-blue-600 transition-all hover:border-white text-[10px] font-black uppercase tracking-widest">
                                    <FileText className="h-3.5 w-3.5 mr-2" />
                                    Export Journal
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 -mt-6 mx-4 mb-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-2xl overflow-hidden relative z-20">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100 italic-none">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-slate-400">Date Segment</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-slate-400">Reference Type</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-right text-slate-400">Debit (Paid)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-right text-slate-400">Credit (Purchased)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6 text-right text-slate-400">Total Balance</TableHead>
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
                                                <TableCell className="py-4 px-6 text-right font-mono text-sm font-black text-blue-600">
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
                        <Card className="border-none shadow-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
                            <CardContent className="p-8 space-y-8 relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Liquidity Position</p>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Payable</p>
                                    <h2 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                        LKR {parseFloat(balance).toFixed(2)}
                                    </h2>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-white/70">
                                            <ArrowDownLeft className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Total Settled</span>
                                        </div>
                                        <p className="text-lg font-black tracking-tight">LKR {parseFloat(totalSettled).toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-white/70">
                                            <ArrowUpRight className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Total Purchased</span>
                                        </div>
                                        <p className="text-lg font-black tracking-tight">LKR {parseFloat(totalPurchased).toFixed(2)}</p>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => setPaymentOpen(true)}
                                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] border-none mt-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Settle Dues
                                </Button>
                            </CardContent>
                        </Card>

                        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                            <DialogContent className="sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-amber-600">Supplier Payment</DialogTitle>
                                    <DialogDescription className="font-medium text-slate-500">
                                        Record a payment made to {suppliers.find(s => String(s.id) === selectedSupplier)?.name}.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handlePaymentSubmit} className="space-y-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="amount" className="text-right text-xs font-black uppercase tracking-widest text-slate-400">Amount</Label>
                                        <Input 
                                            id="amount" 
                                            name="amount" 
                                            type="number" 
                                            step="0.01" 
                                            defaultValue={Math.abs(balance)} 
                                            className="col-span-3 h-11 rounded-xl font-bold" 
                                            required 
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="payment_method" className="text-right text-xs font-black uppercase tracking-widest text-slate-400">Method</Label>
                                        <Select name="payment_method" value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger className="col-span-3 h-11 rounded-xl font-bold">
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                                <SelectItem value="cheque">Cheque</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {paymentMethod === "cheque" && (
                                        <div className="grid gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 mt-1">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right text-[10px] uppercase font-black text-amber-600 tracking-widest">Bank</Label>
                                                <Input 
                                                    value={chequeDetails.bank_name} 
                                                    onChange={(e) => setChequeDetails({...chequeDetails, bank_name: e.target.value})}
                                                    placeholder="Bank Name" 
                                                    className="col-span-3 h-10 text-xs bg-white rounded-xl font-bold border-amber-200" 
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right text-[10px] uppercase font-black text-amber-600 tracking-widest">Cheque #</Label>
                                                <Input 
                                                    value={chequeDetails.cheque_number} 
                                                    onChange={(e) => setChequeDetails({...chequeDetails, cheque_number: e.target.value})}
                                                    placeholder="Cheque Number" 
                                                    className="col-span-3 h-10 text-xs bg-white rounded-xl font-bold border-amber-200" 
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label className="text-right text-[10px] uppercase font-black text-amber-600 tracking-widest">Date</Label>
                                                <Input 
                                                    type="date"
                                                    value={chequeDetails.cheque_date} 
                                                    onChange={(e) => setChequeDetails({...chequeDetails, cheque_date: e.target.value})}
                                                    className="col-span-3 h-10 text-xs bg-white rounded-xl font-bold border-amber-200" 
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="description" className="text-right text-xs font-black uppercase tracking-widest text-slate-400">Note</Label>
                                        <Input id="description" name="description" placeholder="Payment description..." className="col-span-3 h-11 rounded-xl font-bold" />
                                    </div>
                                    <DialogFooter className="mt-6">
                                        <Button type="button" variant="ghost" onClick={() => setPaymentOpen(false)} className="rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</Button>
                                        <Button type="submit" disabled={paymentLoading} className="bg-amber-600 text-white hover:bg-amber-700 rounded-xl px-8 h-11 font-black text-[10px] uppercase tracking-widest">
                                            {paymentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirm Payment
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

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
                                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 border-none shadow-lg shadow-blue-600/20 font-black text-[10px] uppercase tracking-widest rounded-xl h-11 mt-2 transition-all">
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
