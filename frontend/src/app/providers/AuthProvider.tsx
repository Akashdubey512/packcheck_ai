import React, { useState, useEffect } from 'react';
import { User, Role, ROLE_DEFINITIONS } from '@/types/user';
import { AuthContext, DEMO_USERS } from './authContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default active role for institutional demo is Legal Metrology Officer
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return DEMO_USERS.LEGAL_METROLOGY_OFFICER;
  });

  const role: Role = currentUser?.role || 'CONSUMER';

  const switchRole = (newRole: Role) => {
    setCurrentUser(DEMO_USERS[newRole]);
  };

  const login = (targetRole: Role = 'LEGAL_METROLOGY_OFFICER') => {
    setCurrentUser(DEMO_USERS[targetRole]);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const canAccess = (route: string): boolean => {
    if (!currentUser) {
      // Unauthenticated / public access
      return route === '/' || route.startsWith('/verify') || route.startsWith('/login');
    }
    const def = ROLE_DEFINITIONS[currentUser.role];
    if (!def) return true;
    return def.accessibleRoutes.some((r) => route === r || (r !== '/' && route.startsWith(r)));
  };

  useEffect(() => {
    // Keep user state responsive to window title or session if needed
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        role,
        isAuthenticated: !!currentUser,
        switchRole,
        login,
        logout,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
