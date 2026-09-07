import { createContext, useContext } from 'react';
import { User, Role } from '@/types/user';

export const DEMO_USERS: Record<Role, User> = {
  LEGAL_METROLOGY_OFFICER: {
    id: 'usr_lmo_01',
    name: 'Inspector Rajesh Sharma',
    email: 'officer.sharma@metrology.gov.in',
    role: 'LEGAL_METROLOGY_OFFICER',
    department: 'Directorate of Legal Metrology, Enforcement Wing',
    badgeNumber: 'LMO-IND-8912',
    createdAt: '2025-01-10T00:00:00Z',
    lastLoginAt: '2026-09-07T10:00:00Z',
  },
  ADMIN: {
    id: 'usr_adm_01',
    name: 'Anita Desai (Administrator)',
    email: 'admin.central@metrology.gov.in',
    role: 'ADMIN',
    department: 'Statutory National Informatics Directorate',
    badgeNumber: 'ADM-SYS-001',
    createdAt: '2024-06-01T00:00:00Z',
    lastLoginAt: '2026-09-07T08:30:00Z',
  },
  DEALER: {
    id: 'usr_dlr_01',
    name: 'Vikramaditya Singhania',
    email: 'compliance@apexnutrition.co.in',
    role: 'DEALER',
    department: 'Quality Assurance & Regulatory Affairs',
    organization: 'Apex Nutrition Consumer Ltd.',
    createdAt: '2025-04-15T00:00:00Z',
    lastLoginAt: '2026-09-07T11:15:00Z',
  },
  CONSUMER: {
    id: 'usr_cns_01',
    name: 'Public Consumer / Citizen',
    email: 'public.verifier@consumer.gov.in',
    role: 'CONSUMER',
    department: 'Public Verification Desk',
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-09-07T12:00:00Z',
  },
};

export interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  switchRole: (role: Role) => void;
  login: (role?: Role) => void;
  logout: () => void;
  canAccess: (route: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
