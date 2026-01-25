import { X, Image, Type, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { storiesApi } from '../../apis/storiesApi';
import { authApi } from '../../apis/auth';
/* ===================== TYPES ===================== */
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

/* ===================== COMPONENT ===================== */

export default function CreateStoryModal({ onClose, onCreate }: Props) {
  const [mode, setMode] = useState<'text' | 'media' | null>(null);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<MediaState | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedBg, setSelectedBg] = useState(
    'bg-gradient-to-br from-blue-500 to-purple-500'
  );

  const backgrounds = [
    'bg-gradient-to-br from-blue-500 to-purple-500',
    'bg-gradient-to-br from-pink-500 to-rose-500',
    'bg-gradient-to-br from-green-500 to-emerald-500',
    'bg-gradient-to-br from-orange-500 to-red-500',
    'bg-gradient-to-br from-indigo-500 to-blue-500',
    'bg-gradient-to-br from-purple-500 to-pink-500',
  ];
  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());

  if (!currentUser) {
    return null; // hoặc redirect login
  }
  /* ===================== CREATE TEXT ===================== */
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

      onCreate(story); // ✅ story đã tồn tại
      onClose();
    } catch (err) {
      console.error('Create text story failed', err);
    } finally {
      setLoading(false);
    }
  };



  /* ===================== CREATE MEDIA ===================== */

  const createMediaStory = async () => {
    if (!media) return;

    try {
      setLoading(true);

      const story= await storiesApi.createStory({
        userId: currentUser.id,
        userName: currentUser.fullName, // hoặc username
        userAvatar: currentUser.avatar,

        contentType: media.type,
        duration: media.type === 'video' ? 10 : 5,
        file: media.file,
      });
      onCreate(story);
      onClose();
    } catch (err) {
      console.error('Create media story failed', err);
    } finally {
      setLoading(false);
    }
  };



  /* ===================== UI ===================== */

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Create Story</h2>
              <p className="text-sm text-white/80">
                Share your moment with friends
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex gap-6 p-6">
          {/* LEFT */}
          <div className="flex-1 space-y-5">
            {!mode && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('text')}
                  className="h-52 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex flex-col items-center justify-center gap-4"
                >
                  <Type size={40} />
                  <div className="text-xl font-bold">Text Story</div>
                </button>

                <button
                  onClick={() => setMode('media')}
                  className="h-52 rounded-2xl bg-gray-100 flex flex-col items-center justify-center gap-4"
                >
                  <Image size={40} />
                  <div className="text-xl font-bold">Photo / Video</div>
                </button>
              </div>
            )}

            {mode === 'text' && (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full h-40 border rounded-xl p-4"
                  maxLength={200}
                />

                <div className="grid grid-cols-6 gap-2">
                  {backgrounds.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setSelectedBg(bg)}
                      className={`h-10 rounded-lg ${bg} ${selectedBg === bg ? 'ring-4 ring-blue-500' : ''
                        }`}
                    />
                  ))}
                </div>

                <button
                  onClick={createTextStory}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
                >
                  Share to Story
                </button>
              </>
            )}

            {mode === 'media' && (
              <>
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed rounded-xl p-10 text-center">
                    <p className="font-medium">Click to upload image or video</p>
                    <p className="text-sm text-gray-500">JPG, PNG, MP4</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setMedia({
                        file,
                        url: URL.createObjectURL(file),
                        type: file.type.startsWith('video/')
                          ? 'video'
                          : 'image',
                      });
                    }}
                  />
                </label>

                <button
                  onClick={createMediaStory}
                  disabled={!media || loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
                >
                  Share to Story
                </button>
              </>
            )}
          </div>

          {/* RIGHT PREVIEW */}
          <div className="w-72">
            <div className="aspect-[9/16] rounded-3xl overflow-hidden bg-black">
              {!mode && (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Preview
                </div>
              )}

              {mode === 'text' && (
                <div
                  className={`w-full h-full flex items-center justify-center text-white text-2xl font-bold px-6 ${selectedBg}`}
                >
                  {text || 'Your text here'}
                </div>
              )}

              {mode === 'media' && media && (
                media.type === 'video' ? (
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={media.url}
                    className="w-full h-full object-cover"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
