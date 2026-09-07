import { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ScanPage } from '@/pages/ScanPage';
import { ScanDetailPage } from '@/pages/ScanDetailPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { VerifyPage } from '@/pages/VerifyPage';
import { VerifyBatchPage } from '@/pages/VerifyBatchPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ROUTES } from '@/constants/routes';

export const routes: RouteObject[] = [
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.HOME,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'scan',
        element: <ScanPage />,
      },
      {
        path: 'scan/:id',
        element: <ScanDetailPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'verify',
        element: <VerifyPage />,
      },
      {
        path: 'verify/:batch_id',
        element: <VerifyBatchPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];
