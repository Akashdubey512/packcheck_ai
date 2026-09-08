import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/providers/AppProviders';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScanPage } from '@/pages/ScanPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { Routes, Route } from 'react-router-dom';

describe('Page Mounting Diagnostics', () => {
  it('renders ScanPage correctly inside AppLayout', async () => {
    const { container } = render(
      <AppProviders>
        <MemoryRouter initialEntries={['/scan']}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route path="scan" element={<ScanPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByText(/Statutory Packaging Label Ingestion/i)).toBeInTheDocument();
    console.log('Scan page container innerHTML snippet:', container.innerHTML.slice(0, 300));
  });

  it('renders DashboardPage correctly inside AppLayout', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByText(/Compliance Overview & Analytics/i)).toBeInTheDocument();
  });

  it('navigates from HomePage to ScanPage with AnimatePresence', async () => {
    const { fireEvent } = await import('@testing-library/react');

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByText(/Automated Label Compliance/i)).toBeInTheDocument();

    const launchBtn = screen.getByRole('button', { name: /Launch Live Scanner/i });
    fireEvent.click(launchBtn);

    expect(screen.getByText(/Statutory Packaging Label Ingestion/i)).toBeInTheDocument();
  });

  it('navigates from HomePage to DashboardPage smoothly', async () => {
    const { fireEvent } = await import('@testing-library/react');

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByText(/Automated Label Compliance/i)).toBeInTheDocument();

    const dashboardBtn = screen.getByRole('button', { name: /Open Dashboard/i });
    fireEvent.click(dashboardBtn);

    expect(screen.getByText(/Compliance Overview & Analytics/i)).toBeInTheDocument();
  });
});

