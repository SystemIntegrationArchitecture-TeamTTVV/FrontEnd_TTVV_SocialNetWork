import React from 'react';
import { User, ExternalLink, X } from 'lucide-react';

interface ViewProfileModalProps {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ViewProfileModal({
  userName,
  onConfirm,
  onCancel,
}: ViewProfileModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-24 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="px-6 pb-6 text-center">
          <div className="relative -mt-12 mb-4 inline-block">
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#1a1d28] p-1 shadow-xl">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {userName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Bạn có muốn xem trang cá nhân của người này không?
          </p>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Xem trang cá nhân
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 px-4 bg-gray-100 dark:bg-[#242838] hover:bg-gray-200 dark:hover:bg-[#2d324a] text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all active:scale-[0.98]"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
