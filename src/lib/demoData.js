import { addDays, subDays, setHours, setMinutes } from 'date-fns';

const today = new Date();

export const demoPatients = [
  {
    id: 'pat-1',
    full_name: 'Carlos Mendoza',
    phone: '555-0100',
    email: 'carlos.m@example.com',
    reason: 'Ansiedad generalizada',
    basic_history: 'Paciente reporta ataques de pánico desde hace 3 meses.',
    created_at: subDays(today, 30).toISOString(),
  },
  {
    id: 'pat-2',
    full_name: 'Lucía Fernández',
    phone: '555-0200',
    email: 'lucia.f@example.com',
    reason: 'Terapia de pareja',
    basic_history: 'Problemas de comunicación con su esposo.',
    created_at: subDays(today, 15).toISOString(),
  },
  {
    id: 'pat-3',
    full_name: 'Roberto Salas',
    phone: '555-0300',
    email: 'roberto.s@example.com',
    reason: 'Trastorno depresivo leve',
    basic_history: 'Derivado por médico general.',
    created_at: subDays(today, 5).toISOString(),
  }
];

// Helper to create date relative to today with specific hour/minute
const createDate = (daysOffset, hours, minutes) => {
  const d = addDays(today, daysOffset);
  return setMinutes(setHours(d, hours), minutes).toISOString();
};

export const demoAppointments = [
  {
    id: 'app-1',
    patient_id: 'pat-1',
    created_by: 'mock-id-interna',
    start_time: createDate(0, 10, 0),
    end_time: createDate(0, 10, 45),
    status: 'scheduled',
    notes: 'Confirmado por WhatsApp',
    patient: demoPatients[0]
  },
  {
    id: 'app-2',
    patient_id: 'pat-2',
    created_by: 'mock-id-interna',
    start_time: createDate(0, 11, 30),
    end_time: createDate(0, 12, 15),
    status: 'scheduled',
    notes: '',
    patient: demoPatients[1]
  },
  {
    id: 'app-3',
    patient_id: 'pat-3',
    created_by: 'mock-id-interna',
    start_time: createDate(1, 15, 0),
    end_time: createDate(1, 15, 45),
    status: 'scheduled',
    notes: 'Primera sesión',
    patient: demoPatients[2]
  },
  {
    id: 'app-4',
    patient_id: 'pat-1',
    created_by: 'mock-id-interna',
    start_time: createDate(-7, 10, 0),
    end_time: createDate(-7, 10, 45),
    status: 'completed',
    notes: 'Asistió puntualmente',
    patient: demoPatients[0]
  }
];

export const demoNotifications = [
  {
    id: 'not-1',
    title: 'Nueva cita agendada',
    message: 'Carlos Mendoza ha sido agendado para hoy a las 10:00',
    type: 'appointment',
    is_read: false,
    created_at: createDate(0, 8, 30)
  },
  {
    id: 'not-2',
    title: 'Cita cancelada',
    message: 'Lucía Fernández canceló su cita de mañana',
    type: 'cancellation',
    is_read: true,
    created_at: createDate(-1, 14, 20)
  }
];

export const demoObservations = [
  {
    id: 'obs-1',
    patient_id: 'pat-1',
    appointment_id: 'app-4',
    observation: 'El paciente muestra signos de mejoría con las técnicas de respiración. Se recomienda mantener registro diario de ataques.',
    created_by: 'mock-id-licenciada',
    created_at: createDate(-7, 11, 0)
  }
];
