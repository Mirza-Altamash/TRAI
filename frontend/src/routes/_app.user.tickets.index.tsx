import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketTable } from "@/components/common/TicketTable";
import { Pager } from "@/components/common/Pager";
import { useCurrentUser } from "@/lib/auth";
import { listTickets } from "@/services/mock";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { Plus, Search, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/user/tickets/")({ component: UserTickets });

function UserTickets() {
  const user = useCurrentUser();
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const { data: all } = useQuery({
    queryKey: [
      "tickets",
      {
        createdBy: user.empId,
        page,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchText || undefined,
      },
    ],
    queryFn: () =>
      listTickets({
        createdBy: user.empId,
        page,
        pageSize: 10,
        status: (statusFilter === "all" ? undefined : statusFilter) as any,
        search: searchText || undefined,
      }),
  });

  const { data: recent } = useQuery({
    queryKey: ["tickets", { createdBy: user.empId, recent: true }],
    queryFn: () => listTickets({ createdBy: user.empId, page: 1, pageSize: 5 }),
  });

  const handleExport = async (format: "excel" | "pdf") => {
    setExporting(format);
    try {
      const endpoint =
        format === "excel" ? "/user/my-tickets/export/excel" : "/user/my-tickets/export/pdf";
      const res = await apiClient.get(endpoint, {
        responseType: "blob",
        params: {
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchText || undefined,
        },
      });

      const blob = new Blob([res.data], {
        type:
          format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `my-tickets-export-${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${format === "excel" ? "Excel" : "PDF"} downloaded successfully`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export to ${format}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tickets"
        subtitle="Track tickets you have raised."
        actions={
          <Button asChild>
            <Link to="/user/tickets/new">
              <Plus className="mr-1.5 h-4 w-4" /> Raise Ticket
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by ID, title, department, assigned member, status or date..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-50/50 dark:bg-slate-950/30"
          />
        </div>

        <div className="w-44">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/30">
              <SelectValue placeholder="All Tickets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={exporting !== null}
            onClick={() => handleExport("excel")}
            className="text-xs h-9"
          >
            {exporting === "excel" ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-green-600" />
            )}
            Excel
          </Button>
          <Button
            variant="outline"
            disabled={exporting !== null}
            onClick={() => handleExport("pdf")}
            className="text-xs h-9"
          >
            {exporting === "pdf" ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1.5 h-3.5 w-3.5 text-red-600" />
            )}
            PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {!all?.rows.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No tickets found matching your criteria.
                </div>
              ) : (
                <>
                  <TicketTable rows={all.rows} showCreatedBy={false} />
                  <Pager
                    page={all.page}
                    pageSize={all.pageSize}
                    total={all.total}
                    onPageChange={setPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {!recent?.rows.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No recent tickets.
                </div>
              ) : (
                <TicketTable rows={recent.rows} showCreatedBy={false} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
