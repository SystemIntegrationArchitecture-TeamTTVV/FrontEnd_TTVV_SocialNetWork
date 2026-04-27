import { useState } from 'react';
import { messagesApi, type Message } from '../../../apis/messages';
import { notify } from '../../../services/notify';
import type { AppointmentFormData } from '../components/CreateAppointmentModal';

interface UseGroupAppointmentsProps {
  conversationId: string;
  userId?: string;
  loadMessages: (convId: string) => void;
}

export function useGroupAppointments({ conversationId, userId, loadMessages }: UseGroupAppointmentsProps) {
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [joiningAppointmentId, setJoiningAppointmentId] = useState<string | null>(null);

  const handleCreateAppointment = async (form: AppointmentFormData) => {
    if (!userId) return;
    
    setCreatingAppointment(true);
    try {
      await messagesApi.createAppointment(conversationId, {
        userId,
        title: form.title,
        time: form.time,
        location: form.location,
        description: form.description,
      });
      setIsCreateAppointmentOpen(false);
      loadMessages(conversationId);
      notify.success('Đã lên lịch hẹn thành công!');
    } catch (err) {
      console.error('Failed to create appointment', err);
      notify.error('Không thể tạo lịch hẹn.');
    } finally {
      setCreatingAppointment(false);
    }
  };

  const handleJoinAppointment = async (messageId: string) => {
    if (!userId) return;
    if (joiningAppointmentId) return;

    setJoiningAppointmentId(messageId);
    try {
      await messagesApi.joinAppointment(messageId, { userId });
      loadMessages(conversationId);
    } catch (err) {
      console.error('Failed to join appointment', err);
      notify.error('Lỗi khi tham gia lịch hẹn.');
    } finally {
      setJoiningAppointmentId(null);
    }
  };

  return {
    isCreateAppointmentOpen,
    setIsCreateAppointmentOpen,
    creatingAppointment,
    joiningAppointmentId,
    handleCreateAppointment,
    handleJoinAppointment,
  };
}
