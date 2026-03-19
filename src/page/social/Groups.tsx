import { useNavigate } from "react-router-dom";
import { Search, Plus, Settings, Users, Compass, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
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

const CATEGORY_STYLES: Record<string, { bg: string; text: string; gradient: string }> = {
  travel:      { bg: "#fff7ed", text: "#f97316", gradient: "linear-gradient(135deg,#fb923c,#f97316)" },
  photography: { bg: "#fdf4ff", text: "#a855f7", gradient: "linear-gradient(135deg,#c084fc,#a855f7)" },
  gaming:      { bg: "#eff6ff", text: "#3b82f6", gradient: "linear-gradient(135deg,#60a5fa,#3b82f6)" },
  book:        { bg: "#f0fdf4", text: "#22c55e", gradient: "linear-gradient(135deg,#4ade80,#22c55e)" },
  food:        { bg: "#fff1f2", text: "#f43f5e", gradient: "linear-gradient(135deg,#fb7185,#f43f5e)" },
  default:     { bg: "#f5f3ff", text: "#6c63ff", gradient: "linear-gradient(135deg,#818cf8,#6c63ff)" },
};

const CATEGORY_STYLES_DARK: Record<string, { bg: string; text: string; gradient: string }> = {
  travel:      { bg: "rgba(249,115,22,0.15)",  text: "#fb923c", gradient: "linear-gradient(135deg,#fb923c,#f97316)" },
  photography: { bg: "rgba(168,85,247,0.15)",  text: "#c084fc", gradient: "linear-gradient(135deg,#c084fc,#a855f7)" },
  gaming:      { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa", gradient: "linear-gradient(135deg,#60a5fa,#3b82f6)" },
  book:        { bg: "rgba(34,197,94,0.15)",   text: "#4ade80", gradient: "linear-gradient(135deg,#4ade80,#22c55e)" },
  food:        { bg: "rgba(244,63,94,0.15)",   text: "#fb7185", gradient: "linear-gradient(135deg,#fb7185,#f43f5e)" },
  default:     { bg: "rgba(129,140,248,0.15)", text: "#818cf8", gradient: "linear-gradient(135deg,#818cf8,#6c63ff)" },
};

export default function Groups() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<"your" | "joined" | "discover">("your");
  const [yourGroups, setYourGroups]       = useState<GroupData[]>([]);
  const [joinedGroups, setJoinedGroups]   = useState<GroupData[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<GroupData[]>([]);
  const [searchText, setSearchText]       = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isSearching, setIsSearching]     = useState(false);
  const [gridKey, setGridKey]             = useState(0); // triggers re-animation

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
      case "travel":      return <PlaneIcon className="w-7 h-7" />;
      case "photography": return <CameraIcon className="w-7 h-7" />;
      case "gaming":      return <GamepadIcon className="w-7 h-7" />;
      case "book":        return <BookIcon className="w-7 h-7" />;
      case "food":        return <ChefHatIcon className="w-7 h-7" />;
      default:            return <PlaneIcon className="w-7 h-7" />;
    }
  };

  const getStyle = (category?: string) => {
    const map = isDark ? CATEGORY_STYLES_DARK : CATEGORY_STYLES;
    return map[category ?? "default"] ?? map.default;
  };

  const tabs = [
    { id: "your",     label: "Your Groups", icon: Crown,   count: yourGroups.length },
    { id: "joined",   label: "Joined",      icon: Users,   count: joinedGroups.length },
    { id: "discover", label: "Discover",    icon: Compass, count: discoverGroups.length },
  ] as const;

  const displayGroups: GroupData[] =
    activeTab === "your" ? yourGroups :
    activeTab === "joined" ? joinedGroups : discoverGroups;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .gp-wrap {
          font-family: 'DM Sans', sans-serif;
          max-width: 1100px;
          margin: 0 auto;
          padding: 36px 28px;
        }

        /* ── Top bar ── */
        .gp-topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 16px;
        }

        .gp-heading {
          font-size: 28px; font-weight: 700;
          color: #0f0f1a; letter-spacing: -0.5px; margin: 0;
        }

        .gp-heading span {
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gp-subtext {
          font-size: 13.5px; color: #9b9bae; margin: 4px 0 0;
        }

        .gp-create-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          border: none; border-radius: 12px;
          background: linear-gradient(135deg, #6c63ff, #8b82ff);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(108,99,255,0.35);
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .gp-create-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(108,99,255,0.45);
        }

        /* ── Tabs ── */
        .gp-tabs {
          display: flex; gap: 6px;
          background: #f4f4f9;
          border-radius: 16px;
          padding: 6px;
          margin-bottom: 24px;
        }

        .gp-tab {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 7px;
          height: 42px;
          border-radius: 11px;
          border: none; background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 500;
          color: #6b6b80;
          cursor: pointer;
          transition: all 0.18s;
        }
        .gp-tab:hover { background: #ececf5; color: #0f0f1a; }
        .gp-tab.active {
          background: #fff;
          color: #6c63ff;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .gp-tab-icon { width: 15px; height: 15px; }

        .gp-tab-count {
          font-size: 11px; font-weight: 600;
          padding: 1px 7px; border-radius: 20px;
          background: #6c63ff18; color: #6c63ff;
        }

        .gp-tab:not(.active) .gp-tab-count {
          background: #0f0f1a12; color: #6b6b80;
        }

        /* ── Search ── */
        .gp-search-wrap {
          position: relative; margin-bottom: 28px;
        }

        .gp-search-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          width: 16px; height: 16px; color: #c4c4d0;
          pointer-events: none;
        }

        .gp-search {
          width: 100%; height: 44px;
          padding: 0 16px 0 42px;
          border: 1.5px solid #e8e8f0;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #0f0f1a;
          background: #fafafa;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .gp-search::placeholder { color: #c4c4d0; }
        .gp-search:focus {
          border-color: #6c63ff; background: #fff;
          box-shadow: 0 0 0 4px rgba(108,99,255,0.1);
        }

        /* ── Grid ── */
        .gp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        /* ── Card ── */
        .gp-card {
          background: #fff;
          border-radius: 18px;
          border: 1.5px solid #ececf4;
          padding: 24px 20px 20px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          display: flex; flex-direction: column; align-items: center;
        }
        .gp-card:hover {
          border-color: #d8d4ff;
          box-shadow: 0 8px 32px rgba(108,99,255,0.12);
          transform: translateY(-2px);
        }

        .gp-card-manage {
          position: absolute; top: 12px; right: 12px;
          width: 30px; height: 30px;
          border-radius: 8px; border: 1.5px solid #ececf4;
          background: #fafafa; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #9b9bae;
          transition: all 0.15s;
        }
        .gp-card-manage:hover {
          background: #f0f0f8; border-color: #d8d4ff; color: #6c63ff;
        }

        .gp-card-avatar {
          width: 64px; height: 64px;
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
          transition: transform 0.2s;
        }
        .gp-card:hover .gp-card-avatar { transform: scale(1.08); }

        .gp-card-name {
          font-size: 15px; font-weight: 600;
          color: #0f0f1a; text-align: center;
          margin: 0 0 5px;
          letter-spacing: -0.2px;
        }

        .gp-card-meta {
          font-size: 12.5px; color: #9b9bae;
          text-align: center; margin: 0 0 16px;
        }

        .gp-card-pill {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.3px;
          padding: 3px 10px; border-radius: 20px;
          text-transform: capitalize;
        }

        /* ── Empty state ── */
        .gp-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 48px 0;
          color: #c4c4d0;
          font-size: 14px;
        }
        .gp-empty-icon {
          font-size: 36px; margin-bottom: 10px;
        }

        /* ── Dark mode overrides ── */
        html.dark .gp-heading          { color: #edf0fa; }
        html.dark .gp-subtext          { color: #7e89a6; }

        html.dark .gp-create-btn {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
        }

        html.dark .gp-tabs             { background: #1a1d28; }
        html.dark .gp-tab              { color: #9aa3bc; }
        html.dark .gp-tab:hover        { background: #22263a; color: #edf0fa; }
        html.dark .gp-tab.active {
          background: #242838;
          color: #818cf8;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        }
        html.dark .gp-tab-count        { background: rgba(129,140,248,0.15); color: #818cf8; }
        html.dark .gp-tab:not(.active) .gp-tab-count { background: rgba(255,255,255,0.06); color: #6a7494; }

        html.dark .gp-search {
          background: #1e2133;
          border-color: #2b2f45;
          color: #edf0fa;
        }
        html.dark .gp-search::placeholder { color: #4e5870; }
        html.dark .gp-search:focus {
          border-color: #6366f1;
          background: #22263a;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.15);
        }
        html.dark .gp-search-icon      { color: #4e5870; }

        html.dark .gp-card {
          background: #1a1d28;
          border-color: #2b2f45;
        }
        html.dark .gp-card:hover {
          border-color: #6366f1;
          box-shadow: 0 8px 32px rgba(99,102,241,0.18);
        }
        html.dark .gp-card-manage {
          background: #22263a;
          border-color: #2b2f45;
          color: #6a7494;
        }
        html.dark .gp-card-manage:hover {
          background: #252940;
          border-color: #6366f1;
          color: #818cf8;
        }
        html.dark .gp-card-name        { color: #edf0fa; }
        html.dark .gp-card-meta        { color: #6a7494; }
        html.dark .gp-empty            { color: #4e5870; }
        /* ── Animations ── */

        @keyframes gp-card-in {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        @keyframes gp-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }

        @keyframes gp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .gp-card-animate {
          animation: gp-card-in 0.38s cubic-bezier(0.34, 1.4, 0.64, 1) both;
        }

        /* Press / click feedback */
        .gp-card:active {
          transform: scale(0.96) translateY(0) !important;
          transition: transform 0.08s ease !important;
        }

        /* ── Skeleton ── */
        .gp-skeleton-card {
          background: #fff;
          border-radius: 18px;
          border: 1.5px solid #ececf4;
          padding: 24px 20px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          animation: gp-fade-in 0.3s ease both;
        }

        .gp-shimmer {
          background: linear-gradient(90deg,
            #f0f0f5 25%,
            #e4e4ec 50%,
            #f0f0f5 75%
          );
          background-size: 800px 100%;
          animation: gp-shimmer 1.4s ease-in-out infinite;
          border-radius: 8px;
        }

        .gp-skeleton-avatar {
          width: 64px; height: 64px;
          border-radius: 18px;
          margin-bottom: 4px;
        }

        .gp-skeleton-line {
          height: 12px;
          width: 80%;
        }
        .gp-skeleton-line.short {
          width: 50%; height: 10px;
        }
        .gp-skeleton-pill {
          height: 22px; width: 60px;
          border-radius: 20px; margin-top: 4px;
        }

        /* Dark skeleton */
        html.dark .gp-skeleton-card {
          background: #1a1d28;
          border-color: #2b2f45;
        }
        html.dark .gp-shimmer {
          background: linear-gradient(90deg,
            #22263a 25%,
            #2b2f45 50%,
            #22263a 75%
          );
          background-size: 800px 100%;
        }

        /* Search spinner */
        @keyframes gp-spin {
          to { transform: rotate(360deg); }
        }
        .gp-search-spinner {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          width: 16px; height: 16px;
          border: 2px solid #e0e0f0;
          border-top-color: #6c63ff;
          border-radius: 50%;
          animation: gp-spin 0.7s linear infinite;
        }
        html.dark .gp-search-spinner {
          border-color: #2b2f45;
          border-top-color: #818cf8;
        }
      `}</style>

      <div className="gp-wrap">

        {/* Top bar */}
        <div className="gp-topbar">
          <div>
            <h1 className="gp-heading">Your <span>Groups</span></h1>
            <p className="gp-subtext">Connect and share with people who matter</p>
          </div>
          <button className="gp-create-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Group
          </button>
        </div>

        {/* Tabs */}
        <div className="gp-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`gp-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon className="gp-tab-icon" />
                {tab.label}
                <span className="gp-tab-count">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="gp-search-wrap">
          <Search className="gp-search-icon" />
          <input
            className="gp-search"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search groups by name…"
          />
          {isSearching && <span className="gp-search-spinner" />}
        </div>

        {/* Grid */}
        <div className="gp-grid" key={gridKey}>

          {/* ── Skeleton loading ── */}
          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="gp-skeleton-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="gp-shimmer gp-skeleton-avatar" />
              <div className="gp-shimmer gp-skeleton-line" />
              <div className="gp-shimmer gp-skeleton-line short" />
              <div className="gp-shimmer gp-skeleton-pill" />
            </div>
          ))}

          {/* ── Empty state ── */}
          {!isLoading && displayGroups.length === 0 && (
            <div className="gp-empty">
              <div className="gp-empty-icon">🔍</div>
              No groups found
            </div>
          )}

          {/* ── Group cards with staggered entry ── */}
          {!isLoading && displayGroups.map((group, index) => {
            const isOwner = group.adminId === userId;
            const style = getStyle(group.category);

            return (
              <div
                key={group.id}
                className="gp-card gp-card-animate"
                style={{ animationDelay: `${Math.min(index * 55, 400)}ms` }}
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                {isOwner && (
                  <button
                    className="gp-card-manage"
                    onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); }}
                    title="Manage group"
                  >
                    <Settings size={13} />
                  </button>
                )}

                <div
                  className="gp-card-avatar"
                  style={{ background: style.gradient, color: "#fff" }}
                >
                  {getAvatarIcon(group.category)}
                </div>

                <p className="gp-card-name">{group.name}</p>
                <p className="gp-card-meta">{group.memberCount ?? 0} members</p>

                {group.category && (
                  <span
                    className="gp-card-pill"
                    style={{ background: style.bg, color: style.text }}
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