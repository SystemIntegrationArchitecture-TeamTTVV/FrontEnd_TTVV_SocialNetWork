import { useEffect, useState } from "react";
import { authApi } from "../../../apis/auth";
import { usersApi, type User } from "../../../apis/users";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react";

interface AboutProps {
  displayUser: User | null;
}

export default function About({ displayUser }: AboutProps) {
  const currentUser = authApi.getCurrentUser();

  if (!displayUser) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">About</h2>

      {/* Bio */}
      {displayUser.bio && (
        <p className="text-gray-700 leading-relaxed">{displayUser.bio}</p>
      )}

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Info icon={UserIcon} label="Full name" value={displayUser.fullName} />
        <Info
          icon={UserIcon}
          label="Username"
          value={`@${displayUser.username}`}
        />

        {(displayUser.city || displayUser.country) && (
          <Info
            icon={MapPin}
            label="Location"
            value={[displayUser.city, displayUser.country]
              .filter(Boolean)
              .join(", ")}
          />
        )}

        {displayUser.workPlace && (
          <Info
            icon={Briefcase}
            label="Workplace"
            value={displayUser.workPlace}
          />
        )}

        {displayUser.education && (
          <Info
            icon={GraduationCap}
            label="Education"
            value={displayUser.education}
          />
        )}

        {displayUser.showEmail && displayUser.email && (
          <Info icon={Mail} label="Email" value={displayUser.email} />
        )}

        {displayUser.showPhone && displayUser.phoneNumber && (
          <Info icon={Phone} label="Phone" value={displayUser.phoneNumber} />
        )}
      </div>

      {/* Interests */}
      {displayUser.interests?.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {displayUser.interests.map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Reusable row */
function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-gray-400 mt-1" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
