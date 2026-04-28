import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const MOCK_FRIENDS = [
  { id: 'anh', name: 'Anh' },
  { id: 'bao', name: 'Bảo' },
  { id: 'chi', name: 'Chị' },
  { id: 'duy', name: 'Duy' },
  { id: 'em', name: 'Em' },
];

function createRoomCode() {
  return `BB-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function BombermanMultiplayer() {
  const [roomCode, setRoomCode] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [newFriendId, setNewFriendId] = useState('');
  const [invitedPlayers, setInvitedPlayers] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'created' | 'started'>('idle');

  const canStart = invitedPlayers.length >= 3;

  const availableFriends = useMemo(() => {
    return MOCK_FRIENDS.filter((friend) => !invitedPlayers.includes(friend.id));
  }, [invitedPlayers]);

  const handleCreateRoom = () => {
    const code = createRoomCode();
    setRoomCode(code);
    setInviteLink(`${window.location.origin}/games/bomberman/friends?room=${code}`);
    setStatus('created');
    setInvitedPlayers([]);
  };

  const inviteFriend = (friendId: string) => {
    setInvitedPlayers((prev) => Array.from(new Set([...prev, friendId])));
  };

  const handleAddCustomInvite = () => {
    const trimmed = newFriendId.trim().toLowerCase();
    if (!trimmed || invitedPlayers.includes(trimmed)) return;
    setInvitedPlayers((prev) => [...prev, trimmed]);
    setNewFriendId('');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Bomberman Friends (iFrame riêng)
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-[#9aa3bc] max-w-2xl">
            Đây là module xây riêng để mở rộng Bomberman multiplayer, giữ nguyên code bot hiện tại và tránh đụng chạm.
          </p>
        </div>
        <Link
          to="/games/bomberman"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400"
        >
          Trở về Bomberman hiện tại
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b2f45] dark:bg-[#11131f]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Phòng chơi Bomberman
              </p>
              <h2 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
                Tạo phòng riêng, mời tối đa 4 người
              </h2>
            </div>
            <button
              onClick={handleCreateRoom}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Tạo phòng mới
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-gray-100 p-4 dark:bg-[#141824]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Trạng thái</p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {status === 'idle' && 'Chưa khởi tạo phòng'}
                {status === 'created' && 'Phòng đã tạo'}
                {status === 'started' && 'Đã bắt đầu'}
              </p>
            </div>

            {status !== 'idle' && (
              <div className="grid gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-[#10131f]">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mã phòng</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{roomCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Link mời</p>
                  <div className="mt-1 break-all rounded-2xl bg-white p-3 text-sm text-gray-700 shadow-sm dark:bg-[#161b2c] dark:text-gray-200">
                    {inviteLink}
                  </div>
                </div>
              </div>
            )}

            {status !== 'idle' && (
              <div className="rounded-2xl border border-dashed border-gray-200 p-4 dark:border-[#2a2f45]">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Danh sách mời</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{invitedPlayers.length}/3</span>
                </div>

                <div className="mt-3 space-y-2">
                  {invitedPlayers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có ai được mời.</p>
                  ) : (
                    invitedPlayers.map((player) => (
                      <div key={player} className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm shadow-sm dark:bg-[#141824]">
                        <span>{player}</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                          Chờ vào phòng
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {status !== 'idle' && (
              <button
                onClick={() => setStatus('started')}
                disabled={!canStart}
                className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
                  canStart
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'cursor-not-allowed bg-gray-300 text-gray-600 dark:bg-[#2a2f45] dark:text-gray-500'
                }`}
              >
                {canStart ? 'Bắt đầu khi đủ 4 người' : 'Cần mời thêm 3 người'}
              </button>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b2f45] dark:bg-[#11131f]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mời bạn bè</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Chọn bạn bè trong danh sách hoặc nhập ID để mời vào phòng.
          </p>

          <div className="mt-4 space-y-3">
            {availableFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => inviteFriend(friend.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 transition hover:border-blue-300 hover:bg-blue-50 dark:border-[#21263f] dark:bg-[#10131f] dark:text-gray-100 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
              >
                <span>{friend.name}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Mời</span>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-gray-900/5 p-4 dark:bg-white/5">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Mời bằng ID
            </label>
            <div className="mt-3 flex gap-2">
              <input
                value={newFriendId}
                onChange={(event) => setNewFriendId(event.target.value)}
                placeholder="nhập id bạn bè"
                className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-[#21263f] dark:bg-[#0d1120] dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
              />
              <button
                onClick={handleAddCustomInvite}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Thêm
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
