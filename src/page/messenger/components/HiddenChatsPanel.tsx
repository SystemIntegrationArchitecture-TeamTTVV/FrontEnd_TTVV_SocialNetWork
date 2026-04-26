// ─── HiddenChatsPanel — context menu, hidden conversations panel, unlock modal ──
import {
  EyeOff, X, Shield, Lock, Unlock, Users,
} from 'lucide-react';
import type { Conversation } from '../../../apis/conversations';

interface HiddenChatsPanelProps {
  // Context menu
  contextMenu: { x: number; y: number; convId: string } | null;
  onContextMenuAction: (convId: string) => void;
  // Hidden panel
  showHiddenPanel: boolean;
  hiddenConversations: Conversation[];
  hiddenLoading: boolean;
  onCloseHiddenPanel: () => void;
  onSelectHiddenConv: (conv: Conversation) => void;
  hashColor: (str: string) => string;
  userId?: string;
  // Unlock modal
  showUnlockModal: boolean;
  pendingUnlockConv: Conversation | null;
  unlockPin: string;
  onUnlockPinChange: (v: string) => void;
  unlockLoading: boolean;
  unlockError: string | null;
  onUnlockErrorChange: (v: string | null) => void;
  onUnlock: () => void;
  onCloseUnlockModal: () => void;
}

export default function HiddenChatsPanel({
  contextMenu,
  onContextMenuAction,
  showHiddenPanel,
  hiddenConversations,
  hiddenLoading,
  onCloseHiddenPanel,
  onSelectHiddenConv,
  hashColor,
  userId,
  showUnlockModal,
  pendingUnlockConv,
  unlockPin,
  onUnlockPinChange,
  unlockLoading,
  unlockError,
  onUnlockErrorChange,
  onUnlock,
  onCloseUnlockModal,
}: HiddenChatsPanelProps) {
  return (
    <>
      {/* ── Context Menu ────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 bg-white dark:bg-[#22263a] rounded-xl shadow-xl border border-gray-100 dark:border-white/5 py-1 animate-in fade-in zoom-in-95 duration-150"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 150), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onContextMenuAction(contextMenu.convId)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
          >
            <EyeOff className="w-4 h-4 text-amber-500" />
            Ẩn hội thoại
          </button>
        </div>
      )}

      {/* ── Hidden Conversations Panel ──────────────────────────────── */}
      {showHiddenPanel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseHiddenPanel} />
          {/* Panel */}
          <div className="relative w-full max-w-md mx-4 bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chat ẩn</h2>
                  <p className="text-xs text-gray-500">{hiddenConversations.length} hội thoại đang ẩn</p>
                </div>
              </div>
              <button onClick={onCloseHiddenPanel} className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* Panel Body */}
            <div className="max-h-[60vh] overflow-y-auto">
              {hiddenLoading ? (
                <div className="p-8 text-center text-gray-500">Đang tải...</div>
              ) : hiddenConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Không có hội thoại nào đang ẩn</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {hiddenConversations.map((conv) => {
                    const otherIdx = conv.participantIds?.findIndex((id) => id !== userId) ?? 0;
                    const name = conv.isGroup
                      ? conv.groupName || 'Group Chat'
                      : conv.participantNames?.[otherIdx] || 'Chat';
                    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <div
                        key={conv.id}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (conv.hiddenRequiresPin) {
                            onSelectHiddenConv(conv);
                          }
                        }}
                      >
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: hashColor(conv.id) }}>
                          {conv.isGroup ? <Users className="w-5 h-5 text-white" /> : initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Cần PIN để mở
                          </p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                            <Unlock className="w-4 h-4 text-amber-600" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Unlock PIN Modal ────────────────────────────────────────── */}
      {showUnlockModal && pendingUnlockConv && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCloseUnlockModal} />
          <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Mở khóa hội thoại</h3>
              <p className="text-sm text-gray-500 mb-5">Nhập PIN để xem hội thoại này</p>
              <input
                type="password"
                maxLength={6}
                value={unlockPin}
                onChange={(e) => { onUnlockPinChange(e.target.value.replace(/\D/g, '')); onUnlockErrorChange(null); }}
                placeholder="Nhập PIN (4-6 số)"
                className="w-full h-12 px-4 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-amber-400 dark:text-white transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && unlockPin.length >= 4) {
                    e.preventDefault();
                    onUnlock();
                  }
                }}
              />
              {unlockError && <p className="text-sm text-red-500 mt-2">{unlockError}</p>}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={onCloseUnlockModal}
                  className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button
                  disabled={unlockPin.length < 4 || unlockLoading}
                  onClick={onUnlock}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {unlockLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Unlock className="w-4 h-4" /> Mở khóa</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
