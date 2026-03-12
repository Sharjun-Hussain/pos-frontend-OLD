'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Calendar as CalendarIcon, Download, Eye, Filter, Activity, RotateCcw, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (session) {
      fetchAuditLogs();
    }
  }, [session, page, actionFilter, statusFilter, dateRange]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 20,
        ...(search && { search }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateRange.from && { start_date: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange.to && { end_date: format(dateRange.to, 'yyyy-MM-dd') })
      };

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/audit-logs`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          params
        }
      );

      const result = response.data;
      if (result.status === 'success') {
        setLogs(Array.isArray(result.data) ? result.data : (result.data?.data || []));
        const total = result.pagination?.total || result.data?.total || 0;
        setTotalPages(Math.ceil(total / 20) || 1);
      } else {
        toast.error(result.message || 'Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchAuditLogs();
  };

  const viewDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["Timestamp", "User", "Email", "Action", "Entity", "Description", "Status", "IP Address"];
    const csvData = logs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.user?.name || 'System',
      log.user?.email || 'N/A',
      log.action,
      log.entity_type || 'N/A',
      `"${log.description.replace(/"/g, '""')}"`,
      log.status,
      log.ip_address || 'N/A'
    ]);

    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit logs exported successfully");
  };

  const getActionBadge = (action) => {
    const colors = {
      CREATE: 'bg-emerald-500 hover:bg-emerald-600',
      UPDATE: 'bg-blue-500 hover:bg-blue-600',
      DELETE: 'bg-red-500 hover:bg-red-600',
      LOGIN: 'bg-indigo-500 hover:bg-indigo-600',
      LOGOUT: 'bg-slate-500 hover:bg-slate-600',
      READ: 'bg-cyan-500 hover:bg-cyan-600'
    };
    
    return (
      <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm border-none text-white", colors[action] || 'bg-slate-400')}>
        {action}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    return <StatusBadge value={status} />;
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">Audit Trace</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Security</span>
              <span className="text-muted-foreground/30">/</span>
              <span>System Logs</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Audit Analysis</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={fetchAuditLogs} 
            variant="outline" 
            className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
            disabled={loading}
          >
            <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh Registers
          </Button>
          <Button 
            onClick={exportToCSV}
            className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95"
          >
            <FileDown className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
          <Filter className="w-4 h-4 text-[#10b981]" />
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Trace Filters</CardTitle>
            <CardDescription className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">Segment system activities by entity, action, and periodicity</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Universal Search</label>
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-[#10b981] transition-colors" />
                    <Input
                        placeholder="Search description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="h-11 pl-10 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                    />
                </div>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Action Protocol</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all group">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                        <SelectItem value="all" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">All Protocols</SelectItem>
                        <SelectItem value="CREATE" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">Create</SelectItem>
                        <SelectItem value="UPDATE" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">Update</SelectItem>
                        <SelectItem value="DELETE" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">Delete</SelectItem>
                        <SelectItem value="LOGIN" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">Login</SelectItem>
                        <SelectItem value="LOGOUT" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">Logout</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Execution Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all group">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                        <SelectItem value="all" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">All Status</SelectItem>
                        <SelectItem value="success" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">Success</SelectItem>
                        <SelectItem value="failure" className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-widest">Failure</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Chronological Window</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="h-11 w-full justify-start text-left font-bold text-xs uppercase tracking-widest border-border/50 bg-background rounded-xl hover:bg-muted/30 transition-all shadow-sm group"
                        >
                            <CalendarIcon className="mr-2.5 h-4 w-4 text-muted-foreground/40 group-hover:text-[#10b981]" />
                            {dateRange.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM')}
                                    </>
                                ) : (
                                    format(dateRange.from, 'dd MMM yyyy')
                                )
                            ) : (
                                <span className="text-muted-foreground/40">Select Range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-border/50 shadow-2xl mt-2" align="start">
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            className="rounded-2xl p-4"
                        />
                    </PopoverContent>
                </Popover>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border/30">
            <Button
                variant="ghost"
                className="h-11 text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                onClick={() => {
                    setSearch('');
                    setActionFilter('all');
                    setStatusFilter('all');
                    setDateRange({ from: null, to: null });
                    setPage(1);
                }}
            >
                Reset Registers
            </Button>
            <Button 
                onClick={handleSearch} 
                className="bg-[#10b981] hover:bg-[#0da371] text-white h-11 px-8 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#10b981]/10 transition-all active:scale-95"
            >
                Run Search Trace
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-[#10b981]" />
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Transaction Trace</CardTitle>
              <CardDescription className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">Real-time audit stream of system-wide operations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-[#10b981]/10 border-t-[#10b981] animate-spin" />
                <Activity className="absolute inset-0 m-auto h-5 w-5 text-[#10b981] animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Hydrating Audit Registers...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground/40">
              <Activity className="h-12 w-12 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">No transactional trace discovered</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Temporal Point</TableHead>
                      <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Operator Identity</TableHead>
                      <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Action Protocol</TableHead>
                      <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Logic Entity</TableHead>
                      <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Operation Details</TableHead>
                      <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Execution</TableHead>
                      <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Network UID</TableHead>
                      <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest">Trace Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-border/40 group hover:bg-muted/5 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-foreground">{format(new Date(log.created_at), 'dd MMM yyyy')}</span>
                            <span className="text-[10px] font-medium text-muted-foreground opacity-60">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-foreground">{log.user?.name || 'Automated System'}</span>
                            <span className="text-[10px] font-medium text-muted-foreground opacity-60 uppercase tracking-tight">{log.user?.email || 'SYSTEM_DAEMON'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-foreground uppercase tracking-tight">{log.entity_type || 'N/A'}</span>
                            <span className="text-[9px] font-mono text-muted-foreground opacity-50">{log.entity_id?.substring(0, 12) || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[280px] truncate text-[11px] font-medium text-muted-foreground italic leading-relaxed" title={log.description}>
                            "{log.description}"
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          <code className="text-[10px] font-bold text-muted-foreground/60 bg-muted/50 px-2 py-1 rounded-lg border border-border/30">
                            {log.ip_address || '0.0.0.0'}
                          </code>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/40 hover:text-[#10b981] hover:bg-[#10b981]/5 transition-all outline-none"
                            onClick={() => viewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="p-6 border-t border-border/30 bg-muted/5 flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                  Register Frame <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages || 1}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="h-9 px-4 rounded-xl border-border/50 bg-background font-bold text-[10px] uppercase tracking-widest hover:bg-muted/30 transition-all disabled:opacity-30"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous Frame
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 px-4 rounded-xl border-border/50 bg-background font-bold text-[10px] uppercase tracking-widest hover:bg-muted/30 transition-all disabled:opacity-30"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || !totalPages}
                  >
                    Next Frame
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* --- DETAILS DIALOG --- */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0 font-sans">
          <DialogHeader className="p-8 border-b border-border/30 bg-muted/5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground uppercase">Transaction Detail Trace</DialogTitle>
                <DialogDescription className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                  Deep audit analysis for frame ID: <span className="text-[#10b981] font-mono selection:bg-[#10b981]/20">{selectedLog?.id}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedLog && (
            <div className="p-8 space-y-10">
              {/* Primary Trace Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Temporal Point</label>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{format(new Date(selectedLog.created_at), 'PPpp')}</span>
                    <span className="text-[10px] font-medium text-muted-foreground opacity-60">Execution Timestamp</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Operator Entity</label>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted border border-border/50 flex items-center justify-center text-[10px] font-black text-muted-foreground">
                      {(selectedLog.user?.name || 'S')[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{selectedLog.user?.name || 'System Daemon'}</span>
                      <span className="text-[10px] font-medium text-muted-foreground opacity-60 truncate max-w-[150px]">{selectedLog.user?.email || 'automated@system.internal'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Network Context</label>
                  <div className="flex flex-col">
                    <code className="text-sm font-bold text-[#10b981] font-mono tracking-tight">{selectedLog.ip_address || '0.0.0.0'}</code>
                    <span className="text-[10px] font-medium text-muted-foreground opacity-60 truncate max-w-[200px]" title={selectedLog.user_agent}>
                        {selectedLog.user_agent || 'Unknown Client'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Operational Protocol</label>
                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Execution Status</label>
                    <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Entity Mapping</label>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground uppercase tracking-tight">{selectedLog.entity_type || 'GLOBAL_SYSTEM'}</span>
                      <span className="text-[10px] font-mono font-medium text-muted-foreground opacity-60 truncate max-w-[200px]">{selectedLog.entity_id || 'NULL_REFERENCE'}</span>
                    </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/30 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10b981]">Operation Summary</label>
                <p className="text-sm font-medium text-foreground leading-relaxed italic">
                  "{selectedLog.description}"
                </p>
              </div>

              {/* Data Changes */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <div className="space-y-6 pt-6 border-t border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 bg-[#10b981] rounded-full" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Data State Reconciliation</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1 tracking-widest flex items-center gap-2">
                          <RotateCcw className="w-3 h-3" /> Pre-Transactional State
                      </label>
                      <pre className="p-5 bg-muted/10 rounded-2xl text-[11px] font-medium text-muted-foreground overflow-x-auto border border-border/30 max-h-[400px] scrollbar-thin">
                        {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : "// No preceding state recorded"}
                      </pre>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-bold uppercase text-[#10b981] ml-1 tracking-widest flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Post-Transactional State
                      </label>
                      <pre className="p-5 bg-[#10b981]/5 rounded-2xl text-[11px] font-medium text-[#10b981] overflow-x-auto border border-[#10b981]/20 max-h-[400px] scrollbar-thin">
                        {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : "// No state transformation recorded"}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Stack */}
              {selectedLog.error_message && (
                <div className="space-y-4 pt-6 border-t border-red-100/30">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Error Diagnostic Stack</h4>
                  </div>
                  <pre className="p-5 bg-red-50/30 text-red-700/80 rounded-2xl text-[11px] font-mono border border-red-100/50 overflow-x-auto scrollbar-thin">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}

              {/* Infrastructure Metadata */}
              {selectedLog.metadata && (
                <div className="space-y-4 pt-6 border-t border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">System Metadata</h4>
                    </div>
                    <pre className="p-5 bg-muted/5 rounded-2xl text-[11px] font-medium text-muted-foreground/40 overflow-x-auto border border-border/20 scrollbar-thin">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
