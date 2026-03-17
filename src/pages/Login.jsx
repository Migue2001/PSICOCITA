import React, { useState } from 'react';
import { Card, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Calendar, Mail, Lock } from 'lucide-react';
import './Login.css';

export const Login = () => {
  const { signIn, user, loading, isDemoMode } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirigir si ya está logeado
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isDemoMode && !['interna@demo.com', 'licenciada@demo.com', 'super@demo.com'].includes(email)) {
        setError('En modo demo usa interna@demo.com, licenciada@demo.com o super@demo.com');
        setIsLoading(false);
        return;
      }

      const { error: authError } = await signIn(email, password);
      
      if (authError) {
        setError(authError.message || 'Error de autenticación');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemo = (type) => {
    setEmail(`${type}@demo.com`);
    setPassword('demo1234');
  };

  return (
    <div className="login-container">
      <div className="login-pattern"></div>
      
      <div className="login-content animate-fade-in">
        <div className="login-brand">
          <Calendar size={48} className="brand-icon" />
          <h1>PsicoCita</h1>
          <p className="text-muted">Gestión de Agendas Psicológicas</p>
        </div>

        <Card className="login-card">
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                fullWidth
              />

              {error && (
                <div className="error-alert">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                fullWidth 
                size="lg" 
                loading={isLoading}
              >
                Iniciar Sesión
              </Button>
            </form>

            {isDemoMode && (
              <div className="demo-section">
                <p className="demo-title">
                  <span className="badge badge-warning">Modo Demo Activo</span>
                </p>
                <p className="text-xs text-muted mb-2 text-center">Selecciona un rol para probar:</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" fullWidth onClick={() => autofillDemo('interna')}>
                    Interna
                  </Button>
                  <Button variant="outline" size="sm" fullWidth onClick={() => autofillDemo('licenciada')}>
                    Licenciada
                  </Button>
                  <Button variant="outline" size="sm" fullWidth onClick={() => autofillDemo('super')}>
                    Super Admin
                  </Button>
                </div>
              </div>
            )}

            {!isDemoMode && (
              <p className="text-sm text-muted text-center mt-3">
                ¿No tienes cuenta? <Link to="/register">Crear una cuenta</Link>
              </p>
            )}
          </CardContent>
        </Card>
        
        <p className="login-footer text-xs text-muted">
          &copy; {new Date().getFullYear()} PsicoCita. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
