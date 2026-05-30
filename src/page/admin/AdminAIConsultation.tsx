import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, Phone, PhoneCall, Search, Settings, History, Users, User as UserIcon,
  Clock, ThumbsUp, CheckCircle2, XCircle, RotateCcw, Loader2,
  Save, Sparkles, Package, SlidersHorizontal, Volume2,
  RefreshCcw, Mail
} from 'lucide-react';
import { usersApi, type User } from '../../apis/users';
import { aiConsultationApi, type ConsultationLog, type ConsultationSummary } from '../../apis/aiConsultation';

type TabId = 'users' | 'history' | 'settings';

interface CallModalState {
  open: boolean;
  user: User | null;
  status: 'idle' | 'calling' | 'success' | 'error';
  message: string;
}

export default function AdminAIConsultation() {
  const [activeTab, setActiveTab] = useState<TabId>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ConsultationLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConsultationSummary>({
    total: 0, pending: 0, interested: 0, registered: 0, notInterested: 0, callback: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [callModal, setCallModal] = useState<CallModalState>({
    open: false, user: null, status: 'idle', message: ''
  });
  const [phoneInputs, setPhoneInputs] = useState<Record<string, string>>({});
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [updatingUsers, setUpdatingUsers] = useState<Record<string, boolean>>({});

  // Settings state
  const [packages, setPackages] = useState('');
  const [instructions, setInstructions] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [groqKey, setGroqKey] = useState('');

  // Twilio state
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, logsData, summaryData, settingsData] = await Promise.all([
        usersApi.getAllUsers().catch(() => []),
        aiConsultationApi.getLogs().catch(() => []),
        aiConsultationApi.getSummary().catch(() => summary),
        aiConsultationApi.getSettings().catch(() => ({
          packages: '', instructions: '', wsUrl: '', groqApiKey: '',
          twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: ''
        })),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setSummary(summaryData);
      setPackages(settingsData.packages || '');
      setInstructions(settingsData.instructions || '');
      setWsUrl(settingsData.wsUrl || '');
      setGroqKey(settingsData.groqApiKey || '');
      setTwilioAccountSid(settingsData.twilioAccountSid || '');
      setTwilioAuthToken(settingsData.twilioAuthToken || '');
      setTwilioPhoneNumber(settingsData.twilioPhoneNumber || '');
    } catch (err) {
      console.error('Failed to load consultation data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter users
  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.phoneNumber?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const handleStartCall = async (user: User) => {
    const targetPhone = phoneInputs[user.id!] || user.phoneNumber;
    if (!targetPhone || !user.id) {
      alert("Vui lòng nhập số điện thoại trước khi gọi!");
      return;
    }

    // Update local user object for the modal display
    const callUser = { ...user, phoneNumber: targetPhone };
    setCallModal({ open: true, user: callUser, status: 'calling', message: 'Đang kết nối AI tư vấn...' });

    try {
      const res = await aiConsultationApi.startCall({
        userId: callUser.id as string,
        phoneNumber: callUser.phoneNumber as string,
      });
      if (res.success) {
        setCallModal(prev => ({
          ...prev, status: 'success',
          message: 'Đã gửi lệnh gọi tới số điện thoại! Vui lòng chờ khách hàng nhấc máy. (Bạn có thể đóng bảng này và tải lại Lịch sử tư vấn để xem kết quả khi cuộc gọi kết thúc).'
        }));
      } else {
        setCallModal(prev => ({
          ...prev, status: 'error',
          message: res.message || 'Lỗi không xác định'
        }));
      }
    } catch (err: any) {
      setCallModal(prev => ({
        ...prev, status: 'error',
        message: err?.message || 'Lỗi kết nối'
      }));
    }
  };

  const handleSendEmail = async (user: User) => {
    if (!user.id) return;
    setSendingEmails(prev => ({ ...prev, [user.id!]: true }));
    try {
      // Use current input values if available
      const currentEmail = emailInputs[user.id!] ?? user.email;
      const currentPhone = phoneInputs[user.id!] ?? user.phoneNumber;
      
      // If user modified phone/email in UI but hasn't saved, let's warn them or save temporarily
      const res = await aiConsultationApi.sendEmailLink({ userId: user.id });
      if (res.success) {
        alert(`Đã gửi mail tư vấn thành công tới ${currentEmail || user.fullName}!`);
      } else {
        alert(`Gửi mail thất bại: ${res.message || 'Lỗi hệ thống'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi kết nối: ${err?.message || 'Không rõ nguyên nhân'}`);
    } finally {
      setSendingEmails(prev => ({ ...prev, [user.id!]: false }));
    }
  };

  const handleUpdateUserInfo = async (user: User) => {
    if (!user.id) return;
    const newPhone = phoneInputs[user.id] ?? user.phoneNumber ?? '';
    const newEmail = emailInputs[user.id] ?? user.email ?? '';
    
    setUpdatingUsers(prev => ({ ...prev, [user.id!]: true }));
    try {
      await usersApi.updateUserProfile(user.id, {
        phoneNumber: newPhone,
        email: newEmail
      });
      
      // Update local users state so it syncs up
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, phoneNumber: newPhone, email: newEmail } : u));
      alert("Đã cập nhật thông tin người dùng thành công!");
    } catch (err: any) {
      console.error("Failed to update user profile:", err);
      alert(`Lỗi cập nhật: ${err?.message || 'Không rõ nguyên nhân'}`);
    } finally {
      setUpdatingUsers(prev => ({ ...prev, [user.id!]: false }));
    }
  };

  const closeCallModal = () => {
    setCallModal({ open: false, user: null, status: 'idle', message: '' });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await aiConsultationApi.saveSettings({
        packages, instructions, wsUrl, groqApiKey: groqKey,
        twilioAccountSid, twilioAuthToken, twilioPhoneNumber
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const resultLabels: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: 'Chờ xử lý', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    interested: { label: 'Quan tâm', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    registered: { label: 'Đã đăng ký', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    not_interested: { label: 'Không quan tâm', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    callback: { label: 'Gọi lại sau', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    completed: { label: 'Hoàn tất', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  };

  const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'history', label: 'Lịch sử tư vấn', icon: History },
    { id: 'settings', label: 'Cấu hình AI', icon: Settings },
  ];

  return (
    <div className="space-y-5">
      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Tư Vấn Livestream</h1>
              <p className="text-white/70 text-sm">Chọn người dùng, AI sẽ tự động gọi tư vấn gói Livestream</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Tổng cuộc gọi', value: summary.total, icon: PhoneCall, color: 'text-indigo-600', bg: 'bg-indigo-50', borderC: 'border-indigo-100' },
          { label: 'Chờ xử lý', value: summary.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', borderC: 'border-amber-100' },
          { label: 'Quan tâm', value: summary.interested, icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50', borderC: 'border-emerald-100' },
          { label: 'Đã đăng ký', value: summary.registered, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', borderC: 'border-blue-100' },
          { label: 'Không quan tâm', value: summary.notInterested, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', borderC: 'border-red-100' },
          { label: 'Gọi lại sau', value: summary.callback, icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-50', borderC: 'border-purple-100' },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-xl p-4 border ${card.borderC} hover:shadow-md transition-all duration-200 group`}>
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
            </div>
            <div className={`text-2xl font-extrabold ${card.color} leading-none mb-1`}>{card.value}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={loadData}
            className="px-4 py-2 m-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCcw className="w-4 h-4" />
            Tải lại
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              {/* ── TAB: Users ────────────────────────────────────────── */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, username, SĐT, email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
                    />
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        {searchQuery ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng nào'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Người dùng</th>
                            <th className="px-4 py-3 font-semibold">Số điện thoại</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold text-center">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {user.avatar ? (
                                    <img src={user.avatar} alt={user.fullName}
                                      className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600">
                                      {getInitials(user.fullName)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-gray-900">{user.fullName || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">@{user.username || 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  placeholder="Nhập SĐT..."
                                  value={phoneInputs[user.id!] ?? user.phoneNumber ?? ''}
                                  onChange={e => setPhoneInputs(prev => ({ ...prev, [user.id!]: e.target.value }))}
                                  className="w-32 h-8 px-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  placeholder="Nhập Email..."
                                  value={emailInputs[user.id!] ?? user.email ?? ''}
                                  onChange={e => setEmailInputs(prev => ({ ...prev, [user.id!]: e.target.value }))}
                                  className="w-56 h-8 px-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleUpdateUserInfo(user)}
                                    disabled={updatingUsers[user.id!] === true}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-200 hover:shadow disabled:opacity-50"
                                    title="Lưu thông tin SĐT & Email"
                                  >
                                    {updatingUsers[user.id!] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                    Lưu
                                  </button>
                                  <button
                                    onClick={() => handleStartCall(user)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    }}
                                  >
                                    <Bot className="w-4 h-4" />
                                    Gọi AI
                                  </button>
                                  <button
                                    onClick={() => handleSendEmail(user)}
                                    disabled={sendingEmails[user.id!] === true}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    style={{
                                      background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                                    }}
                                  >
                                    {sendingEmails[user.id!] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Mail className="w-4 h-4" />
                                    )}
                                    Gửi Mail
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: History ──────────────────────────────────────── */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Chưa có lịch sử tư vấn nào</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-3 font-semibold">#</th>
                            <th className="px-4 py-3 font-semibold">Người dùng</th>
                            <th className="px-4 py-3 font-semibold">SĐT</th>
                            <th className="px-4 py-3 font-semibold">Trạng thái</th>
                            <th className="px-4 py-3 font-semibold">Kết quả</th>
                            <th className="px-4 py-3 font-semibold">Gói đề xuất</th>
                            <th className="px-4 py-3 font-semibold">Thời lượng</th>
                            <th className="px-4 py-3 font-semibold">Thời gian</th>
                            <th className="px-4 py-3 font-semibold"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {logs.map((log, i) => {
                            const r = resultLabels[log.result] || resultLabels.pending;
                            const isExpanded = expandedLogId === log.id;
                            return (
                              <React.Fragment key={log.id}>
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                                  <td className="px-4 py-3 font-medium text-gray-900">{log.userName || '—'}</td>
                                  <td className="px-4 py-3 font-mono text-indigo-600 text-sm">{log.phoneNumber}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${log.status === 'completed'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : log.status === 'failed'
                                          ? 'bg-red-50 text-red-700 border-red-200'
                                          : 'bg-gray-50 text-gray-600 border-gray-200'
                                      }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${r.bg} ${r.color} ${r.border}`}>
                                      {r.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 text-sm">{log.recommendedPackage || '—'}</td>
                                  <td className="px-4 py-3 text-gray-600">{log.duration > 0 ? `${log.duration}s` : '—'}</td>
                                  <td className="px-4 py-3 text-gray-500 text-xs">
                                    {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                      {isExpanded ? 'Đóng' : 'Đoạn chat'}
                                    </button>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={9} className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4 w-full">
                                        {!log.notes ? (
                                          <p className="text-gray-500 italic text-center py-4 text-sm">Không có nội dung cuộc trò chuyện.</p>
                                        ) : (
                                          log.notes.split('\n').filter(line => line.trim()).map((line, idx) => {
                                            const isUser = line.includes('👤');
                                            const isBot = line.includes('🤖');
                                            if (!isUser && !isBot) return <p key={idx} className="text-gray-400 text-xs text-center">{line}</p>;

                                            const text = line.replace('👤', '').replace('🤖', '').trim();
                                            return (
                                              <div key={idx} className={`flex w-full items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                {!isUser && (
                                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <Bot className="w-4 h-4 text-white" />
                                                  </div>
                                                )}
                                                <div className={`px-4 py-2.5 max-w-[75%] text-sm shadow-sm ${isUser
                                                    ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm'
                                                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
                                                  }`}>
                                                  <p className="leading-relaxed">{text}</p>
                                                </div>
                                                {isUser && (
                                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-300">
                                                    <UserIcon className="w-4 h-4 text-gray-600" />
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: Settings ────────────────────────────────────── */}
              {activeTab === 'settings' && (
                <div className="space-y-5 max-w-3xl">
                  {/* Packages config */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-sm font-bold text-gray-900">Thông tin các gói Livestream</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Nhập mô tả các gói dịch vụ livestream. AI sẽ dùng thông tin này để tư vấn.
                      Nếu để trống, AI sẽ dùng bộ gói mặc định (Cơ bản / Nâng cao / Doanh nghiệp).
                    </p>
                    <textarea
                      value={packages}
                      onChange={e => setPackages(e.target.value)}
                      rows={6}
                      placeholder="VD: Gói Basic: 1.500.000đ/tháng, 2 kênh phát đồng thời..."
                      className="w-full rounded-lg bg-white border border-gray-200 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-y"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-bold text-gray-900">Hướng dẫn bổ sung cho AI</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Thêm chỉ thị đặc biệt cho AI. VD: "Luôn đề xuất gói Pro trước", "Nhắc khuyến mãi tháng 6"...
                    </p>
                    <textarea
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      rows={4}
                      placeholder="VD: Chương trình khuyến mãi: Giảm 30% gói Enterprise trong tháng 6..."
                      className="w-full rounded-lg bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-y"
                    />
                  </div>

                  {/* Twilio config */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="w-5 h-5 text-blue-500" />
                      <h3 className="text-sm font-bold text-gray-900">Cấu hình Twilio (AI VoiceBot)</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Nhập thông tin từ tài khoản Twilio của bạn để AI có thể gọi điện.</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Twilio Account SID</label>
                        <input
                          type="text"
                          value={twilioAccountSid}
                          onChange={e => setTwilioAccountSid(e.target.value)}
                          placeholder="AC..."
                          className="w-full h-10 rounded-lg bg-white border border-gray-200 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Twilio Auth Token</label>
                        <input
                          type="password"
                          value={twilioAuthToken}
                          onChange={e => setTwilioAuthToken(e.target.value)}
                          placeholder="..."
                          className="w-full h-10 rounded-lg bg-white border border-gray-200 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Twilio Phone Number (VD: +13073748086)</label>
                        <input
                          type="text"
                          value={twilioPhoneNumber}
                          onChange={e => setTwilioPhoneNumber(e.target.value)}
                          placeholder="+1..."
                          className="w-full h-10 rounded-lg bg-white border border-gray-200 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Server config */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h3 className="text-sm font-bold text-gray-900">Cấu hình Server AI (Python)</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">WebSocket URL (ngrok)</label>
                        <input
                          type="text"
                          value={wsUrl}
                          onChange={e => setWsUrl(e.target.value)}
                          placeholder="wss://your-ngrok-url.ngrok-free.dev/ws"
                          className="w-full h-10 rounded-lg bg-white border border-gray-200 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Groq API Key</label>
                        <input
                          type="password"
                          value={groqKey}
                          onChange={e => setGroqKey(e.target.value)}
                          placeholder="gsk_..."
                          className="w-full h-10 rounded-lg bg-white border border-gray-200 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu cấu hình
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Call Modal ───────────────────────────────────────────── */}
      {callModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) closeCallModal(); }}
        >
          <div className="bg-white rounded-2xl p-8 w-[420px] max-w-[90vw] shadow-2xl text-center animate-card-in">
            <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-white ${callModal.status === 'calling'
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse'
                : callModal.status === 'success'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                  : callModal.status === 'error'
                    ? 'bg-gradient-to-br from-red-500 to-rose-600'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
              {callModal.status === 'calling' ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : callModal.status === 'success' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : callModal.status === 'error' ? (
                <XCircle className="w-8 h-8" />
              ) : (
                <Bot className="w-8 h-8" />
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {callModal.user?.fullName || 'Đang gọi...'}
            </h3>
            <p className="text-lg font-semibold text-indigo-600 mb-2 font-mono">
              {callModal.user?.phoneNumber || '---'}
            </p>
            <p className="text-sm text-gray-500 mb-6">{callModal.message}</p>

            <button
              onClick={closeCallModal}
              className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
