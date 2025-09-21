import { AdminImpersonationBar } from "@/components/admin/AdminImpersonationBar";

export const ImpersonationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="min-h-screen pb-20"> {/* Add bottom padding for fixed banner */}
        {children}
      </div>
      <AdminImpersonationBar />
    </>
  );
};