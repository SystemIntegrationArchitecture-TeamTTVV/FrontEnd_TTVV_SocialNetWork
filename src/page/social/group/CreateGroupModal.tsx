import { useEffect, useState } from "react";
import { getFriends } from "../../../apis/friendRequests";
import { groupsApi } from "../../../apis/groupsApi";
import { useTranslation } from "react-i18next";

interface Friend {
    id: string;
    name?: string;
    avatar?: string;
}

interface Props {
    userId: string;
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateGroupModal({ userId, onClose, onCreated }: Props) {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        const data = await getFriends(userId);
        setFriends(data);
    };

    const toggle = (id: string) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id]
        );
    };

const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
        const group = await groupsApi.createGroup({
            name,
            adminId: userId,
            privacy,   // <-- thêm đây
        });

        if (!group.id) {
            console.error("Group id missing");
            setLoading(false);
            return;
        }

        // Auto-link Messenger Chat
        try {
            // we need to dynamically import conversationsApi to avoid circular deps if any, but it's probably fine at the top level
            const { conversationsApi } = await import('../../../apis/conversations');
            
            // Collect all members (admin + selected friends)
            const participantIds = [userId, ...selected];
            
            const conv = await conversationsApi.createGroupConversation({
                participantIds: participantIds,
                ownerId: userId,
                isGroup: true,
                groupName: name,
                groupAvatar: '', // Or group avatar if we have one
            });
            
            // Update group with linked conversation id
            await groupsApi.updateGroup(group.id, { linkedConversationId: conv.id });
            
        } catch (chatError) {
            console.error("Failed to auto-link messenger chat", chatError);
        }

        if (selected.length > 0) {
            await groupsApi.addMembers(group.id, selected);
        }

        onCreated();
        onClose();
    } catch (error) {
        console.error("Failed to create group:", error);
        setLoading(false);
    }
};

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

                .cgm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(10, 10, 20, 0.55);
                    backdrop-filter: blur(6px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: cgm-fadeIn 0.2s ease;
                }

                @keyframes cgm-fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes cgm-slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .cgm-modal {
                    font-family: 'DM Sans', sans-serif;
                    background: #ffffff;
                    width: 420px;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
                    animation: cgm-slideUp 0.25s ease;
                }

                .cgm-header {
                    padding: 24px 24px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .cgm-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #0f0f1a;
                    letter-spacing: -0.3px;
                    margin: 0;
                }

                .cgm-subtitle {
                    font-size: 13px;
                    color: #9b9bae;
                    margin: 4px 0 0;
                }

                .cgm-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: none;
                    background: #f4f4f8;
                    color: #6b6b80;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.15s, color 0.15s;
                    flex-shrink: 0;
                }

                .cgm-close:hover {
                    background: #ececf2;
                    color: #0f0f1a;
                }

                .cgm-body {
                    padding: 20px 24px 24px;
                }

                .cgm-label {
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                    color: #9b9bae;
                    margin-bottom: 8px;
                }

                .cgm-input-wrap {
                    position: relative;
                    margin-bottom: 20px;
                }

                .cgm-input {
                    width: 100%;
                    padding: 11px 14px 11px 40px;
                    border: 1.5px solid #e8e8f0;
                    border-radius: 12px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    color: #0f0f1a;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    background: #fafafa;
                    box-sizing: border-box;
                }

                .cgm-input::placeholder { color: #c4c4d0; }

                .cgm-input:focus {
                    border-color: #6c63ff;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(108, 99, 255, 0.1);
                }

                .cgm-input-icon {
                    position: absolute;
                    left: 13px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #c4c4d0;
                    font-size: 15px;
                    pointer-events: none;
                }

                .cgm-section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .cgm-badge {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 20px;
                    background: #6c63ff18;
                    color: #6c63ff;
                }

                .cgm-list {
                    max-height: 220px;
                    overflow-y: auto;
                    border: 1.5px solid #e8e8f0;
                    border-radius: 14px;
                    background: #fafafa;
                    padding: 6px;
                    scrollbar-width: thin;
                    scrollbar-color: #e0e0f0 transparent;
                }

                .cgm-list::-webkit-scrollbar { width: 4px; }
                .cgm-list::-webkit-scrollbar-thumb { background: #e0e0f0; border-radius: 4px; }

                .cgm-friend {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 10px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.15s;
                    user-select: none;
                }

                .cgm-friend:hover { background: #f0f0f8; }

                .cgm-friend.selected { background: #6c63ff12; }

                .cgm-checkbox {
                    width: 18px;
                    height: 18px;
                    border-radius: 6px;
                    border: 1.5px solid #d0d0e0;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.15s;
                }

                .cgm-friend.selected .cgm-checkbox {
                    background: #6c63ff;
                    border-color: #6c63ff;
                }

                .cgm-checkmark {
                    color: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    display: none;
                }

                .cgm-friend.selected .cgm-checkmark { display: block; }

                .cgm-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    object-fit: cover;
                    background: #e8e8f4;
                    flex-shrink: 0;
                    border: 2px solid #fff;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
                }

                .cgm-friend-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #1a1a2e;
                    flex: 1;
                }

                .cgm-divider {
                    height: 1px;
                    background: #f0f0f6;
                    margin: 20px 0 0;
                }

                .cgm-footer {
                    padding: 16px 24px 20px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }

                .cgm-btn-cancel {
                    padding: 9px 18px;
                    border: 1.5px solid #e8e8f0;
                    border-radius: 10px;
                    background: transparent;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: #6b6b80;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .cgm-btn-cancel:hover {
                    background: #f4f4f8;
                    border-color: #d8d8e8;
                }

                .cgm-btn-create {
                    padding: 9px 22px;
                    border: none;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #6c63ff, #8b82ff);
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 14px rgba(108, 99, 255, 0.35);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .cgm-btn-create:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(108, 99, 255, 0.45);
                }

                .cgm-btn-create:active:not(:disabled) {
                    transform: translateY(0);
                }

                .cgm-btn-create:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                .cgm-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.4);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: cgm-spin 0.6s linear infinite;
                }

                @keyframes cgm-spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div className="cgm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="cgm-modal">

                    {/* Header */}
                    <div className="cgm-header">
                        <div>
                            <p className="cgm-title">{t("groupPage.createTitle")}</p>
                            <p className="cgm-subtitle">{t("groupPage.createSubtitle")}</p>
                        </div>
                        <button type="button" className="cgm-close" onClick={onClose}>✕</button>
                    </div>

                    {/* Body */}
                    <div className="cgm-body">

                        {/* Group name input */}
                        <div className="cgm-label">{t("groupPage.createGroupName")}</div>
                        <div className="cgm-input-wrap">
                            <span className="cgm-input-icon">✦</span>
                            <input
                                className="cgm-input"
                                placeholder={t("groupPage.createNamePlaceholder")}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        {/* Privacy selection */}
                        <div className="cgm-label">{t("groupPage.createGroupType")}</div>
                        <div className="flex gap-3 mb-4">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg font-medium transition ${privacy === 'PUBLIC'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                onClick={() => setPrivacy('PUBLIC')}
                            >
                                {t("groupPage.createPublic")}
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg font-medium transition ${privacy === 'PRIVATE'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                onClick={() => setPrivacy('PRIVATE')}
                            >
                                {t("groupPage.createPrivate")}
                            </button>
                        </div>
                        {/* Friends list */}
                        <div className="cgm-section-header">
                            <div className="cgm-label" style={{ margin: 0 }}>{t("groupPage.createAddMembers")}</div>
                            {selected.length > 0 && (
                                <span className="cgm-badge">{t("groupPage.createSelected", { count: selected.length })}</span>
                            )}
                        </div>

                        <div className="cgm-list">
                            {friends.length === 0 && (
                                <div style={{ padding: "16px", textAlign: "center", color: "#c4c4d0", fontSize: "13px" }}>
                                    {t("groupPage.createNoFriends")}
                                </div>
                            )}
                            {friends.map(f => (
                                <div
                                    key={f.id}
                                    className={`cgm-friend ${selected.includes(f.id) ? "selected" : ""}`}
                                    onClick={() => toggle(f.id)}
                                >
                                    <div className="cgm-checkbox">
                                        <span className="cgm-checkmark">✓</span>
                                    </div>
                                    <img
                                        src={f.avatar || "/avatar.png"}
                                        className="cgm-avatar"
                                        alt={f.name}
                                    />
                                    <span className="cgm-friend-name">{f.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="cgm-divider" />
                    <div className="cgm-footer">
                        <button type="button" className="cgm-btn-cancel" onClick={onClose}>
                            {t("groupPage.createCancel")}
                        </button>
                        <button
                            type="button"
                            className="cgm-btn-create"
                            onClick={handleCreate}
                            disabled={!name.trim() || loading}
                        >
                            {loading ? <span className="cgm-spinner" /> : "✦"}
                            {loading ? t("groupPage.createCreating") : t("groupPage.createButton")}
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}