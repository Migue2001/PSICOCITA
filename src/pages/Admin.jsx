import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Shield, UserCog, Power, Save, Plus, Trash2 } from 'lucide-react';
import './Admin.css';

const roleLabels = {
  user: 'Interna',
  admin: 'Licenciada',
  super_admin: 'Super Admin'
};

export const Admin = () => {
  const { user, isDemoMode } = useAuth();
  const { schedule, saveSchedule } = useApp();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [scheduleForm, setScheduleForm] = useState({
    start_hour: schedule.start_hour,
    end_hour: schedule.end_hour,
    slot_minutes: schedule.slot_minutes,
    blocked_ranges: schedule.blocked_ranges || []
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    setScheduleForm({
      start_hour: schedule.start_hour,
      end_hour: schedule.end_hour,
      slot_minutes: schedule.slot_minutes,
      blocked_ranges: schedule.blocked_ranges || []
    });
  }, [schedule]);

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError('');

    if (!user) return;

    try {
      if (isDemoMode) {
        setProfiles([
          { id: 'mock-id-interna', email: 'interna@demo.com', role: 'user', created_at: new Date().toISOString(), is_active: true },
          { id: 'mock-id-licenciada', email: 'licenciada@demo.com', role: 'admin', created_at: new Date().toISOString(), is_active: true },
          { id: 'mock-id-super', email: 'super@demo.com', role: 'super_admin', created_at: new Date().toISOString(), is_active: true }
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,role,created_at,is_active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (profileId, newRole) => {
    if (profileId === user.id && user.role !== 'super_admin') {
      alert('No puedes cambiar tu propio rol.');
      return;
    }

    if (isDemoMode) {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (error) {
      alert('No se pudo actualizar el rol.');
      return;
    }
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
  };

  const handleToggleActive = async (profileId, isActive) => {
    if (profileId === user.id && !isActive) {
      alert('No puedes desactivar tu propia cuenta.');
      return;
    }

    if (isDemoMode) {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_active: isActive } : p));
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', profileId);

    if (error) {
      alert('No se pudo actualizar el estado.');
      return;
    }
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_active: isActive } : p));
  };

  const handleScheduleChange = (field, value) => {
    setScheduleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlockedChange = (index, field, value) => {
    setScheduleForm(prev => {
      const ranges = [...(prev.blocked_ranges || [])];
      ranges[index] = { ...ranges[index], [field]: value };
      return { ...prev, blocked_ranges: ranges };
    });
  };

  const addBlockedRange = () => {
    setScheduleForm(prev => ({
      ...prev,
      blocked_ranges: [...(prev.blocked_ranges || []), { start: '13:00', end: '14:00' }]
    }));
  };

  const removeBlockedRange = (index) => {
    setScheduleForm(prev => ({
      ...prev,
      blocked_ranges: prev.blocked_ranges.filter((_, i) => i !== index)
    }));
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSavingSchedule(true);
    const payload = {
      start_hour: Number(String(scheduleForm.start_hour).split(':')[0] || scheduleForm.start_hour) || 9,
      end_hour: Number(String(scheduleForm.end_hour).split(':')[0] || scheduleForm.end_hour) || 18,
      slot_minutes: Number(scheduleForm.slot_minutes) || 45,
      blocked_ranges: (scheduleForm.blocked_ranges || []).filter(r => r.start && r.end)
    };

    const { error } = await saveSchedule(payload);
    if (error) {
      alert('No se pudo guardar el horario.');
    }
    setSavingSchedule(false);
  };

  const canManage = useMemo(() => ['admin', 'super_admin'].includes(user?.role), [user]);

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="title-group">
          <Shield className="text-primary" size={28} />
          <div>
            <h1>Panel de Administración</h1>
            <p className="text-muted">Gestión de roles, usuarios y horarios.</p>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <UserCog size={18} /> Usuarios
            </h3>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-4 text-center text-muted">Cargando usuarios...</div>
            ) : error ? (
              <div className="error-alert">{error}</div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Registro</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id}>
                        <td>{p.email}</td>
                        <td>
                          <select
                            value={p.role}
                            onChange={(e) => handleRoleChange(p.id, e.target.value)}
                            disabled={!canManage || (p.id === user.id && user.role !== 'super_admin')}
                          >
                            {Object.keys(roleLabels).map((r) => (
                              <option key={r} value={r}>{roleLabels[r]}</option>
                            ))}
                          </select>
                        </td>
                        <td>{new Date(p.created_at).toLocaleString()}</td>
                        <td>
                          <span className={`status-pill ${p.is_active === false ? 'inactive' : 'active'}`}>
                            {p.is_active === false ? 'Inactivo' : 'Activo'}
                          </span>
                        </td>
                        <td className="actions">
                          <Button
                            variant={p.is_active === false ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleActive(p.id, !(p.is_active === false))}
                            disabled={!canManage}
                          >
                            <Power size={14} /> {p.is_active === false ? 'Reactivar' : 'Desactivar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield size={18} /> Horario de la Licenciada
            </h3>
          </CardHeader>
          <CardContent>
            <form className="schedule-form" onSubmit={handleSaveSchedule}>
              <div className="grid-2">
                <div>
                  <label className="input-label">Hora de inicio</label>
                  <input
                    type="time"
                    value={`${String(scheduleForm.start_hour).padStart(2, '0')}:00`}
                    onChange={(e) => handleScheduleChange('start_hour', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Hora de fin</label>
                  <input
                    type="time"
                    value={`${String(scheduleForm.end_hour).padStart(2, '0')}:00`}
                    onChange={(e) => handleScheduleChange('end_hour', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="input-label">Duración por cita (min)</label>
                  <Input
                    type="number"
                    min={15}
                    max={180}
                    value={scheduleForm.slot_minutes}
                    onChange={(e) => handleScheduleChange('slot_minutes', Number(e.target.value))}
                    fullWidth
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label">Bloques bloqueados (almuerzo u otros)</label>
                  <Button type="button" size="sm" variant="outline" onClick={addBlockedRange}>
                    <Plus size={14} /> Añadir bloque
                  </Button>
                </div>
                {(scheduleForm.blocked_ranges || []).length === 0 && (
                  <p className="text-muted text-sm">No hay bloques bloqueados.</p>
                )}
                <div className="blocked-list">
                  {(scheduleForm.blocked_ranges || []).map((range, index) => (
                    <div key={index} className="blocked-item">
                      <input
                        type="time"
                        value={range.start || '13:00'}
                        onChange={(e) => handleBlockedChange(index, 'start', e.target.value)}
                      />
                      <span>a</span>
                      <input
                        type="time"
                        value={range.end || '14:00'}
                        onChange={(e) => handleBlockedChange(index, 'end', e.target.value)}
                      />
                      <button type="button" className="icon-btn" onClick={() => removeBlockedRange(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <Button type="submit" loading={savingSchedule}>
                  <Save size={16} /> Guardar horario
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
