import React from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import Production from '@/pages/admin/Production';

const AdminDashboard = () => {
  return (
    <AdminProtectedRoute>
      <Production />
    </AdminProtectedRoute>
  );
};

export default AdminDashboard;