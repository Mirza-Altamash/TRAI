import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketTable } from "@/components/common/TicketTable";
import { Pager } from "@/components/common/Pager";
import { useCurrentUser } from "@/lib/auth";
import { listAssigneeTicketsSplit } from "@/services/mock";

export function AssigneeTickets({ label }: { label: "L2" | "L3" }) {
  const user = useCurrentUser();
  const [newPage, setNewPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const { data: newData } = useQuery({
    queryKey: ["assignee-tickets", user.empId, "new", newPage],
    queryFn: () => listAssigneeTicketsSplit(user.empId, "new", { page: newPage, pageSize: 10 }),
  });
  const { data: allData } = useQuery({
    queryKey: ["assignee-tickets", user.empId, "all", allPage],
    queryFn: () => listAssigneeTicketsSplit(user.empId, "all", { page: allPage, pageSize: 10 }),
  });
  return (
    <div className="space-y-6">
      <PageHeader title={`Tickets · ${label}`} subtitle="Assigned Tickets are awaiting your first action. Total Tickets covers everything assigned to you." />
      <Tabs defaultValue="assigned">
        <TabsList>
          <TabsTrigger value="assigned">
            Assigned Tickets{newData ? ` (${newData.total})` : ""}
          </TabsTrigger>
          <TabsTrigger value="total">
            Total Tickets{allData ? ` (${allData.total})` : ""}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="assigned" className="mt-4">
          <Card><CardContent className="p-0">
            <TicketTable rows={newData?.rows ?? []} showAssignee={false} markNewAll />
            {newData && <Pager page={newData.page} pageSize={newData.pageSize} total={newData.total} onPageChange={setNewPage} />}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="total" className="mt-4">
          <Card><CardContent className="p-0">
            <TicketTable rows={allData?.rows ?? []} showAssignee={false} />
            {allData && <Pager page={allData.page} pageSize={allData.pageSize} total={allData.total} onPageChange={setAllPage} />}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}