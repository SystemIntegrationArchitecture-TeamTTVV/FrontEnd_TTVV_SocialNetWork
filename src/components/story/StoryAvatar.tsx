import { resolveMediaUrl } from '../../utils/mediaUrl';
import { getUserInitials } from '../../utils/userDisplay';

type Props = {
  name: string;
  avatar?: string | null;
  className?: string;
};

/** Không render <img src=""> — tránh cảnh báo React khi avatar rỗng (sau sanitize / thiếu URL). */
export default function StoryAvatar({ name, avatar, className = '' }: Props) {
  const src = resolveMediaUrl(avatar);
  if (!src) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-gray-500 to-gray-600 text-xs font-semibold uppercase text-white ${className}`}
        aria-hidden
      >
        {getUserInitials(name)}
      </div>
    );
  }
  return <img src={src} alt={name} className={className} />;
}
