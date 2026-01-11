import { useParams, useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ArrowRight, MoreVertical, Pause, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function StoriesViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Mock stories data
  const stories = [
    {
      id: 1,
      author: { name: 'Nguyễn Văn A', avatar: 'NA', color: '#1877F2' },
      media: [
        { type: 'image', content: '🖼️', duration: 5000 },
        { type: 'image', content: '📷', duration: 5000 },
      ],
    },
    {
      id: 2,
      author: { name: 'Trần Thị B', avatar: 'TB', color: '#42B72A' },
      media: [
        { type: 'image', content: '🏞️', duration: 5000 },
        { type: 'image', content: '🌅', duration: 5000 },
      ],
    },
  ];

  const currentStory = stories[currentStoryIndex];
  const currentMedia = currentStory?.media[currentMediaIndex];

  useEffect(() => {
    if (!isPlaying || !currentMedia) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextMedia();
          return 0;
        }
        return prev + 2;
      });
    }, currentMedia.duration / 50);

    return () => clearInterval(interval);
  }, [isPlaying, currentMediaIndex, currentStoryIndex]);

  const nextMedia = () => {
    if (currentMediaIndex < currentStory.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
      setProgress(0);
    } else {
      nextStory();
    }
  };

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
      setProgress(0);
    } else {
      prevStory();
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setCurrentMediaIndex(0);
      setProgress(0);
    } else {
      navigate('/home');
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setCurrentMediaIndex(stories[currentStoryIndex - 1].media.length - 1);
      setProgress(0);
    }
  };

  if (!currentStory || !currentMedia) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex gap-1">
          {currentStory.media.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width:
                    index < currentMediaIndex
                      ? '100%'
                      : index === currentMediaIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-16 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: currentStory.author.color }}
          >
            {currentStory.author.avatar}
          </div>
          <div>
            <p className="text-white font-semibold">{currentStory.author.name}</p>
            <p className="text-white/70 text-sm">2 giờ trước</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Display */}
      <div className="h-full flex items-center justify-center">
        <div className="text-9xl">{currentMedia.content}</div>
      </div>

      {/* Navigation */}
      <div className="absolute inset-0 flex items-center">
        <button
          onClick={prevMedia}
          className="absolute left-4 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextMedia}
          className="absolute right-4 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Story Navigation */}
      {currentStoryIndex > 0 && (
        <button
          onClick={prevStory}
          className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-start pl-4 text-white opacity-0 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
      )}
      {currentStoryIndex < stories.length - 1 && (
        <button
          onClick={nextStory}
          className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-end pr-4 text-white opacity-0 hover:opacity-100 transition-opacity"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
