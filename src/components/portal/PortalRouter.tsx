import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { CustomerPortal } from './CustomerPortal';
import { QuoteDetail } from './QuoteDetail';
import { OrderDetail } from './OrderDetail';
import ProtectedRoute from '../ProtectedRoute';

export const PortalRouter = () => {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <CustomerPortal />
        </ProtectedRoute>
      } />
      <Route path="/quotes/:id" element={
        <ProtectedRoute>
          <QuoteDetailWrapper />
        </ProtectedRoute>
      } />
      <Route path="/orders/:id" element={
        <ProtectedRoute>
          <OrderDetailWrapper />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const QuoteDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <QuoteDetail quoteId={id!} />;
};

const OrderDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  return <OrderDetail orderId={id!} />;
};