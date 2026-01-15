import { useParams, useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ArrowRight, Pause, Play, Heart, MessageCircle, Share2, Send, Waves } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ImagePlaceholderIcon, CameraIcon, SunIcon } from '../../common/icons/IconComponents';

export default function StoriesViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock stories data - matching Newsfeed stories
  const stories = [
    {
      id: 1,
      author: { name: 'Sarah', avatar: 'SJ', color: '#42B72A' },
      time: '2 giờ trước',
      media: [
        { type: 'image', content: 'image', duration: 5000 },
        { type: 'image', content: 'camera', duration: 5000 },
      ],
    },
    {
      id: 2,
      author: { name: 'Mike', avatar: 'MC', color: '#FF6B6B' },
      time: '5 giờ trước',
      media: [
        { type: 'image', content: 'sunset', duration: 5000 },
        { type: 'image', content: 'beach', duration: 5000 },
      ],
    },
    {
      id: 3,
      author: { name: 'Emma', avatar: 'ED', color: '#4ECDC4' },
      time: '1 ngày trước',
      media: [
        { type: 'image', content: 'image', duration: 5000 },
      ],
    },
    {
      id: 4,
      author: { name: 'Alex', avatar: 'AP', color: '#FFD93D' },
      time: '2 ngày trước',
      media: [
        { type: 'image', content: 'camera', duration: 5000 },
      ],
    },
  ];

  const currentStory = stories[currentStoryIndex];
  const currentMedia = currentStory?.media[currentMediaIndex];
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

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

  useEffect(() => {
    const storyId = id ? parseInt(id) : 1;
    const index = stories.findIndex(s => s.id === storyId);
    if (index !== -1) {
      setCurrentStoryIndex(index);
      setCurrentMediaIndex(0);
      setProgress(0);
    }
  }, [id]);

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
      navigate(`/stories/${stories[currentStoryIndex + 1].id}`, { replace: true });
    } else {
      navigate('/home');
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setCurrentMediaIndex(stories[currentStoryIndex - 1].media.length - 1);
      setProgress(0);
      navigate(`/stories/${stories[currentStoryIndex - 1].id}`, { replace: true });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width / 3) {
      prevMedia();
    } else if (clickX > (width * 2) / 3) {
      nextMedia();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const getMediaContent = (content: string) => {
    switch (content) {
      case 'image':
        return <ImagePlaceholderIcon className="w-32 h-32 text-white/80" />;
      case 'camera':
        return <CameraIcon className="w-32 h-32 text-white/80" />;
      case 'sunset':
        return <SunIcon className="w-32 h-32 text-yellow-300" />;
      case 'beach':
        return <Waves className="w-32 h-32 text-blue-300" />;
      default:
        return <ImagePlaceholderIcon className="w-32 h-32 text-white/80" />;
    }
  };

  if (!currentStory || !currentMedia) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 cursor-pointer"
      onClick={handleClick}
    >
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex gap-1.5">
          {currentStory.media.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75"
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
      <div className="absolute top-12 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg"
            style={{ backgroundColor: currentStory.author.color }}
          >
            {currentStory.author.avatar}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{currentStory.author.name}</p>
            <p className="text-white/70 text-xs">{currentStory.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors text-white"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/home');
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Display */}
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="flex items-center justify-center">
          {getMediaContent(currentMedia.content)}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        {/* Reply Input */}
        {showReply && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => {
                e.stopPropagation();
                setReplyMessage(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && replyMessage.trim()) {
                  e.stopPropagation();
                  console.log('Send reply:', replyMessage);
                  setReplyMessage('');
                  setShowReply(false);
                }
              }}
              placeholder="Send a message..."
              className="flex-1 h-11 px-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (replyMessage.trim()) {
                  console.log('Send reply:', replyMessage);
                  setReplyMessage('');
                  setShowReply(false);
                }
              }}
              disabled={!replyMessage.trim()}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                replyMessage.trim()
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {!showReply && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReactions(!showReactions);
              }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors text-white"
            >
              <Heart className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReply(true);
              }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors text-white"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Share story');
              }}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors text-white"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Quick Reactions */}
        {showReactions && (
          <div 
            className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('React:', emoji);
                  setShowReactions(false);
                }}
                className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center text-xl transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Hints */}
      <div className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevMedia();
          }}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextMedia();
          }}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Story Navigation - Swipe areas */}
      {currentStoryIndex > 0 && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            prevStory();
          }}
          className="absolute left-0 top-0 bottom-0 w-20 cursor-pointer"
        />
      )}
      {currentStoryIndex < stories.length - 1 && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            nextStory();
          }}
          className="absolute right-0 top-0 bottom-0 w-20 cursor-pointer"
        />
      )}
    </div>
  );
}
