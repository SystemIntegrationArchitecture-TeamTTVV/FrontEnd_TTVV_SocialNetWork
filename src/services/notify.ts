import { toast } from 'react-hot-toast';

type NotifyType = 'success' | 'error' | 'info';

function show(type: NotifyType, message: string) {
  if (!message) return;
  const options = {
    duration: 4000,
    position: 'top-center' as const,
  };
  if (type === 'success') {
    toast.success(message, options);
    return;
  }
  if (type === 'error') {
    toast.error(message, options);
    return;
  }
  toast(message, options);
}

export const notify = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
};

