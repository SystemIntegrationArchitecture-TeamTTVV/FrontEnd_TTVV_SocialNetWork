import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Bell, BellOff, Search as SearchIcon, Trash2, X,
  Palette, Smile, Lock, ShieldOff, Flag, Pencil,
  Mail, Phone, MapPin, Briefcase, GraduationCap, FileText,
  Circle, Loader2,
} from 'lucide-react';
import { usersApi, type User as UserType } from '../../../apis/users';
import { conversationsApi } from '../../../apis/conversations';
import { reportsApi } from '../../../apis/reports';
import { messagesApi, type Message } from '../../../apis/messages';
import { uploadApi } from '../../../apis/upload';
import { useSocket } from '../../../contexts/SocketContext';
import { notify } from '../../../services/notify';
import { LargeBeachPlaceholder, LargeSunPlaceholder, LargePartyPlaceholder } from '../../../common/icons/IconComponents';
import type { Conversation } from '../../../apis/conversations';

interface DirectChatSidebarProps {
  conversation: {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
    color: string;
  };
  conversationRaw: Conversation | null;
  onClearConversationForMe: () => void;
  onShowSearch: () => void;
  onCloseRightSidebar: () => void;
  userId?: string;
}

export default function DirectChatSidebar({
  conversation,
  conversationRaw,
  onClearConversationForMe,
  onShowSearch,
  onCloseRightSidebar,
  userId,
}: DirectChatSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { subscribe } = useSocket();

  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(conversation.online);
  
  // New States
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [updatingNickname, setUpdatingNickname] = useState(false);
  const [mediaMessages, setMediaMessages] = useState<Message[]>([]);
  
  // To update UI instantly if needed (though we rely on parent/socket mostly, 
  // local state gives immediate feedback)
  const [localNickname, setLocalNickname] = useState(conversation.name);

  // Compute other user ID
  const otherUserId = conversationRaw?.participantIds?.find(id => id !== userId) || '';

  // ── Fetch other user profile ──
  useEffect(() => {
    if (!otherUserId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    usersApi.getUserById(otherUserId)
      .then(user => {
        if (!cancelled) setOtherUser(user);
      })
      .catch(err => console.warn('Failed to fetch user info:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [otherUserId]);

  // ── Fetch Media Messages ──
  useEffect(() => {
    if (!conversationRaw?.id || !userId) return;
    let cancelled = false;
    
    messagesApi.getMediaMessages(conversationRaw.id, userId)
      .then(messages => {
        if (!cancelled) setMediaMessages(messages);
      })
      .catch(err => console.warn('Failed to fetch media:', err));
      
    return () => { cancelled = true; };
  }, [conversationRaw?.id, userId]);

  // ── Realtime presence updates via socket ──
  useEffect(() => {
    if (!otherUserId) return;
    const unsub = subscribe('USER_PRESENCE_CHANGED', (event: any) => {
      const data = event?.data;
      if (data?.userId === otherUserId) {
        setOnlineStatus(!!data.online);
      }
    });
    return unsub;
  }, [otherUserId, subscribe]);

  // ── Realtime: listen for block status changes ──
  useEffect(() => {
    if (!conversationRaw?.id) return;
    const unsub = subscribe('CONVERSATION_META_UPDATED', (event: any) => {
      const data = event?.data;
      if (data?.conversationId === conversationRaw.id) {
        // Refresh conversation data
      }
    });
    return unsub;
  }, [conversationRaw?.id, subscribe]);

  // ── Mute toggle ──
  const handleToggleMute = async () => {
    if (!conversationRaw?.id || !userId) return;
    try {
      await conversationsApi.toggleMute(conversationRaw.id, { userId });
      setIsMuted(!isMuted);
      notify.success(isMuted ? 'Đã bật thông báo' : 'Đã tắt thông báo');
    } catch {
      notify.error('Không thể thay đổi trạng thái thông báo');
    }
  };

  // ── Block toggle ──
  const handleToggleBlock = async () => {
    if (!conversationRaw?.id || !userId) return;
    try {
      await conversationsApi.toggleBlockConversation(conversationRaw.id, userId);
      setIsBlocked(!isBlocked);
      notify.success(isBlocked ? 'Đã bỏ chặn' : 'Đã chặn người dùng');
    } catch {
      notify.error('Không thể thay đổi trạng thái chặn');
    }
  };

  // ── Update Nickname ──
  const handleUpdateNickname = async () => {
    if (!conversationRaw?.id || !userId) return;
    setUpdatingNickname(true);
    try {
      await conversationsApi.updateNickname(conversationRaw.id, {
        userId,
        payload: nicknameDraft.trim()
      });
      setLocalNickname(nicknameDraft.trim() || conversation.name);
      notify.success('Đã cập nhật biệt danh');
      setShowNicknameModal(false);
    } catch {
      notify.error('Không thể cập nhật biệt danh');
    } finally {
      setUpdatingNickname(false);
    }
  };

  // ── Update Background ──
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationRaw?.id) return;
    try {
      notify.success('Đang tải ảnh lên...');
      const uploadResult = await uploadApi.uploadFile(file);
      await conversationsApi.updateConversationBackground(conversationRaw.id, uploadResult.url);
      notify.success('Đã cập nhật ảnh nền');
      // Triggers CONVERSATION_META_UPDATED in background
    } catch {
      notify.error('Lỗi cập nhật ảnh nền');
    } finally {
      e.target.value = ''; // reset input
    }
  };

  // ── Report ──
  const handleReport = async () => {
    if (!reportReason.trim() || !otherUserId || !userId) return;
    setReporting(true);
    try {
      await reportsApi.createReport({
        reporterId: userId,
        reporterName: '',
        targetType: 'USER',
        targetId: otherUserId,
        reason: reportReason.trim(),
        description: `Báo cáo người dùng trong cuộc trò chuyện`,
        priority: 'MEDIUM',
      });
      notify.success('Đã gửi báo cáo');
      setShowReportModal(false);
      setReportReason('');
    } catch {
      notify.error('Không thể gửi báo cáo');
    } finally {
      setReporting(false);
    }
  };

  const profileLink = otherUserId ? `/profile/${otherUserId}` : `/profile/${conversation.id}`;

  return (
    <div className="border-l border-gray-200/50 dark:border-white/5 bg-white overflow-y-auto transition-all duration-300 ease-in-out shrink-0 w-full md:w-[320px] lg:w-85 shadow-sm flex flex-col">

      {/* Header close button */}
      <div className="flex items-center justify-end px-4 pt-3 pb-1">
        <button
          onClick={onCloseRightSidebar}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="text-center px-4 pb-5">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
          style={{ backgroundColor: conversation.color }}
          onClick={() => navigate(profileLink)}
        >
          {conversation.avatar}
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{localNickname || conversation.name}</h3>
        <div className="flex items-center justify-center gap-1.5">
          <Circle
            className={`w-2.5 h-2.5 ${onlineStatus ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'}`}
          />
          <span className={`text-xs font-medium ${onlineStatus ? 'text-green-600' : 'text-gray-400'}`}>
            {onlineStatus ? t('messenger.activeNow') : 'Ngoại tuyến'}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex justify-center gap-3 px-4 pb-5">
        <button
          onClick={() => navigate(profileLink)}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs text-gray-600 font-medium">{t('messenger.groupPanel.sidebarProfile')}</span>
        </button>
        <button
          onClick={handleToggleMute}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isMuted ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-100 hover:bg-gray-200'
          }`}>
            {isMuted
              ? <BellOff className="w-5 h-5 text-amber-600" />
              : <Bell className="w-5 h-5 text-gray-600" />
            }
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {isMuted ? 'Đã tắt TB' : t('messenger.groupPanel.sidebarMute')}
          </span>
        </button>
        <button
          onClick={() => { onShowSearch(); onCloseRightSidebar(); }}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <SearchIcon className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-xs text-gray-600 font-medium">{t('messenger.groupPanel.searchInConversation')}</span>
        </button>
        <button
          onClick={onClearConversationForMe}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-xs text-red-500 font-medium">Xoá chat</span>
        </button>
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* ── User Info Section ── */}
      <div className="px-4 py-4 space-y-4 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : otherUser ? (
          <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-2.5">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Thông tin
            </h5>

            {otherUser.bio && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Giới thiệu</p>
                  <p className="text-sm text-gray-700 leading-snug">{otherUser.bio}</p>
                </div>
              </div>
            )}

            {otherUser.showEmail && otherUser.email && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm text-gray-700 truncate">{otherUser.email}</p>
                </div>
              </div>
            )}

            {otherUser.showPhone && otherUser.phoneNumber && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Số điện thoại</p>
                  <p className="text-sm text-gray-700">{otherUser.phoneNumber}</p>
                </div>
              </div>
            )}

            {otherUser.workPlace && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Nơi làm việc</p>
                  <p className="text-sm text-gray-700 truncate">{otherUser.workPlace}</p>
                </div>
              </div>
            )}

            {otherUser.education && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Học vấn</p>
                  <p className="text-sm text-gray-700 truncate">{otherUser.education}</p>
                </div>
              </div>
            )}

            {(otherUser.city || otherUser.country) && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-teal-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Vị trí</p>
                  <p className="text-sm text-gray-700 truncate">
                    {[otherUser.city, otherUser.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!otherUser.bio && !otherUser.email && !otherUser.phoneNumber &&
              !otherUser.workPlace && !otherUser.education && !otherUser.city && (
              <p className="text-sm text-gray-400 text-center py-2">Chưa có thông tin</p>
            )}
          </section>
        ) : null}

        {/* ── Customize Chat ── */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('messenger.groupPanel.customizeChat')}
          </h4>
          <div className="space-y-1">
            <button
              onClick={() => {
                setNicknameDraft(localNickname || conversation.name);
                setShowNicknameModal(true);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <Pencil className="w-4 h-4 text-green-500" />
              </div>
              <span>Đổi biệt danh</span>
            </button>
            <label className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
              />
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4 text-purple-500" />
              </div>
              <span>Đổi ảnh nền</span>
            </label>
            <button className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <span>{t('messenger.groupPanel.disappearingMessages')}</span>
            </button>
          </div>
        </section>

        {/* ── Photos & Videos ── */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('messenger.groupPanel.photosVideos')}
            </h4>
            <button className="text-xs text-blue-600 hover:underline font-medium">
              {t('messenger.groupPanel.seeAll')}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {mediaMessages.length === 0 ? (
              <p className="col-span-3 text-xs text-gray-400 text-center py-2">Chưa có ảnh/video nào</p>
            ) : (
              mediaMessages.flatMap(m => m.attachments || [])
                .filter(a => a.type === 'image' || a.type === 'video')
                .slice(0, 9)
                .map((media, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-gray-100">
                    {media.type === 'image' ? (
                      <img src={media.url} alt="media" className="w-full h-full object-cover" onClick={() => window.open(media.url, '_blank')} />
                    ) : (
                      <video src={media.url} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))
            )}
          </div>
        </section>

        {/* ── Actions (Block / Report) ── */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-1">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Quyền riêng tư
          </h5>
          <button
            onClick={handleToggleBlock}
            className={`w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm font-medium flex items-center gap-3 ${
              isBlocked ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isBlocked ? 'bg-red-50' : 'bg-orange-50'
            }`}>
              <ShieldOff className={`w-4 h-4 ${isBlocked ? 'text-red-500' : 'text-orange-500'}`} />
            </div>
            <span>{isBlocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-red-500" />
            </div>
            <span>Báo cáo</span>
          </button>
        </section>
      </div>

      {/* ── Report Modal ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-semibold text-gray-900">Báo cáo người dùng</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500 mb-3">Cho chúng tôi biết lý do bạn muốn báo cáo:</p>
              <textarea
                autoFocus
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="Nhập lý do..."
                className="w-full h-24 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 text-sm resize-none"
              />
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim() || reporting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reporting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nickname Modal ── */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNicknameModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-green-500" />
                <h3 className="text-base font-semibold text-gray-900">Đổi biệt danh</h3>
              </div>
              <button onClick={() => setShowNicknameModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500 mb-3">Mọi người trong đoạn chat sẽ thấy biệt danh mới.</p>
              <input
                autoFocus
                type="text"
                value={nicknameDraft}
                onChange={e => setNicknameDraft(e.target.value)}
                placeholder="Nhập biệt danh..."
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
              />
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowNicknameModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleUpdateNickname}
                disabled={updatingNickname}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updatingNickname ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
