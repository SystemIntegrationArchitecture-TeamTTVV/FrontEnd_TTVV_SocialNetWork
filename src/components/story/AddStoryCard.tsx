import { Plus } from 'lucide-react';

type Props = {
  avatar?: string;
  name?: string;
  onClick?: () => void;
};

export default function AddStoryCard({ avatar, name = 'Create story', onClick }: Props) {
  return (
    <button
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
        {avatar && (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
          />
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />

      {/* Plus */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center border-4 border-white">
          <Plus className="w-5 h-5" />
        </div>
      </div>

      {/* Text */}
      <div className="absolute bottom-3 w-full text-center">
        <span className="text-sm font-semibold text-white">
          Create story
        </span>
      </div>
    </button>
  );
}
