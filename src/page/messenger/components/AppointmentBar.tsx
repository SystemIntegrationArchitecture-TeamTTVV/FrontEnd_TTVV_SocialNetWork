// ─── AppointmentBar — shows upcoming appointments under pinned bar (Zalo-style) ───
import { useEffect, useState } from 'react';
import { CalendarClock, X, ChevronDown, ChevronUp, MapPin, Users } from 'lucide-react';
import type { DisplayMessage } from '../../../hooks/useMessages';

interface AppointmentBarProps {
  /** All messages in the current chat (we filter APPOINTMENT type) */
  messages: DisplayMessage[];
  onScrollTo: (messageId: string) => void;
}

function formatCountdown(targetDate: string): string {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return 'Đã qua';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AppointmentBar({ messages, onScrollTo }: AppointmentBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  // Filter upcoming appointments (not past > 1 day)
  const appointments = messages.filter((m) => {
    if (m.type !== 'APPOINTMENT' || !m.appointmentTime) return false;
    const diff = new Date(m.appointmentTime).getTime() - Date.now();
    return diff > -86400000; // show up to 1 day after passed
  }).sort((a, b) =>
    new Date(a.appointmentTime!).getTime() - new Date(b.appointmentTime!).getTime()
  );

  // Countdown timer
  useEffect(() => {
    if (appointments.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30000); // every 30s
    return () => clearInterval(interval);
  }, [appointments.length]);

  if (appointments.length === 0) return null;

  const nearest = appointments[0];
  const isPast = new Date(nearest.appointmentTime!).getTime() < Date.now();

  return (
    <div className="border-b border-gray-100 bg-gradient-to-r from-violet-50/80 to-white">
      {/* Compact bar */}
      <div
        onClick={() => appointments.length > 1 ? setExpanded(!expanded) : onScrollTo(nearest.id)}
        className="px-4 py-2 flex items-center gap-2.5 cursor-pointer hover:bg-violet-50/60 transition-colors group"
      >
        <div className="flex items-center gap-1 shrink-0">
          <CalendarClock className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-[10px] font-bold text-violet-600 bg-violet-100 rounded-full w-4 h-4 flex items-center justify-center">
            {appointments.length}
          </span>
        </div>

        <div className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); onScrollTo(nearest.id); }}>
          <p className="text-[11px] font-semibold text-gray-600 truncate">
            📅 {nearest.appointmentTitle || 'Lịch hẹn'}
          </p>
          <p className="text-xs text-gray-700 truncate">
            {formatTime(nearest.appointmentTime!)}
            <span className={`ml-1.5 font-semibold ${isPast ? 'text-gray-400' : 'text-violet-500'}`}>
              {isPast ? '(Đã qua)' : `· còn ${formatCountdown(nearest.appointmentTime!)}`}
            </span>
          </p>
        </div>

        {appointments.length > 1 && (
          <div className="shrink-0">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Expanded list */}
      {expanded && (
        <div className="px-4 pb-2 space-y-1.5 max-h-40 overflow-y-auto">
          {appointments.map((appt) => {
            const past = new Date(appt.appointmentTime!).getTime() < Date.now();
            return (
              <div
                key={appt.id}
                onClick={() => onScrollTo(appt.id)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer hover:bg-violet-50 transition-colors ${
                  past ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-violet-100'
                }`}
              >
                <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${past ? 'text-gray-400' : 'text-violet-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate font-medium">
                    {appt.appointmentTitle || 'Lịch hẹn'}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{formatTime(appt.appointmentTime!)}</span>
                    {appt.appointmentLocation && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {appt.appointmentLocation}
                      </span>
                    )}
                    {appt.appointmentParticipants && appt.appointmentParticipants.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {appt.appointmentParticipants.length}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold shrink-0 ${past ? 'text-gray-400' : 'text-violet-500'}`}>
                  {past ? 'Đã qua' : formatCountdown(appt.appointmentTime!)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
