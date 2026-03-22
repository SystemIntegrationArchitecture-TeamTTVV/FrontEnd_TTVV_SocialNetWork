import { Image, X, Globe, Lock, Loader2, Video, Trash2, Smile, MapPin } from 'lucide-react';
import { useState, useRef } from 'react';
import { postGroupApi } from '../../../../apis/postsGroup';
import type { CreatePostGroupRequest, PostGroupData } from '../../../../apis/postsGroup';
import { authApi } from '../../../../apis/auth';
import { uploadApi } from '../../../../apis/upload';

export default function CreatePostGroup({
  groupId,
  onPostCreated,
}: {
  groupId: string;
  /** Gọi sau khi tạo bài thành công — tránh navigate(0) reload cả trang */
  onPostCreated?: (post: PostGroupData) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const currentUser = authApi.getCurrentUser();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(
        Array.from(files).map(async (file) => {
          const preview = URL.createObjectURL(file);
          setImagePreviews((prev) => [...prev, preview]);
          const res = await uploadApi.uploadFile(file);
          return res.url;
        })
      );
      setImageUrls((prev) => [...prev, ...urls]);
    } catch {
      setError('Lỗi tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(
        Array.from(files).map(async (file) => {
          const preview = URL.createObjectURL(file);
          setVideoPreviews((prev) => [...prev, preview]);
          const res = await uploadApi.uploadFile(file);
          return res.url;
        })
      );
      setVideoUrls((prev) => [...prev, ...urls]);
    } catch {
      setError('Lỗi tải video lên');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeVideo = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const togglePrivacy = () => setPrivacy((prev) => (prev === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'));

  const handlePost = async () => {
    if (!content.trim() && imageUrls.length === 0 && videoUrls.length === 0) {
      setError('Hãy nhập nội dung hoặc chọn media');
      return;
    }
    setIsLoading(true);
    try {
      const data: CreatePostGroupRequest = {
        content: content.trim(),
        groupId,
        visibility: privacy,
        allowComments: true,
        allowSharing: true,
        images: imageUrls,
        videos: videoUrls,
        authorId: currentUser?.id || '',
      };
      const created = await postGroupApi.createPost(data);
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      videoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setIsOpen(false);
      setContent('');
      setImageUrls([]);
      setVideoUrls([]);
      setImagePreviews([]);
      setVideoPreviews([]);
      onPostCreated?.(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo bài viết thất bại';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const mediaCount = imagePreviews.length + videoPreviews.length;
  const canPost = !isLoading && !isUploading && (!!content.trim() || mediaCount > 0);
  const initial = currentUser?.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="font-sans">
      {/* Trigger */}
      <div
        className="flex max-w-[600px] items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm mx-auto mb-6
          dark:border-[#2b2f45] dark:bg-[#1a1d28] dark:shadow-none"
      >
        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#667eea] to-[#764ba2] text-base font-bold text-white shadow-md">
          {initial}
        </div>
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer rounded-full border-none bg-gray-100 px-[18px] py-2.5 text-left text-sm font-medium text-gray-500 outline-none transition-colors
            hover:bg-gray-200 hover:text-gray-600
            dark:bg-[#252836] dark:text-gray-400 dark:hover:bg-[#2f3344] dark:hover:text-gray-300"
          onClick={() => setIsOpen(true)}
        >
          {currentUser?.fullName} ơi, bạn đang nghĩ gì thế?
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-[#adb5c9] transition-colors
              hover:bg-gray-100 hover:text-emerald-500 dark:hover:bg-[#252836] dark:hover:text-emerald-400"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => imageInputRef.current?.click(), 100);
            }}
            aria-label="Thêm ảnh"
          >
            <Image size={18} />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-[#adb5c9] transition-colors
              hover:bg-gray-100 hover:text-orange-500 dark:hover:bg-[#252836] dark:hover:text-orange-400"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => videoInputRef.current?.click(), 100);
            }}
            aria-label="Thêm video"
          >
            <Video size={18} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-[rgba(15,17,26,0.65)] p-5 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl
              dark:border-[#2b2f45] dark:bg-[#1a1d28]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cpg-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-[#2b2f45]">
              <div className="w-8 shrink-0" />
              <span id="cpg-modal-title" className="text-base font-bold text-gray-900 dark:text-gray-100">
                Tạo bài viết
              </span>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-gray-100 text-gray-500 transition-colors
                  hover:bg-gray-200 hover:text-gray-900 dark:bg-[#252836] dark:text-gray-400 dark:hover:bg-[#2f3344] dark:hover:text-white"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto [scrollbar-width:thin]">
              <div className="flex items-center gap-3 px-5 pb-2 pt-4">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#667eea] to-[#764ba2] text-lg font-bold text-white shadow-md">
                  {initial}
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight text-gray-900 dark:text-gray-100">{currentUser?.fullName}</div>
                  <button
                    type="button"
                    className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-gray-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-gray-600 transition-colors
                      hover:bg-gray-200 dark:bg-[#252836] dark:text-gray-300 dark:hover:bg-[#2f3344]"
                    onClick={togglePrivacy}
                  >
                    {privacy === 'PUBLIC' ? <Globe className="size-[11px]" /> : <Lock className="size-[11px]" />}
                    {privacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                    <span className="text-[9px] opacity-50">▾</span>
                  </button>
                </div>
              </div>

              <textarea
                className="min-h-[130px] w-full resize-none border-none bg-transparent px-5 py-3 text-base leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ điều gì đó với nhóm..."
              />

              {mediaCount > 0 && (
                <div
                  className={`grid gap-1.5 px-5 pb-4 ${mediaCount > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
                >
                  {imagePreviews.map((src, i) => (
                    <div
                      key={`img-${i}`}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-[#252836]"
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-none bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-500/80 group-hover:opacity-100"
                        onClick={() => removeImage(i)}
                        aria-label="Xóa ảnh"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {videoPreviews.map((src, i) => (
                    <div
                      key={`vid-${i}`}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-[#0f111a]"
                    >
                      <video src={src} className="h-full w-full object-contain" />
                      <button
                        type="button"
                        className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-none bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-500/80 group-hover:opacity-100"
                        onClick={() => removeVideo(i)}
                        aria-label="Xóa video"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mx-5 h-px bg-gray-100 dark:bg-[#2b2f45]" />

            <div className="px-5 py-3.5">
              <input ref={imageInputRef} type="file" hidden multiple onChange={handleImageSelect} accept="image/*" />
              <input ref={videoInputRef} type="file" hidden multiple onChange={handleVideoSelect} accept="video/*" />

              <div
                className="mb-3 flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/80 px-3.5 py-2
                  dark:border-[#2b2f45] dark:bg-[#14161f]"
              >
                <span className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400">Thêm vào bài viết</span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-emerald-500 transition-colors hover:bg-white hover:shadow-sm dark:hover:bg-[#252836]"
                    onClick={() => imageInputRef.current?.click()}
                    title="Ảnh"
                  >
                    <Image size={20} />
                  </button>
                  <button
                    type="button"
                    className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-orange-500 transition-colors hover:bg-white hover:shadow-sm dark:hover:bg-[#252836]"
                    onClick={() => videoInputRef.current?.click()}
                    title="Video"
                  >
                    <Video size={20} />
                  </button>
                  <button
                    type="button"
                    className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-yellow-500 transition-colors hover:bg-white hover:shadow-sm dark:hover:bg-[#252836]"
                    title="Cảm xúc"
                  >
                    <Smile size={20} />
                  </button>
                  <button
                    type="button"
                    className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-blue-500 transition-colors hover:bg-white hover:shadow-sm dark:hover:bg-[#252836]"
                    title="Địa điểm"
                  >
                    <MapPin size={20} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-2.5 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </div>
              )}
              {isUploading && (
                <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-indigo-500 dark:text-indigo-400">
                  <Loader2 size={13} className="animate-spin" />
                  Đang tải lên...
                </div>
              )}

              <button
                type="button"
                className={`flex w-full items-center justify-center gap-1.5 rounded-[14px] border-none py-3 text-sm font-bold tracking-wide transition-all ${
                  canPost
                    ? 'cursor-pointer bg-linear-to-br from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-px hover:shadow-xl active:translate-y-0'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-[#252836] dark:text-gray-500'
                }`}
                onClick={handlePost}
                disabled={!canPost}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Đăng bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
