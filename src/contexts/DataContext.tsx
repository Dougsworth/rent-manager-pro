import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api } from '@/services/api';

interface DataContextType {
  refreshTenants: () => Promise<void>;
  refreshInvoices: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshAll: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const refreshTenants = useCallback(async () => {
    window.dispatchEvent(new Event('refresh-tenants'));
  }, []);
  
  const refreshInvoices = useCallback(async () => {
    window.dispatchEvent(new Event('refresh-invoices'));
  }, []);
  
  const refreshPayments = useCallback(async () => {
    window.dispatchEvent(new Event('refresh-payments'));
  }, []);
  
  const refreshDashboard = useCallback(async () => {
    window.dispatchEvent(new Event('refresh-dashboard'));
  }, []);
  
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    window.dispatchEvent(new Event('refresh-tenants'));
    window.dispatchEvent(new Event('refresh-invoices'));
    window.dispatchEvent(new Event('refresh-payments'));
    window.dispatchEvent(new Event('refresh-dashboard'));
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsLoading(false);
  }, []);
  
  return (
    <DataContext.Provider value={{
      refreshTenants,
      refreshInvoices,
      refreshPayments,
      refreshDashboard,
      refreshAll,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}