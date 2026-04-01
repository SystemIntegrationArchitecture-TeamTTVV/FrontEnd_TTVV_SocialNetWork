import { useNavigate } from "react-router-dom";
import { Search, Plus, Settings, Users, Compass, Crown, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { authApi } from "../../apis/auth";
import { groupsApi, type GroupData } from "../../apis/groupsApi";

import {
  PlaneIcon,
  CameraIcon,
  GamepadIcon,
  BookIcon,
  ChefHatIcon,
} from "../../common/icons/IconComponents";

import CreateGroupModal from "../social/group/CreateGroupModal";
import GroupManageModal from "../social/group/GroupManageModal";

const CATEGORY_COLORS: Record<string, { from: string; to: string; bg: string; bgDark: string; text: string; textDark: string }> = {
  travel:      { from: "#fb923c", to: "#f97316", bg: "#fff7ed",                   bgDark: "rgba(249,115,22,0.15)",  text: "#f97316", textDark: "#fb923c" },
  photography: { from: "#c084fc", to: "#a855f7", bg: "#fdf4ff",                   bgDark: "rgba(168,85,247,0.15)",  text: "#a855f7", textDark: "#c084fc" },
  gaming:      { from: "#60a5fa", to: "#3b82f6", bg: "#eff6ff",                   bgDark: "rgba(59,130,246,0.15)",  text: "#3b82f6", textDark: "#60a5fa" },
  book:        { from: "#4ade80", to: "#22c55e", bg: "#f0fdf4",                   bgDark: "rgba(34,197,94,0.15)",   text: "#22c55e", textDark: "#4ade80" },
  food:        { from: "#fb7185", to: "#f43f5e", bg: "#fff1f2",                   bgDark: "rgba(244,63,94,0.15)",   text: "#f43f5e", textDark: "#fb7185" },
  default:     { from: "#60a5fa", to: "#3b82f6", bg: "#eff6ff",                   bgDark: "rgba(59,130,246,0.15)",  text: "#3b82f6", textDark: "#60a5fa" },
};

export default function Groups() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"your" | "joined" | "discover">("your");
  const [yourGroups, setYourGroups]       = useState<GroupData[]>([]);
  const [joinedGroups, setJoinedGroups]   = useState<GroupData[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<GroupData[]>([]);
  const [searchText, setSearchText]       = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isSearching, setIsSearching]     = useState(false);
  const [gridKey, setGridKey]             = useState(0);

  const [currentUser] = useState(() => authApi.getCurrentUser());
  const userId = currentUser?.id;

  const loadGroups = async () => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [your, joined, all] = await Promise.all([
        groupsApi.getGroupsByAdminId(userId),
        groupsApi.getGroupsByUserId(userId),
        groupsApi.getAllGroups(),
      ]);
      const safeYour = Array.isArray(your) ? your : [];
      const safeJoined = Array.isArray(joined) ? joined : [];
      const safeAll = Array.isArray(all) ? all : [];
      setYourGroups(safeYour);
      setJoinedGroups(safeJoined);
      setDiscoverGroups(
        safeAll.filter(g => !safeYour.some(y => y.id === g.id) && !safeJoined.some(j => j.id === g.id))
      );
      setGridKey(k => k + 1);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadGroups(); }, []);

  const handleTabChange = (tab: "your" | "joined" | "discover") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setGridKey(k => k + 1);
  };

  const handleSearch = async (value: string) => {
    setSearchText(value);
    if (!value) { loadGroups(); return; }
    setIsSearching(true);
    try {
      const result = await groupsApi.searchGroups(value);
      setDiscoverGroups(Array.isArray(result) ? result : []);
      setActiveTab("discover");
      setGridKey(k => k + 1);
    } catch (err) {
      console.error('Failed to search groups:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const getAvatarIcon = (category?: string) => {
    switch (category) {
      case "travel":      return <PlaneIcon className="w-6 h-6" />;
      case "photography": return <CameraIcon className="w-6 h-6" />;
      case "gaming":      return <GamepadIcon className="w-6 h-6" />;
      case "book":        return <BookIcon className="w-6 h-6" />;
      case "food":        return <ChefHatIcon className="w-6 h-6" />;
      default:            return <PlaneIcon className="w-6 h-6" />;
    }
  };

  const getColors = (category?: string) => {
    return CATEGORY_COLORS[category ?? "default"] ?? CATEGORY_COLORS.default;
  };

  const tabs = [
    { id: "your",     label: t("groups.tabs.your"), icon: Crown,   count: yourGroups.length },
    { id: "joined",   label: t("groups.tabs.joined"),  icon: Users,   count: joinedGroups.length },
    { id: "discover", label: t("groups.tabs.discover"),     icon: Compass, count: discoverGroups.length },
  ] as const;

  const displayGroups: GroupData[] =
    activeTab === "your" ? yourGroups :
    activeTab === "joined" ? joinedGroups : discoverGroups;

  return (
    <>
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-7 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 dark:text-[#edf0fa] tracking-tight">
              {t("groups.title")}
            </h1>
            <p className="text-sm text-gray-400 dark:text-[#7e89a6] mt-0.5">
              {t("groups.subtitle")}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-[0.97] text-white text-sm font-semibold shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("groups.create")}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100/50 dark:bg-[#1a1d28]/50 glass-surface rounded-[24px] p-1.5 mb-8">

          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-[18px] text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white dark:bg-[#242838] text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                    : "text-gray-500 dark:text-[#9aa3bc] hover:text-gray-700 dark:hover:text-[#edf0fa] hover:bg-white/50 dark:hover:bg-[#22263a]"
                }`}
              >

                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    : "bg-gray-200/60 dark:bg-[rgba(255,255,255,0.06)] text-gray-400 dark:text-[#6a7494]"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-7">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-[#4e5870] pointer-events-none" />
          <input
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("groups.searchPlaceholder")}
            className="w-full h-12 pl-12 pr-10 rounded-2xl border border-gray-200/50 dark:border-white/5 bg-gray-100/50 dark:bg-[#1e2133]/50 text-[15px] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#4e5870] outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#22263a] transition-all"
          />

          {isSearching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4">
              <div className="w-full h-full rounded-full border-2 border-gray-200 dark:border-[#2b2f45] border-t-blue-500 dark:border-t-blue-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Grid */}
        <div
          key={gridKey}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >

          {/* Loading skeleton */}
          {isLoading && Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-gray-100 dark:border-[#2b2f45] p-5 flex flex-col items-center animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-linear-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-[#22263a] dark:via-[#2b2f45] dark:to-[#22263a] animate-shimmer bg-size-[200%_100%] mb-3" />
              <div className="h-3 w-3/4 rounded-md bg-gray-100 dark:bg-[#22263a] animate-pulse mb-2" />
              <div className="h-2.5 w-1/2 rounded-md bg-gray-100 dark:bg-[#22263a] animate-pulse mb-3" />
              <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-[#22263a] animate-pulse" />
            </div>
          ))}

          {/* Empty */}
          {!isLoading && displayGroups.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#1a1d28] flex items-center justify-center mb-4">
                <SearchX className="w-7 h-7 text-gray-300 dark:text-[#4a5270]" />
              </div>
              <p className="text-sm text-gray-400 dark:text-[#7e89a6] font-medium">{t("groups.empty")}</p>
            </div>
          )}

          {/* Group cards */}
          {!isLoading && displayGroups.map((group, index) => {
            const isOwner = group.adminId === userId;
            const colors = getColors(group.category);
            const pillBg = isDark ? colors.bgDark : colors.bg;
            const pillText = isDark ? colors.textDark : colors.text;

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-[#1a1d28] rounded-[32px] border border-gray-100/50 dark:border-white/5 p-6 flex flex-col items-center relative cursor-pointer group hover:shadow-lg hover:-translate-y-1 active:scale-[0.97] transition-all duration-300 animate-card-in"
                style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                onClick={() => navigate(`/groups/${group.id}`)}
              >

                {/* Manage button */}
                {isOwner && (
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg border border-gray-100 dark:border-[#2b2f45] bg-gray-50 dark:bg-[#22263a] flex items-center justify-center text-gray-400 dark:text-[#6a7494] hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                    onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); }}
                    title={t("groups.manage")}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform duration-200"
                  style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                >
                  {getAvatarIcon(group.category)}
                </div>

                {/* Name */}
                <p className="text-sm font-semibold text-gray-900 dark:text-[#edf0fa] text-center truncate w-full mb-1">
                  {group.name}
                </p>

                {/* Member count */}
                <p className="text-xs text-gray-400 dark:text-[#6a7494] mb-3">
                  {t("groups.members", { count: group.memberCount ?? 0 })}
                </p>

                {/* Category pill */}
                {group.category && (
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{ background: pillBg, color: pillText }}
                  >
                    {group.category}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && userId && (
        <CreateGroupModal
          userId={userId}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadGroups}
        />
      )}

      {selectedGroup && (
        <GroupManageModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </>
  );
}
