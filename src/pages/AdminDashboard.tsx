import React from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';

const AdminDashboard = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout />
    </AdminProtectedRoute>
  );
};

export default AdminDashboard;