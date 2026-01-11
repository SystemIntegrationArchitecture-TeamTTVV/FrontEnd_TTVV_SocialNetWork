import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Download, Share2, Heart, MoreVertical } from 'lucide-react';
import { useState } from 'react';

export default function PhotoViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Mock photos data
  const photos = [
    {
      id: 1,
      url: 'photo-1.jpg',
      thumbnail: '🖼️',
      title: 'Ảnh 1',
      date: '2 ngày trước',
      likes: 125,
      comments: 23,
    },
    {
      id: 2,
      url: 'photo-2.jpg',
      thumbnail: '📷',
      title: 'Ảnh 2',
      date: '5 ngày trước',
      likes: 89,
      comments: 15,
    },
    {
      id: 3,
      url: 'photo-3.jpg',
      thumbnail: '🖼️',
      title: 'Ảnh 3',
      date: '1 tuần trước',
      likes: 234,
      comments: 45,
    },
  ];

  const currentPhoto = photos[currentIndex] || photos[0];

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="h-20 px-6 flex items-center justify-between bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <p className="text-white font-semibold text-lg">{currentPhoto.title}</p>
            <p className="text-gray-400 text-sm">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isLiked
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
            <Download className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
            <Share2 className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Photo Display */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-9xl">{currentPhoto.thumbnail}</div>
        </div>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-6 w-14 h-14 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors text-white z-10"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-6 w-14 h-14 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors text-white z-10"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-32 px-6 py-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold text-lg">{currentPhoto.title}</p>
            <p className="text-gray-400 text-sm">{currentPhoto.date}</p>
          </div>
          <div className="flex items-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <span className="font-semibold">{currentPhoto.likes}</span>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              <span className="font-semibold">{currentPhoto.comments}</span>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2 justify-center">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-800">
                  {photo.thumbnail}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
