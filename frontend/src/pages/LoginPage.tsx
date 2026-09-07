import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Role, ROLE_DEFINITIONS } from '@/types/user';
import { ROUTES } from '@/constants/routes';
import { ShieldCheck, Lock, User as UserIcon, Check, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('LEGAL_METROLOGY_OFFICER');
  const [email, setEmail] = useState('officer.sharma@metrology.gov.in');
  const [password, setPassword] = useState('••••••••••••');

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (role === 'LEGAL_METROLOGY_OFFICER') setEmail('officer.sharma@metrology.gov.in');
    if (role === 'ADMIN') setEmail('admin.central@metrology.gov.in');
    if (role === 'DEALER') setEmail('compliance@apexnutrition.co.in');
    if (role === 'CONSUMER') setEmail('public.verifier@consumer.gov.in');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole);
    if (selectedRole === 'CONSUMER') {
      navigate(ROUTES.VERIFY);
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded bg-institutional-900 dark:bg-sky-500/20 text-white dark:text-sky-400 flex items-center justify-center border border-institutional-800 shadow-card">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Regulatory Compliance Portal
          </h2>
          <p className="text-2xs text-slate-500 font-mono uppercase tracking-wider">
            Statutory Legal Metrology &amp; FSSAI Verification Gateway
          </p>
        </div>

        {/* 1-Click Institutional Role Picker */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider">Select Authorized Role for Session</CardTitle>
            <CardDescription>Select an institutional role to experience role-aware views</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(ROLE_DEFINITIONS) as Role[]).map((rKey) => {
              const rDef = ROLE_DEFINITIONS[rKey];
              const isSelected = selectedRole === rKey;
              return (
                <div
                  key={rKey}
                  onClick={() => handleRoleSelect(rKey)}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-surface-muted ring-1 ring-primary'
                      : 'border-border hover:bg-surface-muted/50 bg-surface'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>{rDef.title}</span>
                    </div>
                    <p className="text-2xs text-slate-500 line-clamp-1">{rDef.description}</p>
                  </div>
                  {isSelected && <Check size={14} className="text-primary shrink-0 ml-2" />}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Credentials Form */}
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Official Email / Identifier
                </label>
                <div className="relative">
                  <UserIcon size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Security Passkey / Token
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <Button type="submit" size="md" variant="primary" className="w-full">
                Enter as {ROLE_DEFINITIONS[selectedRole].title} <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="p-3 border border-border rounded bg-surface-muted/50 text-2xs text-slate-500 text-center leading-relaxed">
          Statutory Notice: Role authorization controls the presentation of modules. The backend remains authoritative for authentication and access control.
        </div>
      </div>
    </div>
  );
};
