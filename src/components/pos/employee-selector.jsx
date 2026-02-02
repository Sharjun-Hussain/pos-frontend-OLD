import React, { useState } from "react";
import { Check, User, X, Search, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function EmployeeSelector({ 
  employees = [], 
  selectedEmployees = [], 
  onToggleEmployee 
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto py-2 bg-white"
          >
            <div className="flex flex-col items-start gap-1 w-full overflow-hidden">
               <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold tracking-wider">
                  <Users className="h-3 w-3" />
                  Sold By
               </div>
               
               {selectedEmployees.length > 0 ? (
                 <div className="flex flex-wrap gap-1 mt-1">
                   {selectedEmployees.map((id) => {
                     const emp = employees.find(e => e.id === id);
                     return emp ? (
                       <Badge key={id} variant="secondary" className="px-1.5 py-0.5 text-xs font-normal">
                         {emp.name}
                       </Badge>
                     ) : null;
                   })}
                 </div>
               ) : (
                 <span className="text-sm text-slate-400 italic">Select employees...</span>
               )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="p-1">
              {filteredEmployees.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No employees found.
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const isSelected = selectedEmployees.includes(employee.id);
                  return (
                    <div
                      key={employee.id}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => onToggleEmployee(employee.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={employee.profile_image} />
                            <AvatarFallback className="text-[10px]">{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="truncate flex-1">{employee.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
