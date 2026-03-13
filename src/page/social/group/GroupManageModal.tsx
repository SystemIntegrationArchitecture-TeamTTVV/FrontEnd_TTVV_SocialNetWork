import { useEffect, useState } from "react";
import { groupsApi, type GroupData } from "../../../apis/groupsApi";
import { Trash2, Users, Edit3, Settings, ChevronRight, Check, X, UserMinus, Shield } from "lucide-react";
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

type Tab = "members" | "settings";

export default function GroupManageModal({ group, onClose }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("members");

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [savingName, setSavingName] = useState(false);

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

      // Fetch role for each member in parallel
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

  useEffect(() => { loadMembers(); }, []);

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

  const tabs = [
    { id: "members" as Tab, label: "Members", icon: Users, count: members.length },
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
                return (
                  <button
                    key={tab.id}
                    className={`gmm-nav-item ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="gmm-nav-icon" />
                    {tab.label}
                    {tab.count !== null
                      ? <span className="gmm-nav-count">{tab.count}</span>
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
                  {activeTab === "members" ? "Members" : "Group Settings"}
                </p>
                <p className="gmm-content-subtitle">
                  {activeTab === "members"
                    ? `${members.length} people in this group`
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
                        <div style={{ textAlign: "center", color: "#c4c4d0", fontSize: "13px", padding: "32px 0" }}>
                          No members yet
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