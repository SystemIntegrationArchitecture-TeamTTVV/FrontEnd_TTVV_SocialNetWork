import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Type, Upload, Loader2 } from 'lucide-react';
import { authApi } from '../../apis/auth';
import { storiesApi } from '../../apis/stories';
import { uploadApi } from '../../apis/upload';

interface CreateStoryProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

const backgroundColors = [
  { name: 'Gradient Blue', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Gradient Pink', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Gradient Orange', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Gradient Green', value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { name: 'Gradient Sunset', value: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)' },
  { name: 'Solid Blue', value: '#1877f2' },
  { name: 'Solid Purple', value: '#8b5cf6' },
  { name: 'Solid Pink', value: '#ec4899' },
];

export default function CreateStory({ isOpen, onClose, onStoryCreated }: CreateStoryProps) {
  const currentUser = authApi.getCurrentUser();
  const [storyType, setStoryType] = useState<'text' | 'image' | 'video'>('image');
  const [text, setText] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(backgroundColors[0].value);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'FRIENDS' | 'ONLY_ME'>('FRIENDS');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    setMediaFile(file);
    setStoryType(isImage ? 'image' : 'video');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    // Validate: must have either text or media
    if (storyType === 'text' && !text.trim()) {
      alert('Please enter some text for your story');
      return;
    }
    if ((storyType === 'image' || storyType === 'video') && !mediaFile) {
      alert('Please select a file');
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrl = '';
      let thumbnailUrl = '';

      // Upload media if present
      if (mediaFile) {
        const uploadedFiles = await uploadApi.uploadFiles([mediaFile]);
        if (uploadedFiles.length > 0) {
          const first = uploadedFiles[0];
          mediaUrl = first.url;
          
          // For videos, we could generate thumbnail (simplified: use media URL)
          if (storyType === 'video') {
            thumbnailUrl = mediaUrl;
          }
        }
      }

      // Create story
      await storiesApi.createStory({
        authorId: currentUser.id,
        type: storyType === 'video' ? 'VIDEO' : 'IMAGE',
        mediaUrl: (storyType === 'image' || storyType === 'video') ? mediaUrl : undefined,
        thumbnailUrl: storyType === 'video' ? thumbnailUrl : undefined,
        text: storyType === 'text' ? text : undefined,
        backgroundColor: storyType === 'text' ? selectedBackground : undefined,
        visibility,
      });

      // Reset and close
      setText('');
      setMediaFile(null);
      setMediaPreview('');
      setStoryType('image');
      onStoryCreated?.();
      onClose();
    } catch (error) {
      console.error('Failed to create story:', error);
      alert('Failed to create story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const cycleVisibility = () => {
    const options: ('PUBLIC' | 'FRIENDS' | 'ONLY_ME')[] = ['PUBLIC', 'FRIENDS', 'ONLY_ME'];
    const currentIndex = options.indexOf(visibility);
    const nextIndex = (currentIndex + 1) % options.length;
    setVisibility(options[nextIndex]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create Story</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Story Type Selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setStoryType('image')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                storyType === 'image'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ImageIcon className="w-5 h-5 inline mr-2" />
              Image
            </button>
            <button
              onClick={() => setStoryType('video')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                storyType === 'video'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video className="w-5 h-5 inline mr-2" />
              Video
            </button>
            <button
              onClick={() => setStoryType('text')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                storyType === 'text'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Type className="w-5 h-5 inline mr-2" />
              Text
            </button>
          </div>

          {/* Text Story */}
          {storyType === 'text' && (
            <div className="space-y-4">
              <div
                className="relative rounded-xl overflow-hidden"
                style={{ 
                  background: selectedBackground,
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem'
                }}
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your story..."
                  className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold text-center resize-none placeholder-white placeholder-opacity-70"
                  rows={5}
                  maxLength={200}
                />
              </div>
              
              {/* Background Color Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Background</label>
                <div className="grid grid-cols-4 gap-2">
                  {backgroundColors.map((bg, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedBackground(bg.value)}
                      className={`h-12 rounded-lg border-2 ${
                        selectedBackground === bg.value ? 'border-blue-500 scale-105' : 'border-gray-300'
                      } transition-transform`}
                      style={{ background: bg.value }}
                      title={bg.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Image/Video Story */}
          {(storyType === 'image' || storyType === 'video') && (
            <div className="space-y-4">
              {/* File Upload Area */}
              {!mediaPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    Click to upload {storyType === 'image' ? 'an image' : 'a video'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {storyType === 'image' ? 'JPG, PNG, GIF' : 'MP4, MOV, AVI'} (max 100MB)
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  {storyType === 'image' ? (
                    <img src={mediaPreview} alt="Story preview" className="w-full h-auto max-h-96 object-contain mx-auto" />
                  ) : (
                    <video src={mediaPreview} controls className="w-full h-auto max-h-96 mx-auto" />
                  )}
                  <button
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-gray-900 bg-opacity-75 rounded-full hover:bg-opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept={storyType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Visibility Selector */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Story Visibility</p>
              <p className="text-sm text-gray-500">Who can see this story?</p>
            </div>
            <button
              onClick={cycleVisibility}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {visibility === 'PUBLIC' ? '🌍 Public' : visibility === 'FRIENDS' ? '👥 Friends' : '🔒 Only Me'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || (storyType === 'text' && !text.trim()) || ((storyType === 'image' || storyType === 'video') && !mediaFile)}
            className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              'Share Story'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
