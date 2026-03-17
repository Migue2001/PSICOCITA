import React, { useState } from 'react';
import { Card, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Calendar, Mail, Lock } from 'lucide-react';
import './Login.css';

export const Register = () => {
  const { signUp, user, loading, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (isDemoMode) {
      setError('Registro deshabilitado en modo demo. Usa los correos demo existentes.');
      setIsLoading(false);
      return;
    }

    const { error: signupError } = await signUp(email, password);
    if (signupError) {
      setError(signupError.message || 'Error al registrarse');
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-pattern"></div>
      <div className="login-content animate-fade-in">
        <div className="login-brand">
          <Calendar size={48} className="brand-icon" />
          <h1>Crear Cuenta</h1>
          <p className="text-muted">Bienvenido a PsicoCita</p>
        </div>

        <Card className="login-card">
          <CardContent>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <Input
                id="email"
                type="email"
                label="Correo Electrónico"
                icon={Mail}
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />

              <Input
                id="password"
                type="password"
                label="Contraseña"
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                fullWidth
              />

              {error && <div className="error-alert">{error}</div>}

              <Button type="submit" fullWidth size="lg" loading={isLoading}>
                Crear cuenta
              </Button>
            </form>

            <p className="text-sm text-muted text-center mt-3">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </CardContent>
        </Card>

        <p className="login-footer text-xs text-muted">
          &copy; {new Date().getFullYear()} PsicoCita. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
