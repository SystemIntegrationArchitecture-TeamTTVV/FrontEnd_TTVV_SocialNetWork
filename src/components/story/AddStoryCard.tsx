import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

type Props = {
  avatar?: string;
  name?: string;
  onClick?: () => void;
};

export default function AddStoryCard({
  avatar,
  name = 'Create story',
  onClick,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(avatar?.trim()) && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [avatar]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        relative w-32 h-48 shrink-0
        rounded-2xl overflow-hidden
        bg-white border border-gray-200
        hover:shadow-lg transition
        group
      "
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gray-100">
        {showImg ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />

      {/* Plus button */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center border-4 border-white shadow">
          <Plus className="w-5 h-5" />
        </div>
      </div>

      {/* Text */}
      <div className="absolute bottom-3 w-full text-center z-10 px-2">
        <span className="text-sm font-semibold text-white leading-tight">
          {name}
        </span>
      </div>
    </button>
  );
}
