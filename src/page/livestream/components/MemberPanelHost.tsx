import { useMemo, useState } from 'react';
import { useParticipants } from '@livekit/components-react';
import { livestreamApi } from '../../../apis/livestream';
import { Users, Link2, Shield } from 'lucide-react';

type Props = {
  streamId: string;
  roomName: string;
  hostUserId: string;
  /** Gắn trong sidebar ThamKhao — bỏ viền/card ngoài */
  embedded?: boolean;
  /** Người xem: chỉ chia sẻ + danh sách, không duyệt/kick */
  viewerMode?: boolean;
};

function parseMeta(metadata: string | undefined): { status?: string; isHost?: boolean } {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata) as { status?: string; isHost?: boolean };
  } catch {
    return {};
  }
}

/**
 * Panel host: chia sẻ link, danh sách participant LiveKit, duyệt / kick (giống ThamKhao MemberPanel).
 */
const VIOLET = '#1877F2';

export default function MemberPanelHost({
  streamId,
  roomName,
  hostUserId,
  embedded,
  viewerMode = false,
}: Props) {
  const participants = useParticipants();
  const [tab, setTab] = useState<'share' | 'members'>(embedded && !viewerMode ? 'members' : 'share');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const { approved, waiting } = useMemo(() => {
    const appr: typeof participants = [];
    const wait: typeof participants = [];
    for (const p of participants) {
      const m = parseMeta(p.metadata);
      if (m.status === 'waiting') wait.push(p);
      else appr.push(p);
    }
    return { approved: appr, waiting: wait };
  }, [participants]);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/livestream/${streamId}`
      : '';
  const shareText = `Tham gia live: ${shareUrl}\nMã phòng LiveKit: ${roomName}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const approve = async (identity: string) => {
    setBusy(`appr-${identity}`);
    try {
      await livestreamApi.approveViewer(streamId, hostUserId, identity);
    } finally {
      setBusy(null);
    }
  };

  const kick = async (identity: string) => {
    if (!window.confirm('Kick người này khỏi phòng?')) return;
    setBusy(`kick-${identity}`);
    try {
      await livestreamApi.kickViewer(streamId, hostUserId, identity);
    } finally {
      setBusy(null);
    }
  };

  const filtered = (list: typeof participants) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => (p.name || p.identity || '').toLowerCase().includes(q));
  };

  const shell = embedded
    ? 'flex flex-col h-full min-h-0 overflow-hidden flex-1 bg-transparent'
    : 'flex flex-col h-full min-h-[280px] rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] overflow-hidden';

  const tabClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
      active
        ? 'text-blue-700 dark:text-blue-300 border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
        : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
    }`;

  return (
    <div className={shell}>
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button type="button" onClick={() => setTab('share')} className={tabClass(tab === 'share')}>
          <Link2 className="w-3.5 h-3.5" />
          Chia sẻ
        </button>
        <button type="button" onClick={() => setTab('members')} className={tabClass(tab === 'members')}>
          <Users className="w-3.5 h-3.5" />
          Thành viên ({approved.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'share' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-[#f0f2f5] dark:bg-[#22263a] p-3 border border-[#e4e6eb] dark:border-[#2b2f45]">
              <p className="text-[10px] font-bold text-[#65676b] uppercase tracking-wide">Mã phòng</p>
              <p className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300 mt-1 break-all">
                {roomName}
              </p>
            </div>
            <p className="text-xs text-[#65676b] dark:text-[#7e89a6] leading-relaxed break-words">{shareText}</p>
            <button
              type="button"
              onClick={() => copy(shareText)}
              className="w-full py-2.5 rounded-2xl text-white text-sm font-bold shadow-sm"
              style={{ backgroundColor: VIOLET }}
            >
              Sao chép lời mời
            </button>
            <button
              type="button"
              onClick={() => copy(roomName)}
              className="w-full py-2 rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] text-sm font-medium"
            >
              Chỉ copy mã phòng
            </button>
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-3">
            <input
              type="search"
              placeholder="Tìm thành viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-[#f0f2f5] dark:bg-[#22263a] border border-[#e4e6eb] dark:border-[#2b2f45] text-[#050505] dark:text-white"
            />

            <div className="text-xs font-bold text-slate-800 dark:text-white mb-1">Thành viên hiện tại</div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <Shield className="w-3 h-3 text-emerald-600" />
              Trong phòng
            </div>
            {filtered(approved).length === 0 ? (
              <p className="text-xs text-center text-[#65676b] py-4">Chưa có ai (hoặc không khớp tìm kiếm)</p>
            ) : (
              <ul className="space-y-2">
                {filtered(approved).map((p) => (
                  <li
                    key={p.identity}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#f8fafc] dark:bg-[#22263a] border border-[#e4e6eb] dark:border-[#2b2f45]"
                  >
                    <div
                      className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: VIOLET }}
                    >
                      {(p.name || p.identity || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#050505] dark:text-white truncate">
                        {p.name || p.identity}
                      </p>
                      {p.identity === hostUserId && (
                        <p className="text-[10px] text-emerald-600 font-medium">
                          {viewerMode ? '(Chủ phòng)' : '(Bạn)'}
                        </p>
                      )}
                    </div>
                    {!viewerMode && p.identity !== hostUserId && (
                      <button
                        type="button"
                        disabled={busy === `kick-${p.identity}`}
                        onClick={() => kick(p.identity)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500 text-white disabled:opacity-50"
                      >
                        Kick
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!viewerMode && (
              <>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 pt-3">Chờ duyệt</div>
                {filtered(waiting).length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                    {search.trim() ? 'Không tìm thấy' : 'Không có yêu cầu nào'}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {filtered(waiting).map((p) => (
                      <li
                        key={p.identity}
                        className="flex items-center gap-2 p-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20"
                      >
                        <div className="flex-1 min-w-0 text-xs font-medium truncate">{p.name || p.identity}</div>
                        <button
                          type="button"
                          disabled={busy === `appr-${p.identity}`}
                          onClick={() => approve(p.identity)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white"
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          disabled={busy === `kick-${p.identity}`}
                          onClick={() => kick(p.identity)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-500 text-white"
                        >
                          Từ chối
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
