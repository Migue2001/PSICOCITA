import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/Card';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { Search, Plus, Phone, Mail, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const Patients = () => {
  const { patients, appointments, addPatient } = useApp();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) || 
    (p.phone && p.phone.includes(search))
  );

  const getPatientLastAppointment = (patientId) => {
    const apps = appointments
      .filter(a => a.patient_id === patientId && a.status === 'completed')
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    return apps.length > 0 ? apps[0].start_time : null;
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientName) {
      setErrorMsg('El nombre del paciente es obligatorio.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const { error, data } = await addPatient({
      full_name: newPatientName,
      phone: newPatientPhone,
      email: newPatientEmail
    });

    setIsSaving(false);

    if (error) {
      setErrorMsg('Error al guardar el paciente.');
    } else {
      setIsModalOpen(false);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientEmail('');
      // Navigate to the newly created patient profile
      if (data && data.id) {
        navigate(`/patients/${data.id}`);
      }
    }
  };

  return (
    <div className="patients-container animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-muted text-sm">Gestiona el directorio de pacientes ({patients.length})</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>
          <Plus size={18} /> Nuevo Paciente
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <Input 
            icon={Search}
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            className="mb-0"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {filteredPatients.map(patient => {
          const lastAppDate = getPatientLastAppointment(patient.id);
          
          return (
            <Card key={patient.id} className="hoverable cursor-pointer" onClick={() => navigate(`/patients/${patient.id}`)}>
              <CardContent className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">{patient.full_name}</h3>
                  <div className="flex flex-col gap-1 mb-4 text-sm text-muted">
                    {patient.phone ? (
                      <span className="flex items-center gap-2"><Phone size={14} /> {patient.phone}</span>
                    ) : null}
                    {patient.email ? (
                      <span className="flex items-center gap-2"><Mail size={14} /> {patient.email}</span>
                    ) : null}
                  </div>
                </div>
                
                <div className="border-t pt-3 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    {lastAppDate 
                      ? `Última visita: ${format(parseISO(lastAppDate), "d MMM yyyy", { locale: es })}` 
                      : 'Sin visitas previas'}
                  </span>
                  <ChevronRight size={16} className="text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No se encontraron pacientes que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Nuevo Paciente"
      >
        <form onSubmit={handleCreatePatient} className="flex flex-col gap-4">
          <Input 
            label="Nombre Completo *"
            placeholder="Ej. Juan Pérez"
            value={newPatientName}
            onChange={(e) => setNewPatientName(e.target.value)}
            fullWidth
            required
          />
          <Input 
            label="Teléfono (Opcional)"
            placeholder="Ej. +51 987 654 321"
            value={newPatientPhone}
            onChange={(e) => setNewPatientPhone(e.target.value)}
            fullWidth
          />
          <Input 
            label="Correo Electrónico (Opcional)"
            placeholder="Ej. juan@correo.com"
            type="email"
            value={newPatientEmail}
            onChange={(e) => setNewPatientEmail(e.target.value)}
            fullWidth
          />

          {errorMsg && (
            <div className="text-error text-sm bg-error-light p-2 rounded">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              Guardar Paciente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


