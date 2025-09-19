import { AdminImpersonationBar } from "@/components/admin/AdminImpersonationBar";

export const ImpersonationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AdminImpersonationBar />
      <div className="pt-16"> {/* Add padding to account for fixed impersonation bar */}
        {children}
      </div>
    </>
  );
};