import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, Share2, MoreVertical, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import { useState } from 'react';

export default function WatchVideo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Mock video data
  const video = {
    id: id,
    title: 'Hướng dẫn React Hooks từ cơ bản đến nâng cao',
    description:
      'Video này sẽ hướng dẫn chi tiết về React Hooks, từ useState, useEffect đến các custom hooks phức tạp. Phù hợp cho những ai muốn nắm vững React Hooks.',
    author: {
      name: 'Nguyễn Văn A',
      avatar: 'NA',
      color: '#1877F2',
      subscribers: 125000,
    },
    views: 1250000,
    likes: 45000,
    comments: 1200,
    shares: 890,
    uploadDate: '2 ngày trước',
    duration: '15:30',
  };

  const relatedVideos = [
    { id: 2, title: 'React Performance Optimization', thumbnail: '🎥', views: '890K', author: 'Tech Channel' },
    { id: 3, title: 'JavaScript ES6+ Features', thumbnail: '📺', views: '1.2M', author: 'Code Master' },
    { id: 4, title: 'TypeScript Tutorial', thumbnail: '💻', views: '650K', author: 'Dev Academy' },
  ];

  const comments = [
    {
      id: 1,
      author: { name: 'User 1', avatar: 'U1', color: '#1877F2' },
      content: 'Video rất hay, cảm ơn bạn!',
      time: '1 giờ trước',
      likes: 125,
    },
    {
      id: 2,
      author: { name: 'User 2', avatar: 'U2', color: '#42B72A' },
      content: 'Giải thích rất dễ hiểu, đang chờ phần 2',
      time: '3 giờ trước',
      likes: 89,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex flex-col lg:flex-row">
        {/* Main Video */}
        <div className="flex-1">
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between bg-black/50 backdrop-blur-sm">
            <button
              onClick={() => navigate('/home')}
              className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">Watch</h1>
            <div className="w-10"></div>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video bg-gray-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-9xl mb-4">🎬</div>
                <p className="text-2xl font-semibold mb-2">{video.title}</p>
                <p className="text-gray-400">{video.duration}</p>
              </div>
            </div>

            {/* Video Controls */}
            {showControls && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                <div className="mb-4">
                  <div className="w-full h-1 bg-white/30 rounded-full mb-2">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>10:45 / {video.duration}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center">
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-3">{video.title}</h2>
              <div className="flex items-center gap-6 text-gray-400">
                <span>{video.views.toLocaleString()} lượt xem</span>
                <span>•</span>
                <span>{video.uploadDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors ${
                  isLiked
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                {video.likes.toLocaleString()}
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors">
                <MessageCircle className="w-5 h-5" />
                {video.comments.toLocaleString()}
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors">
                <Share2 className="w-5 h-5" />
                Chia sẻ
              </button>
              <button className="ml-auto w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Author */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: video.author.color }}
              >
                {video.author.avatar}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{video.author.name}</p>
                <p className="text-gray-400 text-sm">{video.author.subscribers.toLocaleString()} người đăng ký</p>
              </div>
              <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-colors">
                Đăng ký
              </button>
            </div>

            {/* Description */}
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-base leading-relaxed whitespace-pre-line">{video.description}</p>
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-xl font-bold mb-4">{video.comments.toLocaleString()} bình luận</h3>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: comment.author.color }}
                    >
                      {comment.author.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1">
                        <span className="font-semibold mr-2">{comment.author.name}</span>
                        <span className="text-gray-400 text-sm">{comment.time}</span>
                      </div>
                      <p className="mb-2">{comment.content}</p>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">{comment.likes}</span>
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors text-sm">Phản hồi</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="w-full lg:w-80 bg-black/50 backdrop-blur-sm border-l border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4">Video liên quan</h3>
          <div className="space-y-4">
            {relatedVideos.map((related) => (
              <div key={related.id} className="flex gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                <div className="w-40 h-24 bg-gray-800 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                  {related.thumbnail}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2">{related.title}</h4>
                  <p className="text-gray-400 text-xs mb-1">{related.author}</p>
                  <p className="text-gray-500 text-xs">{related.views} lượt xem</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
