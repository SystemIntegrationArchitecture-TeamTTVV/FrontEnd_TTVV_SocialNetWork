import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import { authApi } from '../apis/auth';

/**
 * Global listener for all friend-related socket events.
 * Mounted inside SocketProvider so it's always active when user is authenticated.
 * 
 * Listens for:
 * - FRIEND_REQUEST: Someone sent you a friend request
 * - FRIEND_ACCEPTED: Someone accepted your friend request
 * - FRIEND_REJECTED: Someone rejected your friend request
 * - FRIEND_CANCELLED: Someone cancelled their friend request to you
 * - FRIEND_REMOVED: Someone unfriended you
 */
export default function FriendSocketListener() {
  const { subscribe } = useSocket();
  const { t } = useTranslation();
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribe('NOTIFICATION', (event) => {
      if (event.type !== 'NOTIFICATION' || !event.data) return;

      const notification = event.data as {
        type?: string;
        actorName?: string;
        actorAvatar?: string;
        actorId?: string;
        content?: string;
      };

      const actorName = notification.actorName || t('friendToast.someone');

      switch (notification.type) {
        case 'FRIEND_REQUEST':
          toast(t('friendToast.requestReceived', { name: actorName }), {
            icon: '👋',
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#EFF6FF',
              color: '#1E40AF',
              border: '1px solid #BFDBFE',
              fontWeight: 500,
            },
          });
          break;

        case 'FRIEND_ACCEPTED':
          toast(t('friendToast.requestAccepted', { name: actorName }), {
            icon: '🎉',
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#F0FDF4',
              color: '#166534',
              border: '1px solid #BBF7D0',
              fontWeight: 500,
            },
          });
          break;

        case 'FRIEND_REJECTED':
          toast(t('friendToast.requestRejected', { name: actorName }), {
            icon: '😔',
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#FFF7ED',
              color: '#9A3412',
              border: '1px solid #FED7AA',
              fontWeight: 500,
            },
          });
          break;

        case 'FRIEND_CANCELLED':
          toast(t('friendToast.requestCancelled', { name: actorName }), {
            icon: '↩️',
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#FFFBEB',
              color: '#92400E',
              border: '1px solid #FDE68A',
              fontWeight: 500,
            },
          });
          break;

        case 'FRIEND_REMOVED':
          toast(t('friendToast.friendRemoved', { name: actorName }), {
            icon: '💔',
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FECACA',
              fontWeight: 500,
            },
          });
          break;
      }
    });

    return unsubscribe;
  }, [currentUser?.id, subscribe, t]);

  // This component renders nothing — it's purely a side-effect listener
  return null;
}
