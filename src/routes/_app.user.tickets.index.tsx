import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TicketTable } from "@/components/common/TicketTable";
import { Pager } from "@/components/common/Pager";
import { useCurrentUser } from "@/lib/auth";
import { listTickets } from "@/services/mock";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/user/tickets/")({ component: UserTickets });

function UserTickets() {
  const user = useCurrentUser();
  const [page, setPage] = useState(1);
  const { data: all } = useQuery({
    queryKey: ["tickets", { createdBy: user.empId, page }],
    queryFn: () => listTickets({ createdBy: user.empId, page, pageSize: 10 }),
  });
  const { data: recent } = useQuery({
    queryKey: ["tickets", { createdBy: user.empId, recent: true }],
    queryFn: () => listTickets({ createdBy: user.empId, page: 1, pageSize: 5 }),
  });
  return (
    <div className="space-y-6">
      <PageHeader title="My Tickets" subtitle="Track tickets you have raised." actions={
        <Button asChild><Link to="/user/tickets/new"><Plus className="mr-1.5 h-4 w-4" /> Raise Ticket</Link></Button>
      } />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <Card><CardContent className="p-0">
            <TicketTable rows={all?.rows ?? []} showCreatedBy={false} />
            {all && <Pager page={all.page} pageSize={all.pageSize} total={all.total} onPageChange={setPage} />}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="recent" className="mt-4">
          <Card><CardContent className="p-0"><TicketTable rows={recent?.rows ?? []} showCreatedBy={false} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}