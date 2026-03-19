import { useEffect, useState } from "react";
import { groupsApi, type GroupData } from "../../../apis/groupsApi";
import { Trash2, Users, Edit3, Settings, ChevronRight, Check, X, UserMinus, Shield, Clock, CheckCircle, XCircle, Lock, Globe } from "lucide-react";
import { authApi } from '../../../apis/auth';

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
}

type Tab = "members" | "pending" | "settings";

export default function GroupManageModal({ group, onClose }: Props) {
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

  const handleRemoveMember = async (userId: string) => {
    try {
      await groupsApi.removeMember(group.id!, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
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
    const confirm = window.confirm("Are you sure you want to delete this group?");
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
      // Reload members list to reflect new approved member
      loadMembers();
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
    { id: "members" as Tab, label: "Members", icon: Users, count: members.length },
    { id: "pending" as Tab, label: "Pending", icon: Clock, count: pendingMembers.length },
    { id: "settings" as Tab, label: "Settings", icon: Settings, count: null },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

        .gmm-overlay {
          position: fixed; inset: 0;
          background: rgba(8, 8, 18, 0.6);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          animation: gmm-fadein 0.2s ease;
        }
        @keyframes gmm-fadein { from { opacity:0 } to { opacity:1 } }
        @keyframes gmm-slideup {
          from { opacity:0; transform: translateY(24px) scale(0.97) }
          to   { opacity:1; transform: translateY(0)   scale(1)    }
        }
        @keyframes gmm-spin { to { transform: rotate(360deg) } }

        .gmm-modal {
          font-family: 'DM Sans', sans-serif;
          display: flex; width: 780px; max-height: 82vh;
          background: #ffffff; border-radius: 22px; overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06);
          animation: gmm-slideup 0.25s ease;
        }

        .gmm-sidebar {
          width: 220px; flex-shrink: 0; background: #f7f7fb;
          border-right: 1px solid #ececf4; display: flex; flex-direction: column;
        }
        .gmm-sidebar-top { padding: 24px 20px 20px; border-bottom: 1px solid #ececf4; }
        .gmm-group-avatar {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 10px;
          box-shadow: 0 4px 12px rgba(108,99,255,0.3);
        }
        .gmm-group-name {
          font-size: 14px; font-weight: 600; color: #0f0f1a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 2px;
        }
        .gmm-group-meta { font-size: 12px; color: #9b9bae; margin: 0; }
        .gmm-nav { padding: 12px 10px; flex: 1; }
        .gmm-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px; cursor: pointer;
          font-size: 13.5px; font-weight: 500; color: #6b6b80;
          transition: all 0.15s; border: none; background: transparent;
          width: 100%; text-align: left;
        }
        .gmm-nav-item:hover { background: #ededf5; color: #0f0f1a; }
        .gmm-nav-item.active { background: #fff; color: #6c63ff; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
        .gmm-nav-icon { width: 16px; height: 16px; flex-shrink: 0; }
        .gmm-nav-count {
          margin-left: auto; font-size: 11px; font-weight: 600;
          background: #6c63ff18; color: #6c63ff; padding: 1px 7px; border-radius: 20px;
        }
        .gmm-nav-count.pending-count {
          background: #fff7ed; color: #f59e0b;
        }
        .gmm-nav-arrow { margin-left: auto; width: 14px; height: 14px; opacity: 0.4; }

        .gmm-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .gmm-content-header {
          padding: 22px 28px 18px; border-bottom: 1px solid #f0f0f8;
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .gmm-content-title { font-size: 17px; font-weight: 600; color: #0f0f1a; margin: 0; letter-spacing: -0.2px; }
        .gmm-content-subtitle { font-size: 12.5px; color: #9b9bae; margin: 3px 0 0; }
        .gmm-close-btn {
          width: 34px; height: 34px; border-radius: 50%; border: none;
          background: #f4f4f8; color: #6b6b80; font-size: 14px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .gmm-close-btn:hover { background: #ececf2; color: #0f0f1a; }

        .gmm-content-body {
          flex: 1; overflow-y: auto; padding: 24px 28px;
          scrollbar-width: thin; scrollbar-color: #e0e0f0 transparent;
        }
        .gmm-content-body::-webkit-scrollbar { width: 4px; }
        .gmm-content-body::-webkit-scrollbar-thumb { background: #e0e0f0; border-radius: 4px; }

        /* ── Members ── */
        .gmm-member-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; border-radius: 12px; transition: background 0.15s;
        }
        .gmm-member-row:hover { background: #f7f7fb; }
        .gmm-member-left { display: flex; align-items: center; gap: 12px; }
        .gmm-avatar {
          width: 38px; height: 38px; border-radius: 50%; object-fit: cover;
          flex-shrink: 0; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        .gmm-avatar-placeholder {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #e8e8f8, #d4d4f0);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 600; color: #8888b8; flex-shrink: 0;
        }
        .gmm-member-info { display: flex; flex-direction: column; gap: 3px; }
        .gmm-member-name { font-size: 14px; font-weight: 500; color: #1a1a2e; line-height: 1; }

        /* Role badge */
        .gmm-role-badge {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.2px;
          padding: 2px 7px; border-radius: 20px; width: fit-content;
        }
        .gmm-role-badge.admin { background: #fef3c7; color: #d97706; }
        .gmm-role-badge.member { background: #f0f0f8; color: #a0a0bc; }
        .gmm-role-badge.pending-badge { background: #fff7ed; color: #f59e0b; }
        .gmm-shield-icon { width: 10px; height: 10px; }

        /* Remove button */
        .gmm-remove-btn {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #c4c4d0; transition: all 0.15s; flex-shrink: 0;
        }
        .gmm-remove-btn:hover:not(:disabled) { background: #fff0f0; color: #ef4444; }
        .gmm-remove-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        /* Pending action buttons */
        .gmm-pending-actions { display: flex; align-items: center; gap: 6px; }
        .gmm-approve-btn {
          height: 30px; padding: 0 12px; border-radius: 8px; border: none;
          background: #ecfdf5; color: #059669;
          font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 5px;
          transition: all 0.15s; flex-shrink: 0;
        }
        .gmm-approve-btn:hover:not(:disabled) { background: #d1fae5; transform: translateY(-1px); }
        .gmm-approve-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .gmm-reject-btn {
          height: 30px; padding: 0 12px; border-radius: 8px; border: none;
          background: #fff0f0; color: #ef4444;
          font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 5px;
          transition: all 0.15s; flex-shrink: 0;
        }
        .gmm-reject-btn:hover:not(:disabled) { background: #fde8e8; transform: translateY(-1px); }
        .gmm-reject-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Empty state */
        .gmm-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 48px 0; gap: 10px;
        }
        .gmm-empty-icon {
          width: 44px; height: 44px; border-radius: 14px;
          background: #f4f4f8; display: flex; align-items: center; justify-content: center;
          color: #c4c4d0;
        }
        .gmm-empty-text { font-size: 13px; color: #c4c4d0; }

        .gmm-loading {
          display: flex; align-items: center; gap: 8px;
          color: #9b9bae; font-size: 13px; padding: 12px 0;
        }
        .gmm-spinner {
          width: 14px; height: 14px;
          border: 2px solid #e0e0f0; border-top-color: #6c63ff;
          border-radius: 50%; animation: gmm-spin 0.6s linear infinite;
        }

        /* ── Settings ── */
        .gmm-field-label {
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.6px;
          text-transform: uppercase; color: #9b9bae; margin-bottom: 8px;
        }
        .gmm-field { margin-bottom: 24px; }
        .gmm-name-row { display: flex; gap: 8px; }
        .gmm-name-input {
          flex: 1; height: 42px; border: 1.5px solid #e8e8f0; border-radius: 11px;
          padding: 0 14px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #0f0f1a; background: #fafafa; outline: none; transition: all 0.2s;
        }
        .gmm-name-input:focus {
          border-color: #6c63ff; background: #fff; box-shadow: 0 0 0 4px rgba(108,99,255,0.1);
        }
        .gmm-name-display {
          flex: 1; height: 42px; border: 1.5px solid #e8e8f0; border-radius: 11px;
          padding: 0 14px; font-size: 14px; color: #0f0f1a; background: #fafafa;
          display: flex; align-items: center;
        }
        .gmm-icon-btn {
          width: 42px; height: 42px; border-radius: 11px; border: 1.5px solid #e8e8f0;
          background: #fafafa; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #6b6b80; transition: all 0.15s; flex-shrink: 0;
        }
        .gmm-icon-btn:hover { background: #f0f0f8; border-color: #d8d8ee; }
        .gmm-save-btn {
          height: 42px; padding: 0 18px; border-radius: 11px; border: none;
          background: linear-gradient(135deg, #6c63ff, #8b82ff); color: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          box-shadow: 0 4px 14px rgba(108,99,255,0.35); transition: all 0.2s; flex-shrink: 0;
        }
        .gmm-save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(108,99,255,0.4); }
        .gmm-save-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }
        .gmm-cancel-btn {
          width: 42px; height: 42px; border-radius: 11px; border: 1.5px solid #e8e8f0;
          background: #fafafa; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #6b6b80; transition: all 0.15s; flex-shrink: 0;
        }
        .gmm-cancel-btn:hover { background: #fff0f0; border-color: #ffd0d0; color: #ef4444; }

        /* ── Privacy Toggle ── */
        .gmm-privacy-section {
          margin-bottom: 24px; padding: 18px 20px; border-radius: 14px;
          border: 1.5px solid #ececf4; background: #fafafa;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .gmm-privacy-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
        .gmm-privacy-icon-wrap {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s;
        }
        .gmm-privacy-icon-wrap.public { background: #ecfdf5; color: #059669; }
        .gmm-privacy-icon-wrap.private { background: #f0f0f8; color: #6c63ff; }
        .gmm-privacy-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .gmm-privacy-title { font-size: 14px; font-weight: 600; color: #0f0f1a; }
        .gmm-privacy-desc { font-size: 12px; color: #9b9bae; line-height: 1.4; }

        /* Toggle switch */
        .gmm-toggle-wrap { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .gmm-toggle-label { font-size: 12px; font-weight: 600; color: #9b9bae; transition: color 0.2s; }
        .gmm-toggle-label.active { color: #6c63ff; }
        .gmm-toggle {
          position: relative; width: 44px; height: 24px;
          cursor: pointer; flex-shrink: 0;
        }
        .gmm-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .gmm-toggle-track {
          position: absolute; inset: 0; border-radius: 24px;
          background: #e0e0f0; transition: background 0.25s;
        }
        .gmm-toggle input:checked ~ .gmm-toggle-track { background: #6c63ff; }
        .gmm-toggle-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .gmm-toggle input:checked ~ .gmm-toggle-thumb { transform: translateX(20px); }
        .gmm-toggle-spinner {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }

        .gmm-danger-zone {
          margin-top: 32px; padding: 20px; border-radius: 14px;
          border: 1.5px solid #fde8e8; background: #fff9f9;
        }
        .gmm-danger-title {
          font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
          text-transform: uppercase; color: #ef4444; margin: 0 0 6px;
        }
        .gmm-danger-desc { font-size: 13px; color: #9b9bae; margin: 0 0 16px; }
        .gmm-delete-btn {
          width: 100%; height: 42px; border-radius: 11px; border: none;
          background: #ef4444; color: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
        }
        .gmm-delete-btn:hover { background: #dc2626; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(239,68,68,0.35); }
      `}</style>

      <div className="gmm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="gmm-modal">

          {/* Sidebar */}
          <div className="gmm-sidebar">
            <div className="gmm-sidebar-top">
              <div className="gmm-group-avatar">👥</div>
              <p className="gmm-group-name">{newName}</p>
              <p className="gmm-group-meta">{members.length} members</p>
            </div>
            <nav className="gmm-nav">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isPendingTab = tab.id === "pending";
                return (
                  <button
                    key={tab.id}
                    className={`gmm-nav-item ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="gmm-nav-icon" />
                    {tab.label}
                    {tab.count !== null
                      ? <span className={`gmm-nav-count ${isPendingTab ? "pending-count" : ""}`}>{tab.count}</span>
                      : <ChevronRight className="gmm-nav-arrow" />
                    }
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="gmm-content">
            <div className="gmm-content-header">
              <div>
                <p className="gmm-content-title">
                  {activeTab === "members" ? "Members"
                    : activeTab === "pending" ? "Pending Requests"
                    : "Group Settings"}
                </p>
                <p className="gmm-content-subtitle">
                  {activeTab === "members"
                    ? `${members.length} people in this group`
                    : activeTab === "pending"
                    ? `${pendingMembers.length} request${pendingMembers.length !== 1 ? "s" : ""} waiting for approval`
                    : "Manage group name and preferences"}
                </p>
              </div>
              <button className="gmm-close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="gmm-content-body">

              {/* Members tab */}
              {activeTab === "members" && (
                <div>
                  {loading ? (
                    <div className="gmm-loading">
                      <span className="gmm-spinner" /> Loading members…
                    </div>
                  ) : (
                    <div>
                      {members.length === 0 && (
                        <div className="gmm-empty">
                          <div className="gmm-empty-icon"><Users style={{ width: 20, height: 20 }} /></div>
                          <span className="gmm-empty-text">No members yet</span>
                        </div>
                      )}
                      {members.map((member) => {
                        const isAdmin = member.role === "ADMIN";
                        const isSelf  = member.id === currentUser?.id;
                        const canRemove = !isAdmin && !isSelf;

                        return (
                          <div key={member.id} className="gmm-member-row">
                            <div className="gmm-member-left">
                              {member.avatar
                                ? <img src={member.avatar} className="gmm-avatar" alt={member.fullName} />
                                : (
                                  <div className="gmm-avatar-placeholder">
                                    {member.fullName?.charAt(0).toUpperCase()}
                                  </div>
                                )
                              }
                              <div className="gmm-member-info">
                                <span className="gmm-member-name">{member.fullName}</span>
                                <span className={`gmm-role-badge ${isAdmin ? "admin" : "member"}`}>
                                  {isAdmin && <Shield className="gmm-shield-icon" />}
                                  {isAdmin ? "Admin" : "Member"}
                                </span>
                              </div>
                            </div>

                            <button
                              className="gmm-remove-btn"
                              disabled={!canRemove}
                              onClick={() => canRemove && handleRemoveMember(member.id)}
                              title={
                                isAdmin ? "Cannot remove admin"
                                : isSelf  ? "Cannot remove yourself"
                                : "Remove member"
                              }
                            >
                              <UserMinus style={{ width: 15, height: 15 }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Pending tab */}
              {activeTab === "pending" && (
                <div>
                  {loadingPending ? (
                    <div className="gmm-loading">
                      <span className="gmm-spinner" /> Loading requests…
                    </div>
                  ) : (
                    <div>
                      {pendingMembers.length === 0 && (
                        <div className="gmm-empty">
                          <div className="gmm-empty-icon"><Clock style={{ width: 20, height: 20 }} /></div>
                          <span className="gmm-empty-text">No pending requests</span>
                        </div>
                      )}
                      {pendingMembers.map((member) => {
                        const isProcessing = processingIds.has(member.userId);
                        return (
                          <div key={member.userId} className="gmm-member-row">
                            <div className="gmm-member-left">
                              {member.avatar
                                ? <img src={member.avatar} className="gmm-avatar" alt={member.fullName} />
                                : (
                                  <div className="gmm-avatar-placeholder">
                                    {member.fullName?.charAt(0).toUpperCase()}
                                  </div>
                                )
                              }
                              <div className="gmm-member-info">
                                <span className="gmm-member-name">{member.fullName}</span>
                                <span className="gmm-role-badge pending-badge">
                                  <Clock style={{ width: 10, height: 10 }} />
                                  Pending
                                </span>
                              </div>
                            </div>

                            <div className="gmm-pending-actions">
                              <button
                                className="gmm-approve-btn"
                                disabled={isProcessing}
                                onClick={() => handleApproveMember(member.userId)}
                                title="Approve member"
                              >
                                {isProcessing
                                  ? <span style={{ width:12,height:12,border:"2px solid rgba(5,150,105,0.3)",borderTopColor:"#059669",borderRadius:"50%",animation:"gmm-spin 0.6s linear infinite",display:"inline-block" }} />
                                  : <CheckCircle style={{ width: 13, height: 13 }} />
                                }
                                Approve
                              </button>
                              <button
                                className="gmm-reject-btn"
                                disabled={isProcessing}
                                onClick={() => handleRejectMember(member.userId)}
                                title="Reject request"
                              >
                                {isProcessing
                                  ? <span style={{ width:12,height:12,border:"2px solid rgba(239,68,68,0.3)",borderTopColor:"#ef4444",borderRadius:"50%",animation:"gmm-spin 0.6s linear infinite",display:"inline-block" }} />
                                  : <XCircle style={{ width: 13, height: 13 }} />
                                }
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Settings tab */}
              {activeTab === "settings" && (
                <div>
                  <div className="gmm-field">
                    <div className="gmm-field-label">Group Name</div>
                    <div className="gmm-name-row">
                      {editingName ? (
                        <>
                          <input
                            className="gmm-name-input"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                          />
                          <button className="gmm-save-btn" onClick={handleUpdateName} disabled={savingName}>
                            {savingName
                              ? <span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"gmm-spin 0.6s linear infinite",display:"inline-block" }} />
                              : <Check style={{ width:15, height:15 }} />
                            }
                            Save
                          </button>
                          <button className="gmm-cancel-btn" onClick={() => { setEditingName(false); setNewName(group.name); }}>
                            <X style={{ width: 15, height: 15 }} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="gmm-name-display">{newName}</div>
                          <button className="gmm-icon-btn" onClick={() => setEditingName(true)} title="Edit name">
                            <Edit3 style={{ width: 15, height: 15 }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Privacy toggle */}
                  <div className="gmm-field">
                    <div className="gmm-field-label">Privacy</div>
                    <div className="gmm-privacy-section">
                      <div className="gmm-privacy-left">
                        <div className={`gmm-privacy-icon-wrap ${isPrivate ? "private" : "public"}`}>
                          {isPrivate
                            ? <Lock style={{ width: 18, height: 18 }} />
                            : <Globe style={{ width: 18, height: 18 }} />
                          }
                        </div>
                        <div className="gmm-privacy-text">
                          <span className="gmm-privacy-title">
                            {isPrivate ? "Private Group" : "Public Group"}
                          </span>
                          <span className="gmm-privacy-desc">
                            {isPrivate
                              ? "Only approved members can see posts and join this group."
                              : "Anyone can see the group and its posts. Members can join freely."}
                          </span>
                        </div>
                      </div>

                      <div className="gmm-toggle-wrap">
                        <span className={`gmm-toggle-label ${!isPrivate ? "active" : ""}`}>Public</span>
                        <label className="gmm-toggle" title={togglingPrivacy ? "Updating…" : isPrivate ? "Switch to Public" : "Switch to Private"}>
                          <input
                            type="checkbox"
                            checked={isPrivate}
                            disabled={togglingPrivacy}
                            onChange={handleTogglePrivacy}
                          />
                          <div className="gmm-toggle-track" />
                          {togglingPrivacy
                            ? (
                              <div className="gmm-toggle-spinner">
                                <span style={{ width:12,height:12,border:"2px solid rgba(108,99,255,0.25)",borderTopColor:"#6c63ff",borderRadius:"50%",animation:"gmm-spin 0.6s linear infinite",display:"inline-block" }} />
                              </div>
                            )
                            : <div className="gmm-toggle-thumb" />
                          }
                        </label>
                        <span className={`gmm-toggle-label ${isPrivate ? "active" : ""}`}>Private</span>
                      </div>
                    </div>
                  </div>

                  <div className="gmm-danger-zone">
                    <p className="gmm-danger-title">Danger Zone</p>
                    <p className="gmm-danger-desc">
                      Permanently delete this group and remove all members. This action cannot be undone.
                    </p>
                    <button className="gmm-delete-btn" onClick={handleDeleteGroup}>
                      <Trash2 style={{ width: 15, height: 15 }} />
                      Delete Group
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  );
}