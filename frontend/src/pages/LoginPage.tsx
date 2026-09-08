import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Role, ROLE_DEFINITIONS } from '@/types/user';
import { ROUTES } from '@/constants/routes';
import { ShieldCheck, Lock, User as UserIcon, Check, ArrowRight, Sparkles } from 'lucide-react';
import { staggerContainer, staggerItem, butterSpring, gpuAcceleratedStyle } from '@/animations/motion';

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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background radial ambient lights for depth */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={gpuAcceleratedStyle}
        className="w-full max-w-md space-y-6 z-10"
      >
        {/* Brand Header */}
        <motion.div variants={staggerItem} className="flex flex-col items-center text-center space-y-2">
          <motion.div
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
            transition={butterSpring}
            className="h-14 w-14 rounded-xl bg-institutional-900 dark:bg-sky-500/20 text-white dark:text-sky-400 flex items-center justify-center border border-institutional-800 shadow-lg relative"
          >
            <ShieldCheck size={32} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
            </span>
          </motion.div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Regulatory Compliance Portal
          </h2>
          <p className="text-2xs text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} className="text-primary" /> Statutory Legal Metrology &amp; FSSAI Gateway
          </p>
        </motion.div>

        {/* 1-Click Institutional Role Picker */}
        <motion.div variants={staggerItem}>
          <Card className="border border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider">Select Authorized Role for Session</CardTitle>
              <CardDescription>Select an institutional role to experience role-aware views</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(ROLE_DEFINITIONS) as Role[]).map((rKey) => {
                const rDef = ROLE_DEFINITIONS[rKey];
                const isSelected = selectedRole === rKey;
                return (
                  <motion.div
                    key={rKey}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.99 }}
                    transition={butterSpring}
                    onClick={() => handleRoleSelect(rKey)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between relative overflow-hidden ${
                      isSelected
                        ? 'border-primary bg-surface-muted text-foreground'
                        : 'border-border hover:bg-surface-muted/50 bg-surface text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeLoginRolePill"
                        transition={butterSpring}
                        className="absolute inset-0 bg-primary/10 border-l-4 border-primary pointer-events-none rounded-lg"
                      />
                    )}
                    <div className="space-y-0.5 relative z-10">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>{rDef.title}</span>
                      </div>
                      <p className="text-2xs text-slate-500 line-clamp-1">{rDef.description}</p>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-primary shrink-0 ml-2 relative z-10 font-bold" />
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Credentials Form */}
        <motion.div variants={staggerItem}>
          <Card className="border border-border shadow-card">
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
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
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
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
                    />
                  </div>
                </div>

                <Button type="submit" size="md" variant="primary" className="w-full font-medium">
                  Enter as {ROLE_DEFINITIONS[selectedRole].title} <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          variants={staggerItem}
          className="p-3 border border-border rounded-lg bg-surface-muted/50 text-2xs text-slate-500 text-center leading-relaxed"
        >
          Statutory Notice: Role authorization controls the presentation of modules. The backend remains authoritative for authentication and access control.
        </motion.div>
      </motion.div>
    </div>
  );
};

