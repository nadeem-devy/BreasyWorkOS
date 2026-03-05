import DashboardSidebar from '@/components/layout/DashboardSidebar';
import TopHeader from '@/components/layout/TopHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="ml-56">
        <TopHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
