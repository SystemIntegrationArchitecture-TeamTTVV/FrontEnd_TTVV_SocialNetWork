import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function CommentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [comment, setComment] = useState('');

  const comments = [
    { id: 1, author: 'Mike Chen', content: 'Amazing view! Where is this?', time: '1h', likes: 5 },
    { id: 2, author: 'Sarah Johnson', content: 'Looks beautiful! 😍', time: '2h', likes: 3 },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="bg-white sticky top-14 z-10 border-b border-[#E4E6EB] p-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="w-9 h-9 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#050505]" />
        </button>
        <h2 className="text-xl font-bold text-[#050505]">Comments</h2>
      </div>

      <div className="max-w-[680px] mx-auto p-4 space-y-4">
        {/* Post */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#42B72A] flex items-center justify-center text-white font-semibold">
              SJ
            </div>
            <div>
              <p className="font-semibold text-[#050505]">Sarah Johnson</p>
              <p className="text-xs text-[#65676B]">2 hours ago · 🌍</p>
            </div>
          </div>
          <p className="text-[#050505] mb-3">Just finished an amazing hike! The view was breathtaking 🏔️</p>
          <div className="w-full h-[200px] bg-[#E4E6EB] rounded-lg flex items-center justify-center">
            <span className="text-6xl">🏔️</span>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-semibold">
                  {c.author.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="bg-[#F0F2F5] rounded-lg p-3 mb-2">
                    <p className="font-semibold text-[#050505] text-sm mb-1">{c.author}</p>
                    <p className="text-[#050505]">{c.content}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#65676B]">
                    <button className="flex items-center gap-1 hover:text-[#1877F2]">
                      <Heart className="w-4 h-4" />
                      <span>{c.likes}</span>
                    </button>
                    <span>{c.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="bg-white rounded-lg shadow-sm p-4 sticky bottom-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-semibold">
              JD
            </div>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 h-10 px-4 rounded-full bg-[#F0F2F5] border-none focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
            />
            <button className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center hover:bg-[#166FE5] transition-colors">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

