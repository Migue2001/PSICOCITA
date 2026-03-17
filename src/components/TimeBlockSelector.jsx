import React from 'react';
import { format, addMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X } from 'lucide-react';
import './TimeBlockSelector.css';

export const TimeBlockSelector = ({ selectedDate, appointments = [], onSelectBlock, onSelectOccupied, schedule }) => {
  const startHour = schedule?.start_hour ?? 9;
  const endHour = schedule?.end_hour ?? 18;
  const blockMinutes = schedule?.slot_minutes ?? 45;
  const blocked = schedule?.blocked_ranges || [];

  const generateBlocks = () => {
    const blocks = [];
    const dayStart = new Date(selectedDate);
    dayStart.setHours(startHour, 0, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, 0, 0, 0);

    let current = dayStart;
    let guard = 0;

    while (current < endTime && guard < 200) {
      guard++;
      const blockEnd = addMinutes(current, blockMinutes);
      if (blockEnd > endTime) break;

      blocks.push({ start: new Date(current), end: new Date(blockEnd) });
      current = new Date(blockEnd);
    }
    return blocks;
  };

  const isBlockedRange = (blockStart, blockEnd) => {
    return blocked.some(range => {
      const [sHour, sMin] = (range.start || '00:00').split(':').map(Number);
      const [eHour, eMin] = (range.end || '00:00').split(':').map(Number);
      const startRange = new Date(blockStart);
      startRange.setHours(sHour || 0, sMin || 0, 0, 0);
      const endRange = new Date(blockStart);
      endRange.setHours(eHour || 0, eMin || 0, 0, 0);
      return blockStart < endRange && blockEnd > startRange;
    });
  };

  const blocks = selectedDate ? generateBlocks() : [];

  const getOccupyingAppointment = (blockStart, blockEnd) => {
    return appointments.find(app => {
      if (app.status === 'cancelled') return false;
      const appStart = parseISO(app.start_time);
      const appEnd = parseISO(app.end_time);
      return blockStart < appEnd && blockEnd > appStart;
    });
  };

  if (!selectedDate) {
    return <div className="p-4 text-center text-muted">Selecciona un día en el calendario</div>;
  }

  if (startHour >= endHour) {
    return <div className="p-4 text-center text-muted">Revisa tu horario: la hora de inicio debe ser menor que la hora de fin.</div>;
  }

  return (
    <div className="time-block-selector">
      <h3 className="block-title">
        Horarios para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
      </h3>
      
      <div className="blocks-grid">
        {blocks.map((block, i) => {
          const occupiedApp = getOccupyingAppointment(block.start, block.end);
          const isPast = block.start < new Date();
          const isBlocked = isBlockedRange(block.start, block.end);
          const disabled = (!occupiedApp && isPast) || isBlocked;

          const firstName = occupiedApp?.patient?.full_name?.split(' ')[0] || 'Cita';

          return (
            <button
              key={i}
              className={`time-block ${occupiedApp ? 'occupied cursor-pointer' : isBlocked ? 'blocked' : 'available'} ${isPast && !occupiedApp ? 'past' : ''}`}
              disabled={disabled}
              onClick={() => {
                if (occupiedApp) {
                  onSelectOccupied && onSelectOccupied(occupiedApp);
                } else if (!disabled) {
                  onSelectBlock(block);
                }
              }}
            >
              <div className="block-time">
                {format(block.start, 'HH:mm')} - {format(block.end, 'HH:mm')}
              </div>
              <div className="block-status">
                {occupiedApp ? (
                  <><X size={14} /> {firstName}</>
                ) : isBlocked ? (
                  'Bloqueado'
                ) : isPast ? (
                  'No Disponible'
                ) : (
                  <><Check size={14} /> Disponible</>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
