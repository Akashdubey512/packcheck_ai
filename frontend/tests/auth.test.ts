import { describe, it, expect } from 'vitest';
import { ROLE_DEFINITIONS, Role } from '../src/types/user';
import { DEMO_USERS } from '../src/app/providers/authContext';

describe('Role-Based Access Control & User Profiles', () => {
  const roles: Role[] = ['LEGAL_METROLOGY_OFFICER', 'ADMIN', 'DEALER', 'CONSUMER'];

  it('defines valid descriptors for all statutory roles', () => {
    roles.forEach((role) => {
      const def = ROLE_DEFINITIONS[role];
      expect(def).toBeDefined();
      expect(def.id).toBe(role);
      expect(def.title.length).toBeGreaterThan(0);
      expect(def.accessibleRoutes.length).toBeGreaterThan(0);
    });
  });

  it('provides complete demo user profiles with institutional credentials', () => {
    roles.forEach((role) => {
      const user = DEMO_USERS[role];
      expect(user).toBeDefined();
      expect(user.role).toBe(role);
      expect(user.email).toContain('@');
      expect(user.name.length).toBeGreaterThan(0);
      expect(user.department.length).toBeGreaterThan(0);
    });
  });

  describe('Permission routing rules', () => {
    function evaluateAccess(userRole: Role | null, targetRoute: string): boolean {
      if (!userRole) {
        return targetRoute === '/' || targetRoute.startsWith('/verify') || targetRoute.startsWith('/login');
      }
      const def = ROLE_DEFINITIONS[userRole];
      if (!def) return false;
      return def.accessibleRoutes.some((r) => targetRoute === r || (r !== '/' && targetRoute.startsWith(r)));
    }

    it('grants Legal Metrology Officer full compliance inspection route access', () => {
      const officerRole: Role = 'LEGAL_METROLOGY_OFFICER';
      expect(evaluateAccess(officerRole, '/dashboard')).toBe(true);
      expect(evaluateAccess(officerRole, '/scan')).toBe(true);
      expect(evaluateAccess(officerRole, '/history')).toBe(true);
      expect(evaluateAccess(officerRole, '/reports')).toBe(true);
      expect(evaluateAccess(officerRole, '/verify')).toBe(true);
      expect(evaluateAccess(officerRole, '/settings')).toBe(true);
    });

    it('restricts Consumer role to public verification and published reports', () => {
      const consumerRole: Role = 'CONSUMER';
      expect(evaluateAccess(consumerRole, '/verify')).toBe(true);
      expect(evaluateAccess(consumerRole, '/verify/MLK-882-A')).toBe(true);
      expect(evaluateAccess(consumerRole, '/reports')).toBe(true);
      expect(evaluateAccess(consumerRole, '/scan')).toBe(false);
      expect(evaluateAccess(consumerRole, '/history')).toBe(false);
      expect(evaluateAccess(consumerRole, '/settings')).toBe(false);
    });

    it('restricts Dealer role to verification and reports', () => {
      const dealerRole: Role = 'DEALER';
      expect(evaluateAccess(dealerRole, '/dashboard')).toBe(true);
      expect(evaluateAccess(dealerRole, '/verify')).toBe(true);
      expect(evaluateAccess(dealerRole, '/reports')).toBe(true);
      expect(evaluateAccess(dealerRole, '/scan')).toBe(false);
      expect(evaluateAccess(dealerRole, '/history')).toBe(false);
    });

    it('permits unauthenticated visitors only to public verification and login', () => {
      expect(evaluateAccess(null, '/verify')).toBe(true);
      expect(evaluateAccess(null, '/verify/LOT-2026-X89')).toBe(true);
      expect(evaluateAccess(null, '/login')).toBe(true);
      expect(evaluateAccess(null, '/scan')).toBe(false);
      expect(evaluateAccess(null, '/history')).toBe(false);
      expect(evaluateAccess(null, '/dashboard')).toBe(false);
    });
  });
});
