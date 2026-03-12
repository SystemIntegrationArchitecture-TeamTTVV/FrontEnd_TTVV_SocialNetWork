import { useParams } from 'react-router-dom';
import { Send, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function CommentDetail() {
  const { id } = useParams();
  const [comment, setComment] = useState('');

  const comments = [
    {
      id: 1,
      author: { name: 'Mike Chen', avatar: 'MC', color: '#1877F2' },
      content: 'Amazing view! Where is this?',
      time: '1 giờ trước',
      likes: 5,
    },
    {
      id: 2,
      author: { name: 'Sarah Johnson', avatar: 'SJ', color: '#42B72A' },
      content: 'Looks beautiful! 😍',
      time: '2 giờ trước',
      likes: 3,
    },
    {
      id: 3,
      author: { name: 'David Kim', avatar: 'DK', color: '#FF6B6B' },
      content: 'I want to visit this place too!',
      time: '3 giờ trước',
      likes: 8,
    },
  ];

  const handleSend = () => {
    if (comment.trim()) {
      console.log('Send comment:', comment);
      setComment('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bình luận</h1>
      </div>

      {/* Post */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
            SJ
          </div>
          <div>
            <p className="font-bold text-lg text-gray-900">Sarah Johnson</p>
            <p className="text-sm text-gray-600">2 giờ trước • 🌍</p>
          </div>
        </div>
        <p className="text-base text-gray-900 mb-4 leading-relaxed">
          Just finished an amazing hike! The view was breathtaking 🏔️
        </p>
        <div className="w-full h-80 bg-gray-100 rounded-2xl flex items-center justify-center">
          <span className="text-9xl">🏔️</span>
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
            <Heart className="w-5 h-5" />
            <span className="font-semibold">125</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">{comments.length}</span>
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4 mb-6">
        {comments.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                style={{ backgroundColor: c.author.color }}
              >
                {c.author.avatar}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-xl p-4 mb-3">
                  <p className="font-bold text-base text-gray-900 mb-1">{c.author.name}</p>
                  <p className="text-base text-gray-900">{c.content}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-semibold">{c.likes}</span>
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Phản hồi
                  </button>
                  <span className="text-sm text-gray-500">{c.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Input */}
      <div className="bg-white rounded-2xl shadow-sm p-6 sticky bottom-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base">
            JD
          </div>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Viết bình luận..."
            className="flex-1 h-14 px-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!comment.trim()}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
              comment.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
