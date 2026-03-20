import { useParams } from "react-router-dom";
import {
  Check, Bell, Share2, MoreVertical, Loader2, Users,
  LogOut, Settings, Trash2, Clock, UserPlus, Lock, Globe,
  Gamepad2, Plane, Camera, BookOpen, ChefHat,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { groupsApi, type GroupData } from "../../apis/groupsApi";
import GroupContent from "./group/GroupContent";
import { authApi } from "../../apis/auth";
import GroupManageModal from "../social/group/GroupManageModal";
import InviteFriendsModal from "./group/InviteFriendsModal";

const CATEGORY_GRADIENT: Record<string, { from: string; to: string }> = {
  travel:      { from: "#fb923c", to: "#f97316" },
  photography: { from: "#c084fc", to: "#a855f7" },
  gaming:      { from: "#60a5fa", to: "#3b82f6" },
  book:        { from: "#4ade80", to: "#22c55e" },
  food:        { from: "#fb7185", to: "#f43f5e" },
};
const DEFAULT_GRADIENT = { from: "#60a5fa", to: "#3b82f6" };

function getCategoryIcon(category?: string) {
  const cls = "w-8 h-8";
  switch (category) {
    case "travel":      return <Plane className={cls} />;
    case "photography": return <Camera className={cls} />;
    case "gaming":      return <Gamepad2 className={cls} />;
    case "book":        return <BookOpen className={cls} />;
    case "food":        return <ChefHat className={cls} />;
    default:            return <Users className={cls} />;
  }
}

function getGradient(category?: string) {
  return CATEGORY_GRADIENT[category ?? ""] ?? DEFAULT_GRADIENT;
}

export default function GroupDetail() {
  const { id } = useParams();

  const [group, setGroup] = useState<GroupData | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [openInvite, setOpenInvite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);

  const [currentUser] = useState<{
    id: string; username: string; fullName: string; avatar: string; role: string;
  } | null>(() => authApi.getCurrentUser());

  const userId = currentUser?.id;

  useEffect(() => {
    const loadGroup = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await groupsApi.getGroupById(id);
        setGroup(data);
        if (userId) {
          const role = await groupsApi.getUserRole(id, userId);
          const status = await groupsApi.getUserStatus(id, userId);
          setMyRole(role);
          setMyStatus(status);
        }
      } catch (error) {
        console.error("Load group failed", error);
        setGroup({
          id, name: "Gaming Việt Nam", description: "Cộng đồng game thủ Việt Nam",
          memberCount: 45200, category: "gaming", adminId: "",
        } as GroupData);
      } finally {
        setIsLoading(false);
      }
    };
    loadGroup();
  }, [id, userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleJoinGroup = async () => {
    if (!id || !userId || !group) return;
    try {
      setLoadingJoin(true);
      await groupsApi.joinGroup(id, userId);
      if (group.privacy === "PUBLIC") {
        setMyRole("MEMBER");
        setGroup(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : prev);
      } else if (group.privacy === "PRIVATE") {
        setMyRole("PENDING");
      }
    } catch (error) {
      console.error("Join group failed", error);
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!id || !userId) return;
    try {
      await groupsApi.leaveGroup(id, userId);
      setMyRole(null);
      setGroup(prev => prev ? { ...prev, memberCount: (prev.memberCount || 1) - 1 } : prev);
      setOpenMenu(false);
    } catch (error) {
      console.error("Leave group failed", error);
    }
  };

  if (isLoading || !group) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0c0e14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-[#2b2f45]" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-400 dark:text-[#7e89a6]">Đang tải nhóm...</p>
        </div>
      </div>
    );
  }

  const gradient = getGradient(group.category);
  const isPending = myRole === "PENDING" || myStatus === "PENDING";
  const isAdmin = myRole === "ADMIN";

  const tabList = [
    { id: "posts",    label: "Thảo luận" },
    { id: "featured", label: "Nổi bật" },
    { id: "members",  label: "Thành viên" },
    { id: "events",   label: "Sự kiện" },
    { id: "photos",   label: "Ảnh" },
    { id: "videos",   label: "Video" },
    { id: "about",    label: "Giới thiệu" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0e14]">

      {/* Cover */}
      <div
        className="h-56 md:h-64 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${gradient.from}88, ${gradient.to})` }}
      >
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center text-white/30 dark:text-white/20">
          {getCategoryIcon(group.category)}
        </div>
      </div>

      {/* Info card */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-sm border border-gray-100 dark:border-[#22263a] p-5 mb-4 animate-fade-in">

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 -mt-10 border-4 border-white dark:border-[#1a1d28]"
                style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
              >
                {getCategoryIcon(group.category)}
              </div>

              <div className="min-w-0 pt-0.5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-[#edf0fa] truncate">
                  {group.name}
                </h1>
                <p className="text-sm text-gray-400 dark:text-[#7e89a6] mt-0.5 flex items-center gap-1.5">
                  {group.privacy === "PUBLIC"
                    ? <Globe className="w-3.5 h-3.5" />
                    : <Lock className="w-3.5 h-3.5" />
                  }
                  {group.privacy === "PUBLIC" ? "Nhóm công khai" : "Nhóm riêng tư"}
                  <span className="text-gray-300 dark:text-[#353a54]">·</span>
                  {group.memberCount || 0} thành viên
                </p>
              </div>
            </div>

            {/* Menu */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setOpenMenu(!openMenu)}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center text-gray-400 dark:text-[#6a7494] hover:bg-gray-200 dark:hover:bg-[#2b2f45] hover:text-gray-600 dark:hover:text-[#edf0fa] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {openMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1d28] rounded-xl shadow-lg border border-gray-100 dark:border-[#2b2f45] py-1.5 z-50 animate-fade-in">
                  {isAdmin && (
                    <>
                      <MenuBtn
                        icon={Settings}
                        label="Quản lý nhóm"
                        onClick={() => { setSelectedGroup(group); setOpenMenu(false); }}
                      />
                      <MenuBtn icon={Settings} label="Chỉnh sửa nhóm" />
                      <MenuBtn icon={Trash2} label="Xóa nhóm" danger />
                    </>
                  )}
                  {myRole === "MEMBER" && (
                    <MenuBtn icon={LogOut} label="Rời nhóm" danger onClick={handleLeaveGroup} />
                  )}
                  {isPending && (
                    <MenuBtn icon={Clock} label="Đang chờ duyệt" disabled />
                  )}
                  {!myRole && myStatus !== "PENDING" && (
                    <MenuBtn icon={UserPlus} label="Tham gia nhóm" onClick={handleJoinGroup} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-[#22263a]">
            {(myRole || myStatus === "PENDING") ? (
              isPending ? (
                <button
                  disabled
                  className="h-9 px-4 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-sm font-semibold flex items-center gap-2 cursor-not-allowed"
                >
                  <Clock className="w-4 h-4" />
                  Đang chờ duyệt
                </button>
              ) : (
                <button className="h-9 px-4 rounded-xl bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 shadow-sm">
                  <Check className="w-4 h-4" />
                  Đã tham gia
                </button>
              )
            ) : (
              <button
                onClick={handleJoinGroup}
                disabled={loadingJoin}
                className="h-9 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-60"
              >
                {loadingJoin ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {loadingJoin ? "Đang tham gia..." : "Tham gia nhóm"}
              </button>
            )}

            <button className="h-9 px-4 rounded-xl bg-gray-100 dark:bg-[#22263a] text-gray-600 dark:text-[#9aa3bc] text-sm font-medium flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors">
              <Bell className="w-4 h-4" />
              Thông báo
            </button>

            <button
              onClick={() => setOpenInvite(true)}
              className="h-9 px-4 rounded-xl bg-gray-100 dark:bg-[#22263a] text-gray-600 dark:text-[#9aa3bc] text-sm font-medium flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Mời bạn bè
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-sm border border-gray-100 dark:border-[#22263a] mb-4 overflow-hidden">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {tabList.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-[#7e89a6] hover:text-gray-700 dark:hover:text-[#c8ccde] hover:bg-gray-50 dark:hover:bg-[#1e2133]"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="pb-8">
          <GroupContent activeTab={activeTab} group={group} />
        </div>

        {selectedGroup && (
          <GroupManageModal
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
          />
        )}
      </div>

      {openInvite && group && userId && (
        <InviteFriendsModal
          groupId={group.id!}
          userId={userId}
          onClose={() => setOpenInvite(false)}
        />
      )}
    </div>
  );
}

function MenuBtn({ icon: Icon, label, danger, disabled, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        danger
          ? "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
          : "text-gray-700 dark:text-[#c8ccde] hover:bg-gray-50 dark:hover:bg-[#1e2133]"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}
