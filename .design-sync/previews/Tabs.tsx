import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function Default() {
  return (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="finances">Finances</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="p-4 text-sm text-muted-foreground">
        3 bed · 2 bath · Occupied since Jan 2025.
      </TabsContent>
      <TabsContent value="finances" className="p-4 text-sm text-muted-foreground">
        $2,450/mo · Next payment due the 1st.
      </TabsContent>
      <TabsContent value="documents" className="p-4 text-sm text-muted-foreground">
        Lease agreement, move-in checklist.
      </TabsContent>
    </Tabs>
  );
}
