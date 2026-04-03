import {
  Calendar,
  FileText,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type ActivityType =
  | "post"
  | "like"
  | "comment"
  | "friend"
  | "share"
  | "photo";

type ActivityItem = {
  id: number;
  type: ActivityType;
  icon: LucideIcon;
  color: string;
  timeKey: "2h" | "5h" | "1d" | "2d" | "3d" | "5d";
};

export default function ActivityLog() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");

  const activities = useMemo<ActivityItem[]>(
    () => [
      {
        id: 1,
        type: "post",
        icon: FileText,
        color: "#1877F2",
        timeKey: "2h",
      },
      {
        id: 2,
        type: "like",
        icon: Heart,
        color: "#FF6B6B",
        timeKey: "5h",
      },
      {
        id: 3,
        type: "comment",
        icon: MessageCircle,
        color: "#42B72A",
        timeKey: "1d",
      },
      {
        id: 4,
        type: "friend",
        icon: UserPlus,
        color: "#4ECDC4",
        timeKey: "2d",
      },
      {
        id: 5,
        type: "share",
        icon: Share2,
        color: "#9B59B6",
        timeKey: "3d",
      },
      {
        id: 6,
        type: "photo",
        icon: ImageIcon,
        color: "#F59E0B",
        timeKey: "5d",
      },
    ],
    [],
  );

  const filters = useMemo(
    () => [
      { id: "all", label: t("profilePage.activityLog.filterAll") },
      { id: "post", label: t("profilePage.activityLog.filterPost") },
      { id: "like", label: t("profilePage.activityLog.filterLike") },
      { id: "comment", label: t("profilePage.activityLog.filterComment") },
      { id: "friend", label: t("profilePage.activityLog.filterFriend") },
      { id: "share", label: t("profilePage.activityLog.filterShare") },
    ],
    [t],
  );

  const filteredActivities =
    activeFilter === "all"
      ? activities
      : activities.filter((activity) => activity.type === activeFilter);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("profilePage.activityLog.title")}
        </h1>
        <p className="text-base text-gray-600 mt-1">
          {t("profilePage.activityLog.subtitle")}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-base transition-all ${
                activeFilter === filter.id
                  ? "bg-blue-50 text-blue-600 border-2 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredActivities.map((activity) => {
          const Icon = activity.icon;
          const title = t(
            `profilePage.activityLog.items.${activity.type}.title`,
          );
          const description = t(
            `profilePage.activityLog.items.${activity.type}.description`,
          );
          const time = t(`profilePage.activityLog.time.${activity.timeKey}`);
          return (
            <div
              key={activity.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: activity.color + "20" }}
                >
                  <Icon className="w-7 h-7" style={{ color: activity.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-lg text-gray-900 mb-1">
                        {title}
                      </p>
                      <p className="text-base text-gray-600">{description}</p>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0 ml-4">
                      {time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t("profilePage.activityLog.emptyTitle")}
          </h3>
          <p className="text-base text-gray-600">
            {t("profilePage.activityLog.emptyDescription")}
          </p>
        </div>
      )}
    </div>
  );
}
