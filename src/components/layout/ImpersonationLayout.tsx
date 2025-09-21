import { AdminImpersonationBar } from "@/components/admin/AdminImpersonationBar";

export const ImpersonationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AdminImpersonationBar />
      <div className=""> {/* Removed padding since AdminImpersonationBar is now conditionally rendered */}
        {children}
      </div>
    </>
  );
};