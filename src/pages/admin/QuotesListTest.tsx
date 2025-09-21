import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const QuotesListTest = () => {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🧪 QuotesListTest component mounted');
    testDirectQuotesFetch();
  }, []);

  const testDirectQuotesFetch = async () => {
    console.log('🔍 Testing direct quotes fetch...');
    setLoading(true);
    
    try {
      // Test user authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Auth user:', user?.id, 'Error:', authError);

      // Test user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);
      console.log('🎭 User roles:', roles, 'Error:', rolesError);

      // Test direct quotes query (simplified)
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .limit(5);
      
      console.log('📋 Direct quotes query result:', {
        data: quotesData?.length || 0,
        error: quotesError,
        sample: quotesData?.[0]
      });

      if (quotesError) {
        throw quotesError;
      }

      setQuotes(quotesData || []);
      console.log('✅ Successfully loaded', quotesData?.length || 0, 'quotes');

    } catch (err: any) {
      console.error('❌ Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Quotes Database Test</h1>
      
      {loading && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
          <p className="text-blue-800">Testing database connection...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
          <h3 className="font-medium text-red-800">❌ Database Error</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-green-50 border border-green-200 p-4 rounded mb-4">
          <h3 className="font-medium text-green-800">✅ Database Test Results</h3>
          <p className="text-green-600 text-sm mt-1">Found {quotes.length} quotes in database</p>
        </div>
      )}

      {quotes.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Sample Quotes:</h3>
          <div className="space-y-2">
            {quotes.slice(0, 3).map((quote) => (
              <div key={quote.id} className="bg-gray-50 p-3 rounded text-sm">
                <div><strong>Quote:</strong> {quote.quote_number}</div>
                <div><strong>Customer:</strong> {quote.customer_email}</div>
                <div><strong>Amount:</strong> ${quote.total_amount}</div>
                <div><strong>Status:</strong> {quote.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <p><strong>Check browser console</strong> for detailed debug information</p>
      </div>
    </div>
  );
};

export default QuotesListTest;