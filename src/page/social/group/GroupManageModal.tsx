import { useEffect, useState } from "react";
import { groupsApi, type GroupData } from "../../../apis/groupsApi";
import {
  Trash2, Users, Edit3, Settings, ChevronRight, Check, X,
  UserMinus, Shield, Clock, CheckCircle, XCircle, Lock, Globe, Loader2,
} from "lucide-react";
import { authApi } from "../../../apis/auth";
import { useTranslation } from "react-i18next";

interface Props {
  group: GroupData;
  onClose: () => void;
}

interface Member {
  id: string;
  fullName: string;
  avatar?: string;
  role?: string | null;
}

interface PendingMember {
  userId: string;
  fullName: string;
  avatar?: string;
  status: string;
  joinAnswers?: string[];
}

type Tab = "members" | "pending" | "settings";

export default function GroupManageModal({ group, onClose }: Props) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("members");

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [savingName, setSavingName] = useState(false);

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const [isPrivate, setIsPrivate] = useState<boolean>(group.privacy === "PRIVATE");
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);

  const [questions, setQuestions] = useState<string[]>(group.joinQuestions || []);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data: Member[] = await groupsApi.getGroupMembers(group.id!);
      const withRoles = await Promise.all(
        data.map(async (m) => {
          const role = await groupsApi.getUserRole(group.id!, m.id);
          return { ...m, role };
        })
      );
      setMembers(withRoles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingMembers = async () => {
    try {
      setLoadingPending(true);
      const data: PendingMember[] = await groupsApi.getPendingMembers(group.id!);
      setPendingMembers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => { loadMembers(); }, []);

  useEffect(() => {
    if (activeTab === "pending") {
      loadPendingMembers();
    }
  }, [activeTab]);

  const handleUpdateName = async () => {
    try {
      setSavingName(true);
      await groupsApi.updateGroup(group.id!, { name: newName });
      setEditingName(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdateQuestions = async () => {
    try {
      setSavingQuestions(true);
      const filtered = questions.filter(q => q.trim().length > 0);
      await groupsApi.updateGroup(group.id!, { joinQuestions: filtered });
      setQuestions(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await groupsApi.removeMember(group.id!, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      
      // Auto-sync with Messenger
      if (group?.linkedConversationId) {
          try {
              const { conversationsApi } = await import('../../../apis/conversations');
              await conversationsApi.removeMember(group.linkedConversationId, userId);
          } catch (err) {
              console.error("Failed to sync remove to chat", err);
          }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      setTogglingPrivacy(true);
      await groupsApi.toggleGroupPrivacy(group.id!);
      setIsPrivate((prev) => !prev);
    } catch (error) {
      console.error(error);
    } finally {
      setTogglingPrivacy(false);
    }
  };

  const handleDeleteGroup = async () => {
    const confirm = window.confirm(t("groupPage.manageConfirmDelete"));
    if (!confirm) return;
    try {
      await groupsApi.deleteGroup(group.id!);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveMember = async (userId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(userId));
      await groupsApi.approveMember(group.id!, userId);
      setPendingMembers((prev) => prev.filter((m) => m.userId !== userId));
      loadMembers();
      
      // Auto-sync with Messenger
      if (group?.linkedConversationId) {
          try {
              const { conversationsApi } = await import('../../../apis/conversations');
              await conversationsApi.addGroupMembers(group.linkedConversationId, { participantIds: [userId] });
          } catch (err) {
              console.error("Failed to sync member to chat", err);
          }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleRejectMember = async (userId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(userId));
      await groupsApi.rejectMember(group.id!, userId);
      setPendingMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const tabs = [
    { id: "members" as Tab, label: t("groupPage.manageNavMembers"), icon: Users, count: members.length },
    { id: "pending" as Tab, label: t("groupPage.manageNavPending"), icon: Clock, count: pendingMembers.length },
    { id: "settings" as Tab, label: t("groupPage.manageNavSettings"), icon: Settings, count: null },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-1000 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-[780px] max-h-[82vh] bg-white dark:bg-[#1a1d28] rounded-2xl overflow-hidden shadow-2xl animate-card-in">

        {/* Sidebar */}
        <div className="w-[220px] shrink-0 bg-gray-50 dark:bg-[#13151f] border-r border-gray-100 dark:border-[#22263a] flex flex-col">

          {/* Group info */}
          <div className="p-5 pb-4 border-b border-gray-100 dark:border-[#22263a]">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white mb-3 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-[#edf0fa] truncate">{newName}</p>
            <p className="text-xs text-gray-400 dark:text-[#6a7494] mt-0.5">{t("groupPage.manageSidebarMembers", { count: members.length })}</p>
          </div>

          {/* Nav tabs */}
          <nav className="p-2.5 flex-1 space-y-0.5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isPending = tab.id === "pending";
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white dark:bg-[#242838] text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                      : "text-gray-500 dark:text-[#9aa3bc] hover:bg-gray-100 dark:hover:bg-[#1e2133] hover:text-gray-700 dark:hover:text-[#edf0fa]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                  {tab.count !== null ? (
                    <span className={`ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isPending
                        ? "bg-amber-50 dark:bg-amber-500/15 text-amber-500 dark:text-amber-400"
                        : isActive
                          ? "bg-blue-50 dark:bg-blue-500/15 text-blue-500 dark:text-blue-400"
                          : "bg-gray-100 dark:bg-[rgba(255,255,255,0.06)] text-gray-400 dark:text-[#6a7494]"
                    }`}>
                      {tab.count}
                    </span>
                  ) : (
                    <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-30" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#22263a] shrink-0">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-[#edf0fa]">
                {activeTab === "members" ? t("groupPage.manageTitleMembers")
                  : activeTab === "pending" ? t("groupPage.manageTitlePending")
                  : t("groupPage.manageTitleSettings")}
              </h3>
              <p className="text-xs text-gray-400 dark:text-[#7e89a6] mt-0.5">
                {activeTab === "members"
                  ? t("groupPage.manageSubMembers", { count: members.length })
                  : activeTab === "pending"
                  ? t("groupPage.manageSubPending", { count: pendingMembers.length })
                  : t("groupPage.manageSubSettings")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#22263a] text-gray-400 dark:text-[#6a7494] hover:bg-gray-200 dark:hover:bg-[#2b2f45] hover:text-gray-600 dark:hover:text-[#edf0fa] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide">

            {/* === Members tab === */}
            {activeTab === "members" && (
              <div>
                {loading ? (
                  <LoadingSpinner text={t("groupPage.manageLoadingMembers")} />
                ) : members.length === 0 ? (
                  <EmptyBlock icon={Users} text={t("groupPage.manageEmptyMembers")} />
                ) : (
                  <div className="space-y-1">
                    {members.map((member) => {
                      const isAdmin = member.role === "ADMIN";
                      const isSelf = member.id === currentUser?.id;
                      const canRemove = !isAdmin && !isSelf;

                      return (
                        <div key={member.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1e2133] transition-colors">
                          <div className="flex items-center gap-3">
                            <AvatarCircle src={member.avatar} name={member.fullName} />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-[#edf0fa]">{member.fullName}</p>
                              <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                                isAdmin
                                  ? "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : "bg-gray-100 dark:bg-[#22263a] text-gray-400 dark:text-[#7e89a6]"
                              }`}>
                                {isAdmin && <Shield className="w-2.5 h-2.5" />}
                                {isAdmin ? t("groupPage.manageRoleAdmin") : t("groupPage.manageRoleMember")}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!canRemove}
                            onClick={() => canRemove && handleRemoveMember(member.id)}
                            title={isAdmin ? t("groupPage.manageRemoveAdmin") : isSelf ? t("groupPage.manageRemoveSelf") : t("groupPage.manageRemoveMember")}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 dark:text-[#4e5870] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-300 transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* === Pending tab === */}
            {activeTab === "pending" && (
              <div>
                {loadingPending ? (
                  <LoadingSpinner text={t("groupPage.manageLoadingPending")} />
                ) : pendingMembers.length === 0 ? (
                  <EmptyBlock icon={Clock} text={t("groupPage.manageEmptyPending")} />
                ) : (
                  <div className="space-y-1">
                    {pendingMembers.map((member) => {
                      const isProcessing = processingIds.has(member.userId);
                      return (
                        <div key={member.userId} className="flex flex-col p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1e2133] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-[#22263a]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <AvatarCircle src={member.avatar} name={member.fullName} />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-[#edf0fa]">{member.fullName}</p>
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-500 dark:text-amber-400">
                                  <Clock className="w-2.5 h-2.5" />
                                  {t("groupPage.managePendingBadge")}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApproveMember(member.userId)}
                                className="h-8 px-3 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-green-100 dark:hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                {t("groupPage.manageApprove")}
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleRejectMember(member.userId)}
                                className="h-8 px-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                {t("groupPage.manageReject")}
                              </button>
                            </div>
                          </div>

                          {member.joinAnswers && member.joinAnswers.length > 0 && group.joinQuestions && group.joinQuestions.length > 0 && (
                            <div className="mt-3 p-3 rounded-lg bg-white dark:bg-[#13151f] border border-gray-100 dark:border-[#22263a] text-sm">
                              <p className="font-semibold text-gray-900 dark:text-[#edf0fa] mb-2">{t("groupPage.manageQuestionsAnswers", "Câu trả lời xét duyệt:")}</p>
                              <ul className="space-y-2">
                                {group.joinQuestions.map((q, idx) => (
                                  <li key={idx} className="flex flex-col gap-0.5">
                                    <span className="text-gray-500 dark:text-[#9aa3bc] font-medium text-xs">Q: {q}</span>
                                    <span className="text-gray-900 dark:text-[#edf0fa] text-sm">A: {member.joinAnswers?.[idx] || t("groupPage.manageNoAnswer", "Không trả lời")}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* === Settings tab === */}
            {activeTab === "settings" && (
              <div>
                {/* Group name */}
                <div className="mb-6">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6a7494] mb-2">
                    {t("groupPage.manageGroupNameLabel")}
                  </label>
                  <div className="flex gap-2">
                    {editingName ? (
                      <>
                        <input
                          className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#1e2133] text-sm text-gray-900 dark:text-[#edf0fa] outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleUpdateName}
                          disabled={savingName}
                          className="h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                          {t("groupPage.manageSave")}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingName(false); setNewName(group.name); }}
                          className="w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#22263a] text-gray-400 dark:text-[#6a7494] hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#1e2133] text-sm text-gray-900 dark:text-[#edf0fa] flex items-center">
                          {newName}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingName(true)}
                          title={t("groupPage.manageEditName")}
                          className="w-10 h-10 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#22263a] text-gray-400 dark:text-[#6a7494] hover:bg-gray-100 dark:hover:bg-[#2b2f45] hover:text-gray-600 dark:hover:text-[#edf0fa] flex items-center justify-center transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Privacy toggle */}
                <div className="mb-6">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6a7494] mb-2">
                    {t("groupPage.managePrivacyLabel")}
                  </label>
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#13151f]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isPrivate
                          ? "bg-blue-50 dark:bg-blue-500/15 text-blue-500 dark:text-blue-400"
                          : "bg-green-50 dark:bg-green-500/15 text-green-500 dark:text-green-400"
                      }`}>
                        {isPrivate ? <Lock className="w-[18px] h-[18px]" /> : <Globe className="w-[18px] h-[18px]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-[#edf0fa]">
                          {isPrivate ? t("groupPage.managePrivateGroup") : t("groupPage.managePublicGroup")}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-[#7e89a6] leading-relaxed">
                          {isPrivate
                            ? t("groupPage.managePrivateHint")
                            : t("groupPage.managePublicHint")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold transition-colors ${!isPrivate ? "text-blue-500 dark:text-blue-400" : "text-gray-300 dark:text-[#4e5870]"}`}>
                        Công khai
                      </span>
                      <label className="relative inline-flex items-center w-11 h-6 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPrivate}
                          disabled={togglingPrivacy}
                          onChange={handleTogglePrivacy}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#2b2f45] rounded-full peer-checked:bg-blue-500 dark:peer-checked:bg-blue-500 transition-colors" />
                        {togglingPrivacy ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                          </div>
                        ) : (
                          <div className="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
                        )}
                      </label>
                      <span className={`text-xs font-semibold transition-colors ${isPrivate ? "text-blue-500 dark:text-blue-400" : "text-gray-300 dark:text-[#4e5870]"}`}>
                        {t("groupPage.manageLabelPrivate")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Join Questions */}
                {isPrivate && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6a7494]">
                        {t("groupPage.manageQuestionsLabel", "Câu hỏi tham gia nhóm")}
                      </label>
                      <button
                        type="button"
                        onClick={handleUpdateQuestions}
                        disabled={savingQuestions}
                        className="h-7 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {savingQuestions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        {t("groupPage.manageSave", "Lưu")}
                      </button>
                    </div>
                    <div className="p-4 rounded-2xl border border-gray-100 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#13151f] space-y-3">
                      <p className="text-xs text-gray-400 dark:text-[#7e89a6] mb-3">
                        {t("groupPage.manageQuestionsHint", "Người dùng phải trả lời các câu hỏi này khi xin vào nhóm riêng tư.")}
                      </p>
                      {questions.map((q, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            className="flex-1 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] text-sm text-gray-900 dark:text-[#edf0fa] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/10 transition-all"
                            value={q}
                            placeholder={t("groupPage.manageQuestionPlaceholder", "Nhập câu hỏi...")}
                            onChange={(e) => {
                              const newQ = [...questions];
                              newQ[idx] = e.target.value;
                              setQuestions(newQ);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {questions.length < 3 && (
                        <button
                          type="button"
                          onClick={() => setQuestions([...questions, ""])}
                          className="w-full h-9 rounded-lg border border-dashed border-gray-300 dark:border-[#2b2f45] text-gray-500 hover:border-blue-400 hover:text-blue-500 text-sm font-medium transition-colors"
                        >
                          + {t("groupPage.manageAddQuestion", "Thêm câu hỏi")}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Danger zone */}
                <div className="mt-8 p-5 rounded-2xl border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400 mb-1.5">
                    {t("groupPage.manageDangerZone")}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-[#7e89a6] mb-4">
                    {t("groupPage.manageDangerDesc")}
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    className="w-full h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("groupPage.manageDeleteGroup")}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Small helper components ─── */

function AvatarCircle({ src, name }: { src?: string; name: string }) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  return src ? (
    <img
      src={src}
      alt={name}
      className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-white dark:border-[#1a1d28] shadow-sm"
    />
  ) : (
    <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-sm">
      {initial}
    </div>
  );
}

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 py-6 justify-center animate-fade-in">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-[#2b2f45]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
      </div>
      <span className="text-sm text-gray-400 dark:text-[#7e89a6]">{text}</span>
    </div>
  );
}

function EmptyBlock({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-gray-300 dark:text-[#4e5870]" />
      </div>
      <p className="text-sm text-gray-400 dark:text-[#7e89a6]">{text}</p>
    </div>
  );
}
