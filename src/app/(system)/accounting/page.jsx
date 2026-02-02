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
import { Plus, Search, Filter, RotateCcw, Landmark, Wallet, TrendingDown, TrendingUp, History, Pencil, ArrowLeftRight } from 'lucide-react';
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
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                        <div className="h-10 w-10 bg-slate-900 text-white flex items-center justify-center rounded-xl shadow-lg">
                            <Landmark className="h-6 w-6" />
                        </div>
                        Chart of Accounts
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Manage your financial accounts and balances
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 font-bold text-xs uppercase tracking-wider gap-2 shadow-sm"
                        onClick={fetchAccounts}
                        disabled={loading}
                    >
                        <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 font-bold text-xs uppercase tracking-wider gap-2 shadow-sm"
                        onClick={() => setIsTransferDialogOpen(true)}
                    >
                        <ArrowLeftRight className="h-4 w-4" />
                        Transfer
                    </Button>
                    <Button 
                        variant="default" 
                        size="sm" 
                        className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-lg"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Add Account
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100 italic-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 w-[100px]">Code</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Account Name</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Type</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Balance</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <RotateCcw className="h-8 w-8 animate-spin mx-auto text-slate-300 mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Chart of Accounts...</p>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <Landmark className="h-12 w-12 mx-auto text-slate-200 mb-4 opacity-30" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No accounts found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account) => (
                                    <TableRow key={account.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                                        <TableCell className="py-4 px-6">
                                            <code className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                {account.code}
                                            </code>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">{account.name}</p>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(account.type)}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    {account.type}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                                            LKR {parseFloat(account.balance).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <StatusBadge value={account.is_active} />
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-white hover:border-slate-200 border border-transparent shadow-none"
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
                                                    <Pencil className="h-4 w-4 text-slate-400" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 rounded-lg hover:bg-white hover:border-slate-200 border border-transparent shadow-none"
                                                    onClick={() => fetchAccountLedger(account)}
                                                >
                                                    <History className="h-4 w-4 text-slate-400" />
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

            {/* Add Account Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Add New Account</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium italic">Create a new entry in your chart of accounts</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-4 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Code</label>
                                <Input 
                                    placeholder="e.g. 1020" 
                                    className="h-10 font-bold text-xs"
                                    value={formData.code}
                                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Type</label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                                    <SelectTrigger className="h-10 font-bold text-xs uppercase tracking-wider">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="asset" className="text-xs font-bold uppercase tracking-wider">Asset</SelectItem>
                                        <SelectItem value="liability" className="text-xs font-bold uppercase tracking-wider">Liability</SelectItem>
                                        <SelectItem value="equity" className="text-xs font-bold uppercase tracking-wider">Equity</SelectItem>
                                        <SelectItem value="revenue" className="text-xs font-bold uppercase tracking-wider">Revenue</SelectItem>
                                        <SelectItem value="expense" className="text-xs font-bold uppercase tracking-wider">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Name</label>
                            <Input 
                                placeholder="e.g. Seylan Bank - Main" 
                                className="h-10 font-bold text-xs uppercase tracking-tight"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opening Balance (LKR)</label>
                            <Input 
                                type="number"
                                placeholder="0.00" 
                                className="h-10 font-bold text-xs font-mono"
                                value={formData.balance}
                                onChange={(e) => setFormData({...formData, balance: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
                        <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-slate-400" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-8 shadow-lg" onClick={handleCreateAccount}>Save Account</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Account Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Edit Account</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium italic">Update chart of account details</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-4 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Code</label>
                                <Input disabled className="h-10 font-bold text-xs bg-slate-50" value={formData.code} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Type</label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                                    <SelectTrigger className="h-10 font-bold text-xs uppercase tracking-wider">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="asset" className="text-xs font-bold uppercase tracking-wider">Asset</SelectItem>
                                        <SelectItem value="liability" className="text-xs font-bold uppercase tracking-wider">Liability</SelectItem>
                                        <SelectItem value="equity" className="text-xs font-bold uppercase tracking-wider">Equity</SelectItem>
                                        <SelectItem value="revenue" className="text-xs font-bold uppercase tracking-wider">Revenue</SelectItem>
                                        <SelectItem value="expense" className="text-xs font-bold uppercase tracking-wider">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Name</label>
                            <Input 
                                className="h-10 font-bold text-xs uppercase tracking-tight"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
                        <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-slate-400" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-8 shadow-lg" onClick={handleUpdateAccount}>Update Account</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Account Ledger Dialog */}
            <Dialog open={isLedgerDialogOpen} onOpenChange={setIsLedgerDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl p-0 border-none shadow-2xl flex flex-col">
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <History className="h-5 w-5 text-amber-400" />
                                    Transaction History
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 font-medium">
                                    Ledger statement for <span className="text-white font-bold">{selectedAccount?.name}</span> ({selectedAccount?.code})
                                </DialogDescription>
                            </div>
                            <div className="text-right sr-only md:not-sr-only">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Balance</p>
                                <p className="text-2xl font-black text-amber-400 tracking-tighter">
                                    LKR {parseFloat(selectedAccount?.balance || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6">Reference</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6">Description</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6 text-right">Debit</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 px-6 text-right">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledgerLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <RotateCcw className="h-8 w-8 animate-spin mx-auto text-slate-200 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching Ledger Entries...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : ledgerData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <History className="h-12 w-12 mx-auto text-slate-100 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No transactions recorded yet</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ledgerData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                            <TableCell className="py-4 px-6 font-bold text-[11px] text-slate-500 whitespace-nowrap">
                                                {format(new Date(row.transaction_date), 'dd MMM yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black uppercase text-slate-900 tracking-tight">{row.reference_type}</span>
                                                    <span className="text-[9px] text-slate-400 font-mono opacity-60 truncate max-w-[100px]">{row.reference_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <p className="text-[11px] font-medium text-slate-600 max-w-[250px] italic">
                                                    {row.description}
                                                    {row.customer && <span className="block not-italic font-bold text-slate-400 mt-1 uppercase text-[9px]">Cust: {row.customer.name}</span>}
                                                    {row.supplier && <span className="block not-italic font-bold text-slate-400 mt-1 uppercase text-[9px]">Supp: {row.supplier.name}</span>}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                                                {row.type === 'debit' ? `LKR ${parseFloat(row.amount).toFixed(2)}` : '-'}
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-right font-mono text-xs font-bold text-emerald-600 whitespace-nowrap">
                                                {row.type === 'credit' ? `LKR ${parseFloat(row.amount).toFixed(2)}` : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center sm:justify-between">
                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Total Entries: <span className="text-slate-900">{ledgerData.length}</span>
                         </div>
                         <Button variant="outline" className="text-xs font-black uppercase tracking-widest h-9 px-6 rounded-xl border-slate-200" onClick={() => setIsLedgerDialogOpen(false)}>Close Statement</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transfer Funds Dialog */}
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <ArrowLeftRight className="h-5 w-5 text-indigo-400" />
                            Transfer Funds
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium italic">Move money between your accounts</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-4 bg-white">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">From Account</label>
                            <Select value={transferData.from_account_id} onValueChange={(v) => setTransferData({...transferData, from_account_id: v})}>
                                <SelectTrigger className="h-10 font-bold text-xs uppercase tracking-wider">
                                    <SelectValue placeholder="SELECT SOURCE ACCOUNT" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {accounts.map(a => (
                                        <SelectItem key={a.id} value={a.id} className="text-xs font-bold uppercase tracking-wider">
                                            {a.code} - {a.name} (LKR {parseFloat(a.balance).toFixed(2)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">To Account</label>
                            <Select value={transferData.to_account_id} onValueChange={(v) => setTransferData({...transferData, to_account_id: v})}>
                                <SelectTrigger className="h-10 font-bold text-xs uppercase tracking-wider">
                                    <SelectValue placeholder="SELECT DESTINATION ACCOUNT" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {accounts.map(a => (
                                        <SelectItem key={a.id} value={a.id} className="text-xs font-bold uppercase tracking-wider">
                                            {a.code} - {a.name} (LKR {parseFloat(a.balance).toFixed(2)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (LKR)</label>
                                <Input 
                                    type="number"
                                    placeholder="0.00" 
                                    className="h-10 font-bold text-xs font-mono"
                                    value={transferData.amount}
                                    onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</label>
                                <Input 
                                    type="date"
                                    className="h-10 font-bold text-xs"
                                    value={transferData.date}
                                    onChange={(e) => setTransferData({...transferData, date: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes / Description</label>
                            <Input 
                                placeholder="Purpose of transfer..." 
                                className="h-10 font-bold text-xs"
                                value={transferData.description}
                                onChange={(e) => setTransferData({...transferData, description: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
                        <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-slate-400" onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button>
                        <Button 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest px-8 shadow-lg" 
                            onClick={handleTransfer}
                            disabled={!transferData.from_account_id || !transferData.to_account_id || !transferData.amount}
                        >
                            Perform Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

