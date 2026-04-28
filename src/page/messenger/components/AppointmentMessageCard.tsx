import { Calendar, MapPin, Users, CheckCircle2, Clock } from 'lucide-react';
import type { Message } from '../../../apis/messages';

interface AppointmentMessageCardProps {
  msg: Message;
  isMe: boolean;
  userId: string;
  onJoin: (messageId: string) => void;
  joining?: boolean;
  participantNames?: string[];
  participantIds?: string[];
}

function formatAppointmentTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AppointmentMessageCard({
  msg,
  isMe,
  userId,
  onJoin,
  joining = false,
  participantNames = [],
  participantIds = [],
}: AppointmentMessageCardProps) {
  const participants = msg.appointmentParticipants || [];
  const isJoined = participants.includes(userId);
  const timeStr = msg.appointmentTime ? formatAppointmentTime(msg.appointmentTime) : 'Chưa xác định';
  
  const getParticipantNames = () => {
    return participants.map(pid => {
      const idx = participantIds.indexOf(pid);
      return idx >= 0 ? participantNames[idx] : pid;
    });
  };

  const resolvedParticipants = getParticipantNames();

  return (
    <div className="flex justify-center my-3">
      <div className="w-[450px] max-w-full flex flex-col items-center">
        {/* Sender name for others */}
        {!isMe && (
          <span className="text-xs text-gray-500 mb-1 ml-1 self-start">
            {(() => {
              const idx = participantIds.indexOf(msg.senderId);
              return idx >= 0 ? participantNames[idx] : (msg.senderName || msg.senderId);
            })()}
          </span>
        )}

        <div className={`w-full rounded-2xl border overflow-hidden shadow-sm flex flex-col ${
          isMe ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-200'
        }`}>
          {/* Header Banner */}
          <div className="bg-emerald-500 px-4 py-2.5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Lịch hẹn mới</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Title & Description */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {msg.appointmentTitle || 'Cuộc hẹn chưa có tên'}
              </h3>
              {msg.content && (
                <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-line leading-relaxed">
                  {msg.content}
                </p>
              )}
            </div>

            {/* Details Grid */}
            <div className="space-y-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase">Thời gian</p>
                  <p className="text-sm font-medium text-gray-800">{timeStr}</p>
                </div>
              </div>

              {msg.appointmentLocation && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Địa điểm</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{msg.appointmentLocation}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase">Tham gia ({participants.length})</p>
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {resolvedParticipants.length > 0 
                      ? resolvedParticipants.join(', ') 
                      : 'Chưa có ai tham gia'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onJoin(msg.id)}
              disabled={joining}
              className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-sm ${
                isJoined
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]'
              } disabled:opacity-50 disabled:scale-100`}
            >
              {joining ? (
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isJoined ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Đã tham gia
                </>
              ) : (
                'Tham gia ngay'
              )}
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 mt-1 self-center uppercase font-medium">
          Đã lên lịch lúc {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
