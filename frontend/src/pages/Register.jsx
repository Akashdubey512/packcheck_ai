import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Card, CardBody } from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Required-field validation only
    const errors = {};
    if (!name.trim()) {
      errors.name = "Full Name is required";
    }
    if (!email.trim()) {
      errors.email = "Email Address is required";
    }
    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[400px]">
        <Card className="shadow-card border-slate-200">
          <CardBody className="p-6 sm:p-8">
            {/* Branding Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-10 h-10 rounded-md bg-emerald-600 flex items-center justify-center text-white shadow-subtle mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-base font-bold tracking-wider text-slate-900 uppercase">
                NIRIKSHAN
              </h1>
              <p className="text-[10px] font-mono tracking-wider text-slate-500 uppercase mt-0.5">
                LEGAL METROLOGY · PACKAGED COMMODITIES
              </p>
            </div>

            {/* Section Heading */}
            <div className="border-t border-slate-100 pt-4 mb-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Create Officer Account
              </h2>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="register-name"
                label="Full Name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) {
                    setValidationErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                error={validationErrors.name}
                placeholder="Officer Name"
                disabled={loading}
              />

              <Input
                id="register-email"
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                error={validationErrors.email}
                placeholder="officer@example.com"
                disabled={loading}
              />

              <Input
                id="register-password"
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                error={validationErrors.password}
                placeholder="••••••••"
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                loading={loading}
                disabled={loading}
              >
                Create Account
              </Button>
            </form>

            {/* Understated Bottom Link */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-slate-900 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Sign in →
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
