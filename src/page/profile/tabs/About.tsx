import { useTranslation } from "react-i18next";
import { type User } from "../../../apis/users";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react";

interface AboutProps {
  displayUser: (User & {
    workPlace?: string;
    education?: string;
    showEmail?: boolean;
    showPhone?: boolean;
    phoneNumber?: string;
    interests?: string[];
  }) | null;
}

export default function About({ displayUser }: AboutProps) {
  const { t } = useTranslation();
  if (!displayUser) return null;

  return (
    <div className="space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">
        {t("profilePage.about.title")}
      </h2>

      {/* Bio */}
      {displayUser.bio && (
        <p className="text-gray-700 leading-relaxed">{displayUser.bio}</p>
      )}

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Info
          icon={UserIcon}
          label={t("profilePage.about.fullName")}
          value={displayUser.fullName ?? ""}
        />
        <Info
          icon={UserIcon}
          label={t("profilePage.about.username")}
          value={`@${displayUser.username ?? ""}`}
        />

        {(displayUser.city || displayUser.country) && (
          <Info
            icon={MapPin}
            label={t("profilePage.about.location")}
            value={[displayUser.city, displayUser.country]
              .filter(Boolean)
              .join(", ")}
          />
        )}

        {displayUser.workPlace && (
          <Info
            icon={Briefcase}
            label={t("profilePage.about.workplace")}
            value={displayUser.workPlace}
          />
        )}

        {displayUser.education && (
          <Info
            icon={GraduationCap}
            label={t("profilePage.about.education")}
            value={displayUser.education}
          />
        )}

        {displayUser.showEmail && displayUser.email && (
          <Info
            icon={Mail}
            label={t("profilePage.about.email")}
            value={displayUser.email}
          />
        )}

        {displayUser.showPhone && displayUser.phoneNumber && (
          <Info
            icon={Phone}
            label={t("profilePage.about.phone")}
            value={displayUser.phoneNumber}
          />
        )}
      </div>

      {/* Interests */}
      {((displayUser.interests ?? []).length > 0) && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            {t("profilePage.about.interests")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(displayUser.interests ?? []).map((interest, index) => (
              <span
                key={index}
                className="rounded-md bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-800"
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
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
