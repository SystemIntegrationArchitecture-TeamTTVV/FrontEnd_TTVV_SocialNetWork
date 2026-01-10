import { useNavigate, useParams } from 'react-router-dom';
import { X, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

export default function PostEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [content, setContent] = useState('Just finished an amazing hike! The view was breathtaking 🏔️');

  const handleSave = () => {
    console.log('Save post:', id, content);
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[#E4E6EB] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#050505]">Edit Post</h2>
          <button
            onClick={() => navigate('/home')}
            className="w-9 h-9 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#050505]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[200px] p-2 border border-[#E4E6EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877F2] resize-none"
          />

          <button
            onClick={handleSave}
            className="w-full h-11 bg-[#1877F2] text-white font-semibold rounded-md hover:bg-[#166FE5] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

