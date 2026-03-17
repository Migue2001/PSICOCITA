import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { format, isSameDay, parseISO, addDays, subDays, isToday as dateFnsIsToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Users, Calendar as CalendarIcon, Clock, ChevronRight, ChevronLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export const Dashboard = () => {
  const { appointments, fetchData, loading, cancelAppointment, schedule } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Details Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [cancellingDelay, setCancellingDelay] = useState(false);

  useEffect(() => {
    // We keep fetching the fresh data just in case this is the first load
    // but the context Realtime channel and addAppointment handles updates
    fetchData();
  }, []);

  const onPrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const onNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const isSelectedToday = dateFnsIsToday(selectedDate);
  
  const handleSelectApp = (app) => {
    setSelectedApp(app);
    setIsDetailsOpen(true);
  };

  const handleCancelAppointment = async () => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta cita? Esta acción liberará el horario.')) {
      setCancellingDelay(true);
      await cancelAppointment(selectedApp.id);
      setCancellingDelay(false);
      setIsDetailsOpen(false);
      setSelectedApp(null);
    }
  };

  const dayApps = appointments
    .filter(a => a.status !== 'cancelled' && isSameDay(parseISO(a.start_time), selectedDate))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
  // If viewing past/future/today days, show all appointments for the day up to 10
  const nextApps = dayApps.slice(0, 10);
    
  const completedCount = dayApps.filter(a => a.status === 'completed').length;

  if (loading) {
    return <div className="flex justify-center p-8"><span className="loader" style={{borderColor: 'var(--color-primary)'}}></span></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header flex-col md:flex-row gap-4">
        <div className="flex items-center gap-4">
          <button className="icon-btn hover:bg-gray-200 p-2 rounded-full" onClick={onPrevDay}>
            <ChevronLeft size={20} />
          </button>
          <div className="text-center md:text-left min-w-[200px]">
            <h1 className="text-2xl font-bold">
              {isSelectedToday ? 'Resumen de Hoy' : 'Resumen Diario'}
            </h1>
            <p className="text-muted capitalize">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}</p>
          </div>
          <button className="icon-btn hover:bg-gray-200 p-2 rounded-full" onClick={onNextDay}>
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
          {!isSelectedToday && (
            <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
              Ir a Hoy
            </Button>
          )}
          {user?.role === 'user' && (
            <Button onClick={() => navigate('/calendar')} icon={<Plus size={18} />}>
              <Plus size={18} /> Nueva Cita
            </Button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-4">
            <div className="stat-icon bg-primary-light">
              <CalendarIcon size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">Citas Programadas</p>
              <h2 className="text-2xl font-bold">{dayApps.length}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardContent className="flex items-center gap-4">
            <div className="stat-icon bg-success-light">
              <Clock size={24} className="text-success" />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">Completadas</p>
              <h2 className="text-2xl font-bold">{completedCount}</h2>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stat-card cursor-pointer hoverable" onClick={() => navigate('/patients')}>
          <CardContent className="flex items-center gap-4">
            <div className="stat-icon bg-info-light">
              <Users size={24} className="text-info" />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">Pacientes</p>
              <h2 className="text-2xl font-bold">Total</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-content">
        <Card className="upcoming-appointments">
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock size={20} className="text-primary" /> 
              Agenda del Día
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
              Ver Calendario <ChevronRight size={16} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {nextApps.length > 0 ? (
              <div className="appointment-list">
                {nextApps.map(app => (
                  <div key={app.id} className="appointment-item cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSelectApp(app)}>
                    <div className="app-time">
                      <span className="time-text">{format(parseISO(app.start_time), 'HH:mm')}</span>
                      <span className="time-duration">{schedule?.slot_minutes || 45} min</span>
                    </div>
                    <div className="app-details">
                      <h4 className="font-semibold">{app.patient?.full_name || 'Paciente'}</h4>
                      <p className="text-sm text-muted">{app.notes || 'Consulta regular'}</p>
                    </div>
                    <div className="app-status">
                      <Badge variant="primary">Ver Detalles</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CalendarIcon size={48} className="text-muted opacity-50 mb-3" />
                <p className="text-muted">No hay más citas programadas para este momento.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      {/* Appointment Details Modal */}
      <Modal 
        isOpen={isDetailsOpen && !!selectedApp} 
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedApp(null);
        }} 
        title="Detalles de la Cita"
      >
        {selectedApp && (
          <div className="flex flex-col gap-4">
            <div className="bg-primary-light p-3 rounded-md mb-2">
              <p className="font-semibold text-primary">
                {format(parseISO(selectedApp.start_time), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-xl font-bold">
                {format(parseISO(selectedApp.start_time), 'HH:mm')} - {format(parseISO(selectedApp.end_time), 'HH:mm')}
              </p>
            </div>

            <div className="form-group border-b pb-3">
              <label className="text-sm font-medium mb-1 block text-muted">Paciente</label>
              <p className="font-semibold text-lg flex items-center gap-2">
                <User size={18} className="text-primary" />
                {selectedApp.patient?.full_name || 'Paciente Desconocido'}
              </p>
              <p className="text-sm text-muted mt-1">
                {selectedApp.patient?.phone ? `Tel: ${selectedApp.patient.phone}` : 'Sin teléfono registrado'}
              </p>
            </div>

            <div className="form-group">
              <label className="text-sm font-medium mb-1 block text-muted">Notas de la Cita</label>
              <p className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap">
                {selectedApp.notes || 'Ninguna nota agregada.'}
              </p>
            </div>

            <div className="flex gap-2 justify-between mt-4">
              <Button 
                type="button" 
                variant="outline"
                className="text-error border-error hover:bg-error-light"
                onClick={handleCancelAppointment}
                disabled={cancellingDelay}
              >
                {cancellingDelay ? 'Cancelando...' : 'Cancelar Cita'}
              </Button>

              <Button type="button" onClick={() => {
                setIsDetailsOpen(false);
                setSelectedApp(null);
              }}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
