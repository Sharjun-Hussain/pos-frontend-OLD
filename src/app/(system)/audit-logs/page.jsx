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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
            <div className="h-10 w-10 bg-slate-900 text-white flex items-center justify-center rounded-xl shadow-lg shadow-slate-200">
              <Activity className="h-6 w-6" />
            </div>
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500 font-medium ml-13">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 hover:bg-slate-50 hover:text-slate-900 border-slate-200 text-slate-600 transition-all font-bold text-xs uppercase tracking-wider gap-2 shadow-sm"
            onClick={fetchAuditLogs}
            disabled={loading}
          >
            <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white transition-all font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-slate-200"
            onClick={exportToCSV}
          >
            <FileDown className="h-3.5 w-3.5" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-col md:flex-row items-center gap-2">
        <div className="grid grid-cols-1 md:flex flex-1 items-center gap-2 w-full">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search activity description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9 border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-medium placeholder:text-slate-400 transition-all rounded-lg"
            />
          </div>

          {/* Action Filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-9 w-full md:w-[140px] border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider rounded-lg transition-all focus:ring-slate-200">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
              <SelectItem value="all" className="text-xs font-bold uppercase">All Actions</SelectItem>
              <SelectItem value="CREATE" className="text-xs font-bold uppercase">Create</SelectItem>
              <SelectItem value="UPDATE" className="text-xs font-bold uppercase">Update</SelectItem>
              <SelectItem value="DELETE" className="text-xs font-bold uppercase">Delete</SelectItem>
              <SelectItem value="LOGIN" className="text-xs font-bold uppercase">Login</SelectItem>
              <SelectItem value="LOGOUT" className="text-xs font-bold uppercase">Logout</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full md:w-[140px] border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider rounded-lg transition-all focus:ring-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
              <SelectItem value="all" className="text-xs font-bold uppercase">All Status</SelectItem>
              <SelectItem value="success" className="text-xs font-bold uppercase">Success</SelectItem>
              <SelectItem value="failure" className="text-xs font-bold uppercase">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="h-9 justify-start text-left font-bold text-xs uppercase tracking-wider border-slate-200 bg-slate-50/50 rounded-lg w-full md:w-auto min-w-[200px] hover:bg-slate-100 transition-all shadow-none"
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd MMM yyyy')
                  )
                ) : (
                  <span className="text-slate-400">Date Range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100 shadow-2xl mt-1" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="rounded-2xl p-3"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-2">
          <Button 
            onClick={handleSearch} 
            className="flex-1 md:flex-none h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 rounded-lg shadow-sm transition-all"
          >
            <Search className="h-3.5 w-3.5 mr-2" />
            Search
          </Button>
          <Button
            variant="ghost"
            className="flex-1 md:flex-none h-9 text-slate-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs uppercase tracking-wider px-4 rounded-lg transition-all"
            onClick={() => {
              setSearch('');
              setActionFilter('all');
              setStatusFilter('all');
              setDateRange({ from: null, to: null });
              setPage(1);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <RotateCcw className="h-8 w-8 animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading Activities...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Activity className="h-12 w-12 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest">No activities found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Timestamp</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">User</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Action</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Entity</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Description</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">IP Address</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100 italic-none">
                      <TableCell className="py-4 px-6">
                        <div className="text-[11px] font-bold text-slate-500 flex flex-col">
                          <span className="text-slate-900">{format(new Date(log.created_at), 'dd MMM yyyy')}</span>
                          <span className="text-[10px] opacity-70">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-sm font-bold text-slate-800">{log.user?.name || 'System'}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{log.user?.email || 'automated@system.com'}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">{getActionBadge(log.action)}</TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{log.entity_type || '-'}</div>
                        {log.entity_id && (
                          <div className="text-[10px] text-slate-400 font-mono opacity-60">
                            {log.entity_id.substring(0, 8)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="max-w-[300px] truncate text-[11px] font-medium text-slate-600" title={log.description}>
                          {log.description}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="py-4 px-6">
                        <code className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.ip_address || '0.0.0.0'}
                        </code>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 shadow-none transition-all"
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
            <div className="flex items-center justify-between p-4 bg-slate-50/30 border-t border-slate-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages || 1}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-black uppercase tracking-widest px-4 border-slate-200 hover:bg-white text-slate-600 shadow-sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-black uppercase tracking-widest px-4 border-slate-200 hover:bg-white text-slate-600 shadow-sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || !totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0">
          <DialogHeader className="p-6 bg-slate-900 text-white rounded-t-2xl">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Activity className="h-5 w-5 text-emerald-400" />
              Log Details
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Comprehensive trace for transaction ID: <span className="text-white font-mono">{selectedLog?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="p-6 space-y-8 bg-white">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</label>
                  <p className="text-sm font-bold text-slate-900">{format(new Date(selectedLog.created_at), 'PPpp')}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">User Identity</label>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                      {(selectedLog.user?.name || 'S')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedLog.user?.name || 'System'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{selectedLog.user?.email || 'automated@system.com'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-block">Core Action</label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-block">Execution Status</label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entity Context</label>
                  <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{selectedLog.entity_type || '-'}</p>
                  <p className="text-[10px] font-mono text-slate-400 opacity-70 truncate">{selectedLog.entity_id || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Info</label>
                  <p className="text-sm font-bold text-slate-900 font-mono tracking-tight">{selectedLog.ip_address || '0.0.0.0'}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]" title={selectedLog.user_agent}>{selectedLog.user_agent || '-'}</p>
                </div>
                <div className="col-span-2 space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Summary</label>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic">{selectedLog.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                {(selectedLog.old_values || selectedLog.new_values) && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                       <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                       Data Payload Changes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedLog.old_values && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase text-slate-500 ml-1">Previous State</label>
                          <pre className="p-4 bg-slate-50 rounded-xl text-[11px] font-medium text-slate-600 overflow-x-auto border border-slate-100 max-h-[300px]">
                            {JSON.stringify(selectedLog.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.new_values && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase text-slate-500 ml-1">Updated State</label>
                          <pre className="p-4 bg-emerald-50/50 rounded-xl text-[11px] font-medium text-emerald-700 overflow-x-auto border border-emerald-100/50 max-h-[300px]">
                            {JSON.stringify(selectedLog.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div className="space-y-2 pt-4 border-t border-slate-100 text-block">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600 flex items-center gap-2">
                       <div className="h-1.5 w-1.5 bg-red-600 rounded-full" />
                       Error Diagnostics
                    </h4>
                    <pre className="p-4 bg-red-50 text-red-700 rounded-xl text-[11px] font-mono border border-red-100 overflow-x-auto">
                      {selectedLog.error_message}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                       <div className="h-1.5 w-1.5 bg-slate-400 rounded-full" />
                       System Metadata
                    </h4>
                    <pre className="p-4 bg-slate-50 rounded-xl text-[11px] font-medium text-slate-500 overflow-x-auto border border-slate-100">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
