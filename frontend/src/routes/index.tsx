import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardView } from '@/views/DashboardView';
import { TransactionMonitorView } from '@/views/TransactionMonitorView';
import { MoneyTrailView } from '@/views/MoneyTrailView';
import { FraudLabView } from '@/views/FraudLabView';
import { InvestigationsView } from '@/views/InvestigationsView';
import { ModelPerformanceView } from '@/views/ModelPerformanceView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardView />,
      },
      {
        path: 'dashboard',
        element: <DashboardView />,
      },
      {
        path: 'transactions',
        element: <TransactionMonitorView />,
      },
      {
        path: 'money-trail',
        element: <MoneyTrailView />,
      },
      {
        path: 'fraud-lab',
        element: <FraudLabView />,
      },
      {
        path: 'investigations',
        element: <InvestigationsView />,
      },
      {
        path: 'model-performance',
        element: <ModelPerformanceView />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
