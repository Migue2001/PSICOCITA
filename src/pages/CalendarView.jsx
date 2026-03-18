import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { TimeBlockSelector } from '../components/TimeBlockSelector';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, startOfWeek, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Plus } from 'lucide-react';
import './CalendarView.css';
import { useToast } from '../components/toast';
import { ConfirmModal } from '../components/ConfirmModal';

export const CalendarView = () => {
  const { appointments, patients, addAppointment, addPatient, setPatients, cancelAppointment, schedule } = useApp();
  const { user, isDemoMode } = useAuth();
  
  const toast = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  
  // Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // Details Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [cancellingDelay, setCancellingDelay] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const onPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 5); // Max 5 results

  const handleSelectBlock = async (block) => {
    if (isRescheduling && selectedApp) {
      // Modo reagendar: cancelar la cita anterior y abrir modal con datos precargados
      await cancelAppointment(selectedApp.id);
      setSelectedBlock(block);
      setPatientSearch(selectedApp.patient?.full_name || '');
      setSelectedPatientId(selectedApp.patient_id);
      setAppointmentNotes(selectedApp.notes || '');
      setIsRescheduling(false);
      setSelectedApp(null);
      setIsModalOpen(true);
      setBookingError('');
      return;
    }
    setSelectedBlock(block);
    setIsModalOpen(true);
    setBookingError('');
    setPatientSearch('');
    setSelectedPatientId('');
    setAppointmentNotes('');
  };

  const handleSelectOccupied = (app) => {
    setSelectedApp(app);
    setIsDetailsOpen(true);
  };

  const handleCancelAppointment = async () => {
    setCancellingDelay(true);
    const { error } = await cancelAppointment(selectedApp.id);
    setCancellingDelay(false);
    setConfirmOpen(false);
    setIsDetailsOpen(false);
    setSelectedApp(null);
    if (error) {
      toast.error('No se pudo cancelar la cita.');
    } else {
      toast.success('Cita cancelada correctamente.');
    }
  };

  const handleReschedule = () => {
    // Cierra el modal de detalles y activa modo reagendar:
    // el próximo bloque que el usuario seleccione reemplazará la cita actual.
    setIsRescheduling(true);
    setIsDetailsOpen(false);
    toast.info('Selecciona el nuevo horario en el calendario.');
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedPatientId && !patientSearch) {
      setBookingError('Por favor selecciona o ingresa un paciente');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    let finalPatientId = selectedPatientId;

    // Si el usuario seleccionó "Crear paciente nuevo" o solo escribió sin seleccionar
    if ((!finalPatientId || finalPatientId === 'new') && patientSearch) {
      const { data: newPatData, error: patError } = await addPatient({
        full_name: patientSearch,
        phone: '',
        email: ''
      });
        
      if (patError) {
        setBookingError('Error al crear el nuevo paciente.');
        setBookingLoading(false);
        return;
      }
      finalPatientId = newPatData.id;
    }

    const newApp = {
      patient_id: finalPatientId,
      created_by: user?.id || 'unknown-user',
      start_time: selectedBlock.start.toISOString(),
      end_time: selectedBlock.end.toISOString(),
      status: 'scheduled',
      notes: appointmentNotes
    };

    const wasRescheduling = isRescheduling;
    const { error } = await addAppointment(newApp);
    
    setBookingLoading(false);
    
    if (error) {
      setBookingError('Error al guardar: Este horario ya no está disponible o hubo un problema de red.');
    } else {
      setIsModalOpen(false);
      toast.success(wasRescheduling ? 'Cita reagendada correctamente.' : 'Cita agendada correctamente.');
    }
  };

  return (
    <div className="calendar-layout">
      <div className="calendar-main animate-fade-in">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="text-primary" /> 
              {format(currentMonth, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
            </h2>
            <div className="flex gap-2">
              <button className="icon-btn" onClick={onPrevMonth}><ChevronLeft /></button>
              <button className="btn-today" onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }}>Hoy</button>
              <button className="icon-btn" onClick={onNextMonth}><ChevronRight /></button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="calendar-grid">
              {weekDays.map(day => (
                <div className="calendar-day-header" key={day}>{day}</div>
              ))}
              
              {days.map((day) => {
                const dayApps = appointments.filter(a => isSameDay(parseISO(a.start_time), day) && a.status !== 'cancelled');
                
                return (
                  <div 
                    key={day.toString()} 
                    className={`calendar-cell ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isSameDay(day, selectedDate) ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <span className="day-number">{format(day, "d")}</span>
                    {dayApps.length > 0 && (
                      <div className="day-indicators">
                        <div className={`indicator-dot ${dayApps.length >= 8 ? 'high' : 'low'}`}></div>
                        <span className="indicator-text d-none d-md-flex">{dayApps.length} citas</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="calendar-sidebar animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <Card className="h-full">
          <CardContent>
            <TimeBlockSelector 
              selectedDate={selectedDate} 
              appointments={appointments.filter(a => isSameDay(parseISO(a.start_time), selectedDate))}
              onSelectBlock={handleSelectBlock}
              onSelectOccupied={handleSelectOccupied}
              schedule={schedule}
            />
          </CardContent>
        </Card>
      </div>

      {/* Booking Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Agendar Cita"
      >
        {selectedBlock && (
          <form onSubmit={handleBookAppointment} className="flex flex-col gap-4">
            <div className="bg-primary-light p-3 rounded-md mb-2">
              <p className="font-semibold text-primary">
                {format(selectedBlock.start, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-xl font-bold">
                {format(selectedBlock.start, 'HH:mm')} - {format(selectedBlock.end, 'HH:mm')}
              </p>
            </div>

            <div className="form-group">
              <Input
                label="Buscar Paciente"
                placeholder="Nombre del paciente..."
                icon={User}
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setSelectedPatientId('');
                }}
                fullWidth
              />
              
              {/* Patient Search Results */}
              {patientSearch && !selectedPatientId && (
                <div className="search-results mt-1 border rounded-md max-h-40 overflow-y-auto">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(p => (
                      <div 
                        key={p.id} 
                        className="p-2 hover:bg-card-hover cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPatientSearch(p.full_name);
                        }}
                      >
                        <p className="font-medium">{p.full_name}</p>
                        <p className="text-xs text-muted">{p.phone || 'Sin teléfono'}</p>
                      </div>
                    ))
                  ) : (
                    <div 
                      className="p-3 text-sm flex items-center gap-2 cursor-pointer hover:bg-primary-light hover:bg-opacity-20 text-primary font-medium"
                      onClick={() => {
                        // Al hacer clic, simplemente dejamos el texto en el input
                        // El handler de submit creará el paciente si no hay ID
                        // Pero cerramos visualmente la búsqueda marcando el ID como "nuevo"
                        setSelectedPatientId('new'); 
                      }}
                    >
                      <Plus size={16} /> Crear paciente "{patientSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="text-sm font-medium mb-1 block">Notas (Opcional)</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-muted" />
                <textarea 
                  className="w-full border rounded-md p-2 pl-9 focus:border-primary outline-none"
                  rows="3"
                  placeholder="Motivo de la cita, recordatorios..."
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            {bookingError && (
              <div className="text-error text-sm bg-error-light p-2 rounded">
                {bookingError}
              </div>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={bookingLoading} disabled={!patientSearch}>
                Confirmar Cita
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Appointment Details Modal */}
      <Modal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
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
                onClick={() => setConfirmOpen(true)}
              >
                Cancelar Cita
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReschedule}
                >
                  Reagendar
                </Button>
                <Button type="button" onClick={() => setIsDetailsOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleCancelAppointment}
        title="Cancelar cita"
        message="¿Estás seguro de que deseas cancelar esta cita? Esta acción liberará el horario."
        confirmLabel="Sí, cancelar"
        danger
        loading={cancellingDelay}
      />
    </div>
  );
};
