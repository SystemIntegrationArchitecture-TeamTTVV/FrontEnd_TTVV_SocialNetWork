import { X, Image, Type, ChevronLeft, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { storiesApi } from '../../apis/storiesApi';
import { authApi } from '../../apis/auth';
import type { Story } from '../../types/story';

type MediaState = {
  file: File;
  url: string;
  type: 'image' | 'video';
};

type Props = {
  onClose: () => void;
  onCreate: (story: Story) => void;
};

/** Class lưu xuống BE — StoryViewer dùng trực tiếp làm className */
const BACKGROUND_PRESETS = [
  'bg-linear-to-br from-slate-800 to-slate-950',
  'bg-linear-to-br from-rose-500 to-orange-400',
  'bg-linear-to-br from-emerald-600 to-teal-700',
  'bg-linear-to-br from-violet-600 to-indigo-700',
  'bg-linear-to-br from-sky-500 to-blue-700',
  'bg-linear-to-br from-fuchsia-600 to-pink-600',
] as const;

export default function CreateStoryModal({ onClose, onCreate }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'text' | 'media' | null>(null);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<MediaState | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBg, setSelectedBg] = useState<string>(BACKGROUND_PRESETS[0]);
  /** Chú thích trên ảnh/video (gửi BE field `caption`) */
  const [mediaCaption, setMediaCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());

  if (!currentUser) {
    return null;
  }

  const handleBack = () => {
    if (mode === 'media' && media?.url) {
      URL.revokeObjectURL(media.url);
      setMedia(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMediaCaption('');
    setMode(null);
  };

  const createTextStory = async () => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      const story = await storiesApi.createStory({
        userId: currentUser.id,
        userName: currentUser.fullName,
        userAvatar: currentUser.avatar,
        contentType: 'text',
        content: text,
        background: selectedBg,
        duration: 10,
      });
      onCreate(story);
      onClose();
    } catch (err) {
      console.error('Create text story failed', err);
    } finally {
      setLoading(false);
    }
  };

  const createMediaStory = async () => {
    if (!media) return;
    try {
      setLoading(true);
      const story = await storiesApi.createStory({
        userId: currentUser.id,
        userName: currentUser.fullName,
        userAvatar: currentUser.avatar,
        contentType: media.type,
        duration: media.type === 'video' ? 10 : 5,
        file: media.file,
        caption: mediaCaption.trim() || undefined,
      });
      onCreate(story);
      onClose();
    } catch (err) {
      console.error('Create media story failed', err);
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    mode === null ? t('storyModal.create') : mode === 'text' ? t('storyModal.textStory') : t('storyModal.mediaStory');

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] dark:bg-black/65"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xl dark:border-[#2b2f45] dark:bg-[#14161c]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-story-title"
      >
        {/* Header: gọn, không gradient — có Quay lại khi đã chọn bước */}
        <header className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-3 sm:px-5 dark:border-[#2b2f45]">
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            {mode !== null && (
              <button
                type="button"
                onClick={handleBack}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#252836]"
                aria-label={t('common.back')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 id="create-story-title" className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                {stepTitle}
              </h2>
              <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
                {mode === null
                  ? t('storyModal.chooseMethod')
                  : mode === 'text'
                    ? t('storyModal.textHint')
                    : t('storyModal.mediaHint')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#252836]"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:flex-row sm:gap-6 sm:p-6">
          {/* Cột trái — thao tác */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {!mode && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 px-5 py-8 transition-all hover:border-blue-300 hover:bg-white dark:border-[#2b2f45] dark:bg-[#1a1d24] dark:hover:border-blue-500/50 dark:hover:bg-[#1e2129]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200/80 text-gray-700 dark:bg-[#252836] dark:text-gray-200">
                    <Type className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('storyModal.onlyText')}</span>
                  <span className="text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {t('storyModal.onlyTextDesc')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('media')}
                  className="relative flex flex-col items-center gap-3 rounded-2xl border-2 border-blue-200/80 bg-blue-50/40 px-5 py-8 transition-all hover:border-blue-400 hover:bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-950/20 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/35"
                >
                  <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-blue-500">
                    {t('storyModal.mediaBadge')}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200/80 text-gray-700 dark:bg-[#252836] dark:text-gray-200">
                    <Image className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('storyModal.imageOrVideo')}</span>
                  <span className="text-center text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                    {t('storyModal.imageOrVideoDesc')}
                  </span>
                </button>
              </div>
            )}

            {mode === 'text' && (
              <>
                <label className="sr-only" htmlFor="story-text-input">
                  {t('storyModal.storyContent')}
                </label>
                <textarea
                  id="story-text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('storyModal.thinking')}
                  className="min-h-[140px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-[#2b2f45] dark:bg-[#0c0e14] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500/60 dark:focus:ring-blue-500/20"
                  maxLength={200}
                />
                <p className="text-right text-xs text-gray-400 dark:text-gray-500">{text.length}/200</p>

                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t('storyModal.backgroundColor')}</p>
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUND_PRESETS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setSelectedBg(bg)}
                        className={`h-9 w-9 shrink-0 rounded-lg ring-offset-2 ring-offset-white transition-shadow dark:ring-offset-[#14161c] ${bg} ${
                          selectedBg === bg ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'ring-0 hover:opacity-90'
                        }`}
                        aria-label={t('storyModal.chooseBackground')}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={createTextStory}
                  disabled={loading || !text.trim()}
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('storyModal.shareStory')}
                </button>
              </>
            )}

            {mode === 'media' && (
              <>
                {/* Chữ luôn hiện — hỗ trợ rõ “ảnh + chữ” (gõ chữ trước hoặc sau khi chọn file) */}
                <div className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-[#2b2f45] dark:bg-[#0c0e14]/80">
                  <div className="flex items-start justify-between gap-2">
                    <label htmlFor="story-media-caption" className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {t('storyModal.captionLabel')}
                    </label>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {t('storyModal.optional')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('storyModal.captionHint')}
                  </p>
                  <textarea
                    id="story-media-caption"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    placeholder={t('storyModal.captionPlaceholder')}
                    maxLength={200}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-[#2b2f45] dark:bg-[#14161c] dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                  <p className="text-right text-xs text-gray-400 dark:text-gray-500">{mediaCaption.length}/200</p>
                </div>

                <label className="block cursor-pointer">
                  <div
                    className={`rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                      media
                        ? 'border-blue-300 bg-blue-50/50 dark:border-blue-500/40 dark:bg-blue-950/20'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 dark:border-[#2b2f45] dark:bg-[#0c0e14] dark:hover:border-[#3d4354]'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {media ? t('storyModal.changeMedia') : t('storyModal.chooseMedia')}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('storyModal.mediaFormats')}</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (media?.url) URL.revokeObjectURL(media.url);
                      setMedia({
                        file,
                        url: URL.createObjectURL(file),
                        type: file.type.startsWith('video/') ? 'video' : 'image',
                      });
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={createMediaStory}
                  disabled={!media || loading}
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('storyModal.shareStory')}
                </button>
              </>
            )}
          </div>

          {/* Preview — khung điện thoại nhẹ */}
          <div className="mx-auto w-full max-w-[200px] shrink-0 sm:max-w-[220px]">
            <p className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">{t('storyModal.preview')}</p>
            <div className="aspect-[9/16] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-inner dark:border-[#2b2f45] dark:bg-[#0a0b0f]">
              {!mode && (
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-gray-400 dark:text-gray-500">
                  {t('storyModal.previewHere')}
                </div>
              )}

              {mode === 'text' && (
                <div
                  className={`flex h-full w-full items-center justify-center px-4 text-center text-lg font-semibold leading-snug text-white ${selectedBg}`}
                >
                  {text.trim() ? text : t('storyModal.yourContent')}
                </div>
              )}

              {mode === 'media' && (
                <>
                  {media ? (
                    <div className="relative h-full w-full">
                      {media.type === 'video' ? (
                        <video
                          src={media.url}
                          className="h-full w-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={media.url} alt="" className="h-full w-full object-cover" />
                      )}
                      {mediaCaption.trim() ? (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-3 pb-4 pt-14 text-center text-[13px] font-medium leading-snug text-white drop-shadow-md sm:text-sm">
                          {mediaCaption.trim()}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="relative flex h-full w-full flex-col bg-linear-to-b from-zinc-700 to-zinc-900">
                      <div className="flex flex-1 items-center justify-center px-3 text-center text-[11px] leading-snug text-white/55">
                        {mediaCaption.trim()
                          ? t('storyModal.hasCaptionPickMedia')
                          : t('storyModal.pickMediaLeft')}
                      </div>
                      {mediaCaption.trim() ? (
                        <div className="pointer-events-none bg-linear-to-t from-black/60 to-transparent px-3 pb-4 pt-8 text-center text-[13px] font-medium leading-snug text-white drop-shadow-md sm:text-sm">
                          {mediaCaption.trim()}
                        </div>
                      ) : (
                        <p className="pointer-events-none px-3 pb-4 text-center text-[10px] text-white/40">
                          {t('storyModal.orTypeThenChoose')}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
