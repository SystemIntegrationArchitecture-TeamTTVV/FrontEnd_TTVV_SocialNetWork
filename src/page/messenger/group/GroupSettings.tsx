// ─── GroupSettings — settings panel for GroupChat ────────────────────────
import {
  Plus, Shield, Lock, ShieldOff, Link2, Copy, Ban,
  VolumeX, Volume2,
} from 'lucide-react';
import type { Conversation } from '../../../apis/conversations';
import type { User } from '../../../apis/users';
import type { PresenceStatus } from '../../../apis/users';

interface MemberRow {
  participantId: string;
  name: string;
  isOwner: boolean;
  isAdmin: boolean;
}

interface GroupSettingsProps {
  conversation: Conversation | null;
  // Settings
  groupName: string;
  onGroupNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  approvalsRequired: boolean;
  onApprovalsRequiredChange: (v: boolean) => void;
  onlyAdminsCanSend: boolean;
  onOnlyAdminsCanSendChange: (v: boolean) => void;
  onlyAdminsCanAddMembers: boolean;
  onOnlyAdminsCanAddMembersChange: (v: boolean) => void;
  canManage: boolean;
  isOwner: boolean;
  onSaveSettings: () => void;
  // Members
  memberQuery: string;
  onMemberQueryChange: (v: string) => void;
  memberCandidates: User[];
  selectedMemberIds: string[];
  onToggleMemberSelection: (id: string) => void;
  onAddMembers: () => void;
  memberRows: MemberRow[];
  presenceByUserId: Record<string, PresenceStatus>;
  onRemoveMember: (id: string) => void;
  onToggleBan: (id: string) => void;
  // Hide / Leave
  pin: string;
  onPinChange: (v: string) => void;
  onHideConversation: () => void;
  onClearConversationForMe: () => void;
  onLeaveGroup: () => void;
  // Mute / Block / Invite
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleBlock: () => void;
  onGetInviteLink: () => void;
  inviteLink: string | null;
  userId?: string;
}

export default function GroupSettings({
  conversation,
  groupName,
  onGroupNameChange,
  description,
  onDescriptionChange,
  approvalsRequired,
  onApprovalsRequiredChange,
  onlyAdminsCanSend,
  onOnlyAdminsCanSendChange,
  onlyAdminsCanAddMembers,
  onOnlyAdminsCanAddMembersChange,
  canManage,
  isOwner,
  onSaveSettings,
  memberQuery,
  onMemberQueryChange,
  memberCandidates,
  selectedMemberIds,
  onToggleMemberSelection,
  onAddMembers,
  memberRows,
  presenceByUserId,
  onRemoveMember,
  onToggleBan,
  pin,
  onPinChange,
  onHideConversation,
  onClearConversationForMe,
  onLeaveGroup,
  isMuted,
  onToggleMute,
  onToggleBlock,
  onGetInviteLink,
  inviteLink,
  userId,
}: GroupSettingsProps) {
  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          className="h-10 px-3 rounded-lg border border-gray-300"
          placeholder="Ten nhom"
        />
        <input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="h-10 px-3 rounded-lg border border-gray-300"
          placeholder="Mo ta nhom"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={approvalsRequired} onChange={(e) => onApprovalsRequiredChange(e.target.checked)} />
          Duyet thanh vien moi
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={onlyAdminsCanSend} onChange={(e) => onOnlyAdminsCanSendChange(e.target.checked)} />
          Chi admin duoc gui
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={onlyAdminsCanAddMembers} onChange={(e) => onOnlyAdminsCanAddMembersChange(e.target.checked)} />
          Chi admin duoc them thanh vien
        </label>
      </div>

      {canManage && (
        <button onClick={onSaveSettings} className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
          Luu cai dat
        </button>
      )}

      <div className="border-t border-gray-200 pt-3 space-y-2">
        <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Them thanh vien
        </div>
        <input
          value={memberQuery}
          onChange={(e) => onMemberQueryChange(e.target.value)}
          className="h-10 px-3 rounded-lg border border-gray-300 w-full"
          placeholder="Tim user de them vao nhom"
        />
        <div className="max-h-28 overflow-y-auto space-y-1">
          {memberCandidates.map((candidate) => {
            const candidateId = candidate.id || '';
            const selected = selectedMemberIds.includes(candidateId);
            return (
              <button
                key={candidateId}
                onClick={() => onToggleMemberSelection(candidateId)}
                className={`w-full text-left px-3 py-2 rounded-lg border ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                {candidate.fullName || candidate.username || candidateId}
              </button>
            );
          })}
        </div>
        <button
          onClick={onAddMembers}
          disabled={!canManage && onlyAdminsCanAddMembers}
          className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
        >
          Them {selectedMemberIds.length} thanh vien
        </button>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Thanh vien trong nhom
        </div>
        <div className="max-h-36 overflow-y-auto space-y-1">
          {memberRows.map((member) => (
            <div key={member.participantId} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${presenceByUserId[member.participantId]?.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                {member.name}
                {member.isOwner ? ' (owner)' : member.isAdmin ? ' (admin)' : ''}
              </span>
              {canManage && !member.isOwner && (
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggleBan(member.participantId)} className="text-orange-600 hover:text-orange-700 inline-flex items-center gap-1" title="Cấm/Bỏ cấm">
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onRemoveMember(member.participantId)} className="text-red-600 hover:text-red-700">
                    Xóa
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Lock className="w-4 h-4" />
          An nhom bang PIN
        </div>
        <input
          value={pin}
          onChange={(e) => onPinChange(e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-300"
          placeholder="Nhap PIN"
          type="password"
        />
        <button onClick={onHideConversation} className="h-9 px-3 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm">
          An nhom
        </button>
        <button onClick={onClearConversationForMe} className="h-9 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
          Xoa cuoc tro chuyen cho toi
        </button>
        {!isOwner && (
          <button onClick={onLeaveGroup} className="h-9 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm">
            Roi nhom
          </button>
        )}
      </div>

      {/* Mute / Block / Invite Link */}
      <div className="border-t border-gray-200 pt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleMute}
          className={`h-9 px-3 rounded-lg text-sm inline-flex items-center gap-2 border ${
            isMuted ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {isMuted ? 'Đã tắt thông báo' : 'Tắt thông báo'}
        </button>

        {!conversation?.isGroup && (
          <button
            onClick={onToggleBlock}
            className={`h-9 px-3 rounded-lg text-sm inline-flex items-center gap-2 border ${
              conversation?.blockedByUserIds?.includes(userId || '') ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ShieldOff className="w-4 h-4" />
            {conversation?.blockedByUserIds?.includes(userId || '') ? 'Bỏ chặn' : 'Chặn'}
          </button>
        )}

        {conversation?.isGroup && (
          <button
            onClick={onGetInviteLink}
            className="h-9 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm inline-flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Lấy link mời
          </button>
        )}
      </div>

      {inviteLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-sm text-blue-800 truncate flex-1">{inviteLink}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(inviteLink); }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
