import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Shield, Users, Lock } from 'lucide-react';
import { conversationsApi, type Conversation } from '../../apis/conversations';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, type User } from '../../apis/users';

export default function ConversationSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [approvalsRequired, setApprovalsRequired] = useState(false);
  const [onlyAdminsCanSend, setOnlyAdminsCanSend] = useState(false);
  const [onlyAdminsCanAddMembers, setOnlyAdminsCanAddMembers] = useState(true);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberCandidates, setMemberCandidates] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = !!(
    user?.id && conversation && (conversation.ownerId === user.id || conversation.adminIds?.includes(user.id))
  );

  const memberRows = useMemo(() => {
    const ids = conversation?.participantIds || [];
    const names = conversation?.participantNames || [];
    return ids.map((participantId, idx) => ({
      participantId,
      name: names[idx] || participantId,
      isOwner: conversation?.ownerId === participantId,
      isAdmin: conversation?.adminIds?.includes(participantId) || false,
    }));
  }, [conversation]);

  const loadConversation = async () => {
    if (!id) return;
    const data = await conversationsApi.getConversationById(id);
    setConversation(data);
    setGroupName(data.groupName || 'Group Chat');
    setDescription(data.description || '');
    setApprovalsRequired(!!data.approvalsRequired);
    setOnlyAdminsCanSend(!!data.onlyAdminsCanSend);
    setOnlyAdminsCanAddMembers(data.onlyAdminsCanAddMembers ?? true);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    loadConversation()
      .catch((err: any) => setError(err?.message || 'Cannot load conversation settings'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const q = memberQuery.trim();
    if (!q) {
      setMemberCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const found = await usersApi.searchUsers(q);
        const existing = new Set(conversation?.participantIds || []);
        setMemberCandidates(found.filter((u) => !!u.id && !existing.has(u.id!)));
      } catch {
        setMemberCandidates([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [memberQuery, conversation?.participantIds]);

  const saveSettings = async () => {
    if (!id || !user?.id || !canManage) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await conversationsApi.updateConversationMeta(id, {
        requesterId: user.id,
        groupName,
        description,
        approvalsRequired,
        onlyAdminsCanSend,
        onlyAdminsCanAddMembers,
      });
      setConversation(updated);
    } catch (err: any) {
      setError(err?.message || 'Save settings failed');
    } finally {
      setSaving(false);
    }
  };

  const addMembers = async () => {
    if (!id || !user?.id || selectedMemberIds.length === 0) return;

    try {
      const updated = await conversationsApi.addGroupMembers(id, {
        requesterId: user.id,
        participantIds: selectedMemberIds,
      });
      setConversation(updated);
      setSelectedMemberIds([]);
      setMemberQuery('');
      setMemberCandidates([]);
    } catch (err: any) {
      setError(err?.message || 'Add members failed');
    }
  };

  const removeMember = async (participantId: string) => {
    if (!id || !user?.id) return;

    try {
      const updated = await conversationsApi.removeGroupMember(id, {
        requesterId: user.id,
        participantId,
      });
      setConversation(updated);
    } catch (err: any) {
      setError(err?.message || 'Remove member failed');
    }
  };

  const hideConversation = async () => {
    if (!id || !user?.id || !pin.trim()) {
      setError('PIN is required');
      return;
    }

    try {
      await conversationsApi.hideConversation(id, { userId: user.id, pin: pin.trim() });
      navigate('/messenger');
    } catch (err: any) {
      setError(err?.message || 'Hide conversation failed');
    }
  };

  const leaveGroup = async () => {
    if (!id || !user?.id) return;

    try {
      await conversationsApi.leaveGroup(id, { requesterId: user.id });
      navigate('/messenger');
    } catch (err: any) {
      setError(err?.message || 'Leave group failed');
    }
  };

  if (loading) {
    return <div className="h-screen bg-white flex items-center justify-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">Conversation Settings</h1>
            <p className="text-xs text-gray-500 truncate">{conversation?.groupName || 'Group Chat'}</p>
          </div>
        </div>
      </div>

      {error && <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <section className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Basic Info</h2>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300"
            placeholder="Group name"
            disabled={!canManage}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300"
            placeholder="Description"
            disabled={!canManage}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={approvalsRequired} onChange={(e) => setApprovalsRequired(e.target.checked)} disabled={!canManage} />
              Require join approvals
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={onlyAdminsCanSend} onChange={(e) => setOnlyAdminsCanSend(e.target.checked)} disabled={!canManage} />
              Only admin can send messages
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" checked={onlyAdminsCanAddMembers} onChange={(e) => setOnlyAdminsCanAddMembers(e.target.checked)} disabled={!canManage} />
              Only admin can add members
            </label>
          </div>

          {canManage && (
            <button
              onClick={saveSettings}
              disabled={saving}
              className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </section>

        <section className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4" /> Members
          </h2>

          <input
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300"
            placeholder="Search user to add"
            disabled={!canManage && onlyAdminsCanAddMembers}
          />

          <div className="max-h-28 overflow-y-auto space-y-1">
            {memberCandidates.map((candidate) => {
              const candidateId = candidate.id || '';
              const selected = selectedMemberIds.includes(candidateId);
              return (
                <button
                  key={candidateId}
                  onClick={() => {
                    if (!candidateId) return;
                    setSelectedMemberIds((prev) => selected ? prev.filter((x) => x !== candidateId) : [...prev, candidateId]);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                >
                  {candidate.fullName || candidate.username || candidateId}
                </button>
              );
            })}
          </div>

          <button
            onClick={addMembers}
            disabled={selectedMemberIds.length === 0 || (!canManage && onlyAdminsCanAddMembers)}
            className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
          >
            Add {selectedMemberIds.length} members
          </button>

          <div className="border-t border-gray-200 pt-2 space-y-1">
            {memberRows.map((member) => (
              <div key={member.participantId} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 text-sm">
                <span>
                  {member.name}
                  {member.isOwner ? ' (owner)' : member.isAdmin ? ' (admin)' : ''}
                </span>
                {canManage && !member.isOwner && (
                  <button onClick={() => removeMember(member.participantId)} className="text-red-600 hover:text-red-700">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border border-gray-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Privacy
          </h2>
          <div className="flex gap-2">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-gray-300"
              placeholder="PIN to hide this group"
            />
            <button onClick={hideConversation} className="h-10 px-3 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm">
              Hide
            </button>
          </div>

          <button onClick={leaveGroup} className="h-10 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm inline-flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Leave group
          </button>
        </section>
      </div>
    </div>
  );
}
