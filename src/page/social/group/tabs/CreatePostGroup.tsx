import { useNavigate } from 'react-router-dom';
import { Image, X, Globe, Lock, Loader2, Video, Trash2, Smile, MapPin } from 'lucide-react';
import { useState, useRef } from 'react';
import { postGroupApi } from '../../../../apis/postsGroup';
import type { CreatePostGroupRequest } from '../../../../apis/postsGroup';
import { authApi } from '../../../../apis/auth';
import { uploadApi } from '../../../../apis/upload';

export default function CreatePostGroup({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
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
          setImagePreviews(prev => [...prev, preview]);
          const res = await uploadApi.uploadFile(file);
          return res.url;
        })
      );
      setImageUrls(prev => [...prev, ...urls]);
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
          setVideoPreviews(prev => [...prev, preview]);
          const res = await uploadApi.uploadFile(file);
          return res.url;
        })
      );
      setVideoUrls(prev => [...prev, ...urls]);
    } catch {
      setError('Lỗi tải video lên');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeVideo = (index: number) => {
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const togglePrivacy = () => setPrivacy(prev => prev === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC');

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
        authorId: currentUser?.id || ''
      };
      await postGroupApi.createPost(data);
      setIsOpen(false);
      setContent('');
      setImagePreviews([]);
      setVideoPreviews([]);
      navigate(0);
    } catch (err: any) {
      setError(err.message || 'Tạo bài viết thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const mediaCount = imagePreviews.length + videoPreviews.length;
  const canPost = !isLoading && !isUploading && (!!content.trim() || mediaCount > 0);
  const initial = currentUser?.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

        .cpg-root * { font-family: 'Be Vietnam Pro', sans-serif; box-sizing: border-box; }

        /* Trigger card */
        .cpg-trigger-card {
          background: #ffffff;
          border: 1px solid #e8eaf0;
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 600px;
          margin: 0 auto 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        .cpg-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 16px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(102,126,234,0.35);
        }

        .cpg-trigger-btn {
          flex: 1; background: #f4f6fb; border: none; cursor: pointer;
          border-radius: 24px; padding: 10px 18px; text-align: left;
          color: #9aa0b0; font-size: 14px; font-weight: 500;
          transition: background 0.15s, color 0.15s;
          outline: none;
        }
        .cpg-trigger-btn:hover { background: #eceef5; color: #7a8299; }

        .cpg-trigger-actions {
          display: flex; gap: 4px;
        }
        .cpg-icon-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          color: #adb5c9; transition: background 0.15s, color 0.15s;
        }
        .cpg-icon-btn:hover { background: #f0f2f8; color: #6674e8; }
        .cpg-icon-btn.green:hover { color: #22c55e; background: #f0fdf4; }
        .cpg-icon-btn.red:hover { color: #ef4444; background: #fef2f2; }

        /* Overlay */
        .cpg-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(15, 17, 26, 0.65);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: cpgFadeIn 0.18s ease;
        }
        @keyframes cpgFadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* Modal */
        .cpg-modal {
          background: #ffffff;
          border-radius: 24px;
          width: 100%; max-width: 520px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
          animation: cpgSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes cpgSlideUp {
          from { transform: translateY(24px) scale(0.97); opacity: 0 }
          to { transform: translateY(0) scale(1); opacity: 1 }
        }

        /* Modal header */
        .cpg-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 16px;
          border-bottom: 1px solid #f0f2f8;
        }
        .cpg-modal-title {
          font-size: 16px; font-weight: 700; color: #1a1d2e;
          letter-spacing: -0.3px;
        }
        .cpg-close-btn {
          width: 32px; height: 32px; border-radius: 10px; border: none;
          background: #f4f6fb; cursor: pointer; display: flex;
          align-items: center; justify-content: center; color: #8a90a8;
          transition: background 0.15s, color 0.15s;
        }
        .cpg-close-btn:hover { background: #eceef5; color: #1a1d2e; }

        /* User row */
        .cpg-user-row {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px 8px;
        }
        .cpg-avatar-lg {
          width: 46px; height: 46px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 2px 10px rgba(102,126,234,0.3);
        }
        .cpg-user-name {
          font-size: 14px; font-weight: 700; color: #1a1d2e; line-height: 1.2;
        }
        .cpg-privacy-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px 3px 8px; border-radius: 8px; border: none; cursor: pointer;
          background: #f4f6fb; color: #5a607a;
          font-size: 11px; font-weight: 600; margin-top: 4px;
          transition: background 0.15s; letter-spacing: 0.1px;
        }
        .cpg-privacy-btn:hover { background: #eceef5; }
        .cpg-privacy-btn svg { width: 11px; height: 11px; }

        /* Textarea */
        .cpg-textarea {
          width: 100%; min-height: 130px; padding: 12px 20px;
          border: none; outline: none; resize: none; background: transparent;
          font-size: 16px; color: #1a1d2e; line-height: 1.6;
          font-family: 'Be Vietnam Pro', sans-serif; font-weight: 400;
        }
        .cpg-textarea::placeholder { color: #c2c8db; }

        /* Media grid */
        .cpg-media-grid {
          display: grid; gap: 6px; padding: 0 20px 16px;
        }
        .cpg-media-grid.cols-1 { grid-template-columns: 1fr; }
        .cpg-media-grid.cols-2 { grid-template-columns: 1fr 1fr; }
        .cpg-media-item {
          position: relative; border-radius: 14px; overflow: hidden;
          background: #f4f6fb; aspect-ratio: 1;
        }
        .cpg-media-item img,
        .cpg-media-item video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cpg-media-item video { object-fit: contain; background: #0f111a; }
        .cpg-media-remove {
          position: absolute; top: 8px; right: 8px;
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(15,17,26,0.55); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: white; opacity: 0; transition: opacity 0.15s, background 0.15s;
          backdrop-filter: blur(4px);
        }
        .cpg-media-item:hover .cpg-media-remove { opacity: 1; }
        .cpg-media-remove:hover { background: rgba(239,68,68,0.8); }

        /* Divider */
        .cpg-divider { height: 1px; background: #f0f2f8; margin: 0 20px; }

        /* Bottom bar */
        .cpg-bottom { padding: 14px 20px; }

        .cpg-actions-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 14px; background: #f8f9fd; border-radius: 14px;
          border: 1px solid #eceef5; margin-bottom: 12px;
        }
        .cpg-actions-label {
          font-size: 12px; font-weight: 600; color: #8a90a8; letter-spacing: 0.3px;
        }
        .cpg-actions-icons { display: flex; gap: 2px; }
        .cpg-action-icon-btn {
          width: 34px; height: 34px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .cpg-action-icon-btn.img { color: #22c55e; }
        .cpg-action-icon-btn.vid { color: #f97316; }
        .cpg-action-icon-btn.emoji { color: #eab308; }
        .cpg-action-icon-btn.loc { color: #3b82f6; }
        .cpg-action-icon-btn:hover { background: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

        /* Error / uploading */
        .cpg-error {
          margin-bottom: 10px; font-size: 12px; color: #ef4444;
          background: #fef2f2; padding: 8px 12px; border-radius: 10px;
          border: 1px solid #fecaca;
        }
        .cpg-uploading {
          margin-bottom: 10px; font-size: 12px; color: #6674e8;
          display: flex; align-items: center; gap: 6px;
          font-weight: 500;
        }

        /* Post button */
        .cpg-post-btn {
          width: 100%; padding: 12px; border-radius: 14px; border: none;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.15s; display: flex; align-items: center;
          justify-content: center; gap: 6px; letter-spacing: 0.2px;
        }
        .cpg-post-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(102,126,234,0.35);
        }
        .cpg-post-btn.active:hover {
          box-shadow: 0 6px 20px rgba(102,126,234,0.45);
          transform: translateY(-1px);
        }
        .cpg-post-btn.active:active { transform: translateY(0); }
        .cpg-post-btn.disabled {
          background: #f0f2f8; color: #c2c8db; cursor: not-allowed;
        }
        .cpg-post-btn svg { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Scrollable body */
        .cpg-modal-body { max-height: 62vh; overflow-y: auto; }
        .cpg-modal-body::-webkit-scrollbar { width: 4px; }
        .cpg-modal-body::-webkit-scrollbar-thumb { background: #e0e3ef; border-radius: 4px; }
      `}</style>

      <div className="cpg-root">
        {/* Trigger */}
        <div className="cpg-trigger-card">
          <div className="cpg-avatar">{initial}</div>
          <button className="cpg-trigger-btn" onClick={() => setIsOpen(true)}>
            {currentUser?.fullName} ơi, bạn đang nghĩ gì thế?
          </button>
          <div className="cpg-trigger-actions">
            <button className="cpg-icon-btn green" onClick={() => { setIsOpen(true); setTimeout(() => imageInputRef.current?.click(), 100); }}>
              <Image size={18} />
            </button>
            <button className="cpg-icon-btn red" onClick={() => { setIsOpen(true); setTimeout(() => videoInputRef.current?.click(), 100); }}>
              <Video size={18} />
            </button>
          </div>
        </div>

        {/* Modal */}
        {isOpen && (
          <div className="cpg-overlay" onClick={() => setIsOpen(false)}>
            <div className="cpg-modal" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="cpg-modal-header">
                <div style={{ width: 32 }} />
                <span className="cpg-modal-title">Tạo bài viết</span>
                <button className="cpg-close-btn" onClick={() => setIsOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="cpg-modal-body">
                {/* User row */}
                <div className="cpg-user-row">
                  <div className="cpg-avatar-lg">{initial}</div>
                  <div>
                    <div className="cpg-user-name">{currentUser?.fullName}</div>
                    <button className="cpg-privacy-btn" onClick={togglePrivacy}>
                      {privacy === 'PUBLIC' ? <Globe /> : <Lock />}
                      {privacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                      <span style={{ opacity: 0.5, fontSize: 9 }}>▾</span>
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  className="cpg-textarea"
                  autoFocus
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Chia sẻ điều gì đó với nhóm..."
                />

                {/* Media grid */}
                {mediaCount > 0 && (
                  <div className={`cpg-media-grid ${mediaCount > 1 ? 'cols-2' : 'cols-1'}`}>
                    {imagePreviews.map((src, i) => (
                      <div className="cpg-media-item" key={`img-${i}`}>
                        <img src={src} alt="" />
                        <button className="cpg-media-remove" onClick={() => removeImage(i)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {videoPreviews.map((src, i) => (
                      <div className="cpg-media-item" key={`vid-${i}`}>
                        <video src={src} />
                        <button className="cpg-media-remove" onClick={() => removeVideo(i)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="cpg-divider" />

              {/* Bottom */}
              <div className="cpg-bottom">
                <input ref={imageInputRef} type="file" hidden multiple onChange={handleImageSelect} accept="image/*" />
                <input ref={videoInputRef} type="file" hidden multiple onChange={handleVideoSelect} accept="video/*" />

                <div className="cpg-actions-row">
                  <span className="cpg-actions-label">Thêm vào bài viết</span>
                  <div className="cpg-actions-icons">
                    <button className="cpg-action-icon-btn img" onClick={() => imageInputRef.current?.click()} title="Ảnh">
                      <Image size={20} />
                    </button>
                    <button className="cpg-action-icon-btn vid" onClick={() => videoInputRef.current?.click()} title="Video">
                      <Video size={20} />
                    </button>
                    <button className="cpg-action-icon-btn emoji" title="Cảm xúc">
                      <Smile size={20} />
                    </button>
                    <button className="cpg-action-icon-btn loc" title="Địa điểm">
                      <MapPin size={20} />
                    </button>
                  </div>
                </div>

                {error && <div className="cpg-error">{error}</div>}
                {isUploading && (
                  <div className="cpg-uploading">
                    <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Đang tải lên...
                  </div>
                )}

                <button
                  className={`cpg-post-btn ${canPost ? 'active' : 'disabled'}`}
                  onClick={handlePost}
                  disabled={!canPost}
                >
                  {isLoading ? <Loader2 size={18} /> : 'Đăng bài'}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}