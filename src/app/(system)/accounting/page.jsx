'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Search, Filter, RotateCcw, Landmark, Wallet, TrendingDown, TrendingUp, History, Pencil, ArrowLeftRight, X, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export default function ChartOfAccountsPage() {
    const { data: session } = useSession();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [ledgerData, setLedgerData] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [transferData, setTransferData] = useState({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
    });
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'asset',
        balance: 0
    });

    useEffect(() => {
        if (session) {
            fetchAccounts();
        }
    }, [session]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to fetch chart of accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, formData, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            toast.success('Account created successfully');
            setIsAddDialogOpen(false);
            fetchAccounts();
            setFormData({ name: '', code: '', type: 'asset', balance: 0 });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create account');
        }
    };

    const handleUpdateAccount = async () => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/${selectedAccount.id}`, formData, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            toast.success('Account updated successfully');
            setIsEditDialogOpen(false);
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update account');
        }
    };

    const fetchAccountLedger = async (account) => {
        try {
            setSelectedAccount(account);
            setIsLedgerDialogOpen(true);
            setLedgerLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/${account.id}/ledger`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setLedgerData(response.data.data.data);
        } catch (error) {
            console.error('Error fetching account ledger:', error);
            toast.error('Failed to fetch account ledger');
        } finally {
            setLedgerLoading(false);
        }
    };

    const handleTransfer = async () => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/transfer`, transferData, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            toast.success('Funds transferred successfully');
            setIsTransferDialogOpen(false);
            fetchAccounts();
            setTransferData({ from_account_id: '', to_account_id: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to transfer funds');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'asset': return <Wallet className="h-4 w-4 text-emerald-500" />;
            case 'liability': return <TrendingDown className="h-4 w-4 text-red-500" />;
            case 'equity': return <Landmark className="h-4 w-4 text-indigo-500" />;
            case 'revenue': return <TrendingUp className="h-4 w-4 text-blue-500" />;
            case 'expense': return <History className="h-4 w-4 text-amber-500" />;
            default: return <Plus className="h-4 w-4 text-slate-500" />;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Landmark className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground tracking-tight">Chart of Accounts</h1>
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
                            Manage your financial accounts and balances
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 rounded-xl px-4 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-sm"
                        onClick={fetchAccounts}
                        disabled={loading}
                    >
                        <RotateCcw className={cn("h-4 w-4 opacity-60", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 rounded-xl px-4 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-sm"
                        onClick={() => setIsTransferDialogOpen(true)}
                    >
                        <ArrowLeftRight className="h-4 w-4 opacity-60" />
                        Transfer
                    </Button>
                    <Button 
                        variant="default" 
                        size="sm" 
                        className="h-10 rounded-xl px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider gap-2 shadow-lg shadow-emerald-500/20"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Add Account
                    </Button>
                </div>
            </div>

            <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6 w-[100px]">Code</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6">Account Name</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6">Type</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6 text-right">Balance</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6">Status</TableHead>
                                <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <RotateCcw className="h-8 w-8 animate-spin mx-auto text-muted-foreground/30 mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Loading Chart of Accounts...</p>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <Landmark className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4 opacity-30" />
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">No accounts found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account) => (
                                    <TableRow key={account.id} className="group hover:bg-muted/30 transition-colors border-border/40">
                                        <TableCell className="py-4 px-6">
                                            <code className="text-[11px] font-black text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                                {account.code}
                                            </code>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <p className="text-sm font-medium text-foreground">{account.name}</p>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(account.type)}
                                                <span className="text-xs font-medium capitalize text-muted-foreground">
                                                    {account.type}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right font-mono font-bold text-foreground">
                                            LKR {parseFloat(account.balance).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <StatusBadge value={account.is_active} />
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-muted/50 border border-transparent shadow-none"
                                                    onClick={() => {
                                                        setSelectedAccount(account);
                                                        setFormData({
                                                            name: account.name,
                                                            code: account.code,
                                                            type: account.type,
                                                            balance: account.balance
                                                        });
                                                        setIsEditDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 rounded-lg hover:bg-muted/50 border border-transparent shadow-none"
                                                    onClick={() => fetchAccountLedger(account)}
                                                >
                                                    <History className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Account Sheet */}
            <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden bg-background border-l border-border/50 [&>button]:hidden text-foreground">
                    <SheetHeader className="px-6 py-6 border-b border-border/30 bg-muted/10 relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-4 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50" 
                            onClick={() => setIsAddDialogOpen(false)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <Landmark className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="text-left space-y-0.5">
                                <SheetTitle className="text-base font-semibold leading-none tracking-tight">Add New Account</SheetTitle>
                                <SheetDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">Create a new entry in your chart of accounts</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Account Code</label>
                                <Input 
                                    placeholder="e.g. 1020" 
                                    className="h-10 text-sm"
                                    value={formData.code}
                                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Account Type</label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                                    <SelectTrigger className="h-10 text-sm w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="asset" className="text-sm">Asset</SelectItem>
                                        <SelectItem value="liability" className="text-sm">Liability</SelectItem>
                                        <SelectItem value="equity" className="text-sm">Equity</SelectItem>
                                        <SelectItem value="revenue" className="text-sm">Revenue</SelectItem>
                                        <SelectItem value="expense" className="text-sm">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Account Name</label>
                            <Input 
                                placeholder="e.g. Seylan Bank - Main" 
                                className="h-10 text-sm"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Opening Balance (LKR)</label>
                            <Input 
                                type="number"
                                placeholder="0.00" 
                                className="h-10 text-sm font-mono"
                                value={formData.balance}
                                onChange={(e) => setFormData({...formData, balance: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-border/30 bg-muted/10 flex justify-end gap-3 mt-auto">
                        <Button variant="outline" className="rounded-xl" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl min-w-[120px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20" onClick={handleCreateAccount}>Save Account</Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Edit Account Sheet */}
            <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden bg-background border-l border-border/50 [&>button]:hidden text-foreground">
                    <SheetHeader className="px-6 py-6 border-b border-border/30 bg-muted/10 relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-4 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50" 
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <Landmark className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="text-left space-y-0.5">
                                <SheetTitle className="text-base font-semibold leading-none tracking-tight">Edit Account</SheetTitle>
                                <SheetDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">Update chart of account details</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Account Code</label>
                                <Input disabled className="h-10 text-sm bg-muted/30" value={formData.code} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Account Type</label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                                    <SelectTrigger className="h-10 text-sm w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="asset" className="text-sm">Asset</SelectItem>
                                        <SelectItem value="liability" className="text-sm">Liability</SelectItem>
                                        <SelectItem value="equity" className="text-sm">Equity</SelectItem>
                                        <SelectItem value="revenue" className="text-sm">Revenue</SelectItem>
                                        <SelectItem value="expense" className="text-sm">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Account Name</label>
                            <Input 
                                className="h-10 text-sm"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-border/30 bg-muted/10 flex justify-end gap-3 mt-auto">
                        <Button variant="outline" className="rounded-xl" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl min-w-[120px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20" onClick={handleUpdateAccount}>Update Account</Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Account Ledger Sheet */}
            <Sheet open={isLedgerDialogOpen} onOpenChange={setIsLedgerDialogOpen}>
                <SheetContent className="flex flex-col w-full sm:max-w-4xl p-0 overflow-hidden bg-background border-l border-border/50 [&>button]:hidden text-foreground">
                    <SheetHeader className="px-6 py-6 border-b border-border/30 bg-muted/10 relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-4 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50" 
                            onClick={() => setIsLedgerDialogOpen(false)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex justify-between items-start pr-8">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <History className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="text-left space-y-0.5">
                                    <SheetTitle className="text-base font-semibold leading-none tracking-tight flex items-center gap-2">
                                        Transaction History
                                    </SheetTitle>
                                    <SheetDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">
                                        Ledger statement for <span className="text-foreground font-bold">{selectedAccount?.name}</span> ({selectedAccount?.code})
                                    </SheetDescription>
                                </div>
                            </div>
                            <div className="text-right sr-only md:not-sr-only">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Balance</p>
                                <p className="text-xl font-bold text-amber-500 tracking-tight">
                                    LKR {parseFloat(selectedAccount?.balance || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6">Date</TableHead>
                                    <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6">Reference</TableHead>
                                    <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6">Description</TableHead>
                                    <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6 text-right">Debit</TableHead>
                                    <TableHead className="text-xs font-semibold text-muted-foreground py-4 px-6 text-right">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledgerLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <RotateCcw className="h-8 w-8 animate-spin mx-auto text-muted-foreground/30 mb-4" />
                                            <p className="text-xs font-medium text-muted-foreground/50">Fetching Ledger Entries...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : ledgerData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <History className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4 opacity-30" />
                                            <p className="text-xs font-medium text-muted-foreground/50">No transactions recorded yet</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ledgerData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-muted/30 transition-colors border-border/40">
                                            <TableCell className="py-4 px-6 font-medium text-xs text-muted-foreground whitespace-nowrap">
                                                {format(new Date(row.transaction_date), 'dd MMM yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase text-foreground tracking-tight">{row.reference_type}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]">{row.reference_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <p className="text-xs font-medium text-muted-foreground max-w-[250px] italic">
                                                    {row.description}
                                                    {row.customer && <span className="block not-italic font-bold text-muted-foreground/70 mt-1 uppercase text-[10px]">Cust: {row.customer.name}</span>}
                                                    {row.supplier && <span className="block not-italic font-bold text-muted-foreground/70 mt-1 uppercase text-[10px]">Supp: {row.supplier.name}</span>}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right font-mono text-xs font-bold text-foreground whitespace-nowrap">
                                                {row.type === 'debit' ? `LKR ${parseFloat(row.amount).toFixed(2)}` : '-'}
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right font-mono text-xs font-bold text-emerald-500 whitespace-nowrap">
                                                {row.type === 'credit' ? `LKR ${parseFloat(row.amount).toFixed(2)}` : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <div className="p-6 border-t border-border/30 bg-muted/10 flex justify-between items-center mt-auto">
                         <div className="text-xs font-medium text-muted-foreground">
                            Total Entries: <span className="text-foreground font-bold">{ledgerData.length}</span>
                         </div>
                         <Button variant="outline" className="rounded-xl" onClick={() => setIsLedgerDialogOpen(false)}>Close Statement</Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Transfer Funds Sheet */}
            <Sheet open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden bg-background border-l border-border/50 [&>button]:hidden text-foreground">
                    <SheetHeader className="px-6 py-6 border-b border-border/30 bg-muted/10 relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-4 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50" 
                            onClick={() => setIsTransferDialogOpen(false)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="text-left space-y-0.5">
                                <SheetTitle className="text-base font-semibold leading-none tracking-tight">Transfer Funds</SheetTitle>
                                <SheetDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">Move money between your accounts</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">From Account</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-10 text-sm font-normal">
                                        {transferData.from_account_id ? accounts.find(a => a.id === transferData.from_account_id)?.name : "Select Source Account"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search accounts..." />
                                        <CommandList>
                                            <CommandEmpty>No account found.</CommandEmpty>
                                            <CommandGroup>
                                                {accounts.map(a => (
                                                    <CommandItem
                                                        key={a.id}
                                                        value={`${a.code} ${a.name}`}
                                                        onSelect={() => setTransferData({...transferData, from_account_id: a.id})}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-emerald-500", transferData.from_account_id === a.id ? "opacity-100" : "opacity-0")} />
                                                        {a.code} - {a.name} <span className="ml-auto text-muted-foreground font-mono text-xs">LKR {parseFloat(a.balance).toFixed(2)}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">To Account</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-10 text-sm font-normal">
                                        {transferData.to_account_id ? accounts.find(a => a.id === transferData.to_account_id)?.name : "Select Destination Account"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search accounts..." />
                                        <CommandList>
                                            <CommandEmpty>No account found.</CommandEmpty>
                                            <CommandGroup>
                                                {accounts.map(a => (
                                                    <CommandItem
                                                        key={a.id}
                                                        value={`${a.code} ${a.name}`}
                                                        onSelect={() => setTransferData({...transferData, to_account_id: a.id})}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-emerald-500", transferData.to_account_id === a.id ? "opacity-100" : "opacity-0")} />
                                                        {a.code} - {a.name} <span className="ml-auto text-muted-foreground font-mono text-xs">LKR {parseFloat(a.balance).toFixed(2)}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Amount (LKR)</label>
                                <Input 
                                    type="number"
                                    placeholder="0.00" 
                                    className="h-10 text-sm font-mono"
                                    value={transferData.amount}
                                    onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Date</label>
                                <Input 
                                    type="date"
                                    className="h-10 text-sm"
                                    value={transferData.date}
                                    onChange={(e) => setTransferData({...transferData, date: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Notes / Description</label>
                            <Input 
                                placeholder="Purpose of transfer..." 
                                className="h-10 text-sm"
                                value={transferData.description}
                                onChange={(e) => setTransferData({...transferData, description: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-border/30 bg-muted/10 flex justify-end gap-3 mt-auto">
                        <Button variant="outline" className="rounded-xl" onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button>
                        <Button 
                            className="rounded-xl min-w-[120px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20" 
                            onClick={handleTransfer}
                            disabled={!transferData.from_account_id || !transferData.to_account_id || !transferData.amount}
                        >
                            Perform Transfer
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

