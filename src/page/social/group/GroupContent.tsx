import DiscussionTab from "./tabs/DiscussionTab";
import MembersTab from "./tabs/MembersTab";
import PhotosTab from "./tabs/PhotosTab";
import AboutTab from "./tabs/AboutTab";

import type { GroupData } from "../../../apis/groupsApi";
import { groupsApi } from "../../../apis/groupsApi";
import { authApi } from "../../../apis/auth";
import PostsTab from "./tabs/PostsTab";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

interface Props {
  activeTab: string;
  group: GroupData;
}

export default function GroupContent({ activeTab, group }: Props) {
  console.log("📦 Group data:", group);

  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());

  const userId = currentUser?.id;
  const [isMember, setIsMember] = useState<boolean | null>(null);

  /* ---------------- Check membership ---------------- */
  useEffect(() => {
    const checkMembership = async () => {
      if (!userId || !group.id) return;
      try {
        const result = await groupsApi.checkUserMembership(group.id, userId);
        setIsMember(result);
      } catch {
        setIsMember(false);
      }
    };
    checkMembership();
  }, [group.id, userId]);

  /* ---------------- Loading ---------------- */
  if (isMember === null) {
    return (
      <div className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-sm border border-gray-100 dark:border-[#22263a] p-10 flex flex-col items-center justify-center gap-3 animate-fade-in">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-[2.5px] border-gray-200 dark:border-[#2b2f45]" />
          <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-blue-500 animate-spin" />
        </div>
        <p className="text-sm text-gray-400 dark:text-[#7e89a6]">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  /* ---------------- Check privacy ---------------- */
  const canView =
    group.privacy === "PUBLIC" || (group.privacy === "PRIVATE" && isMember);

if (!canView && activeTab !== "about") {
  return (
    <div className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-sm border border-gray-100 dark:border-[#22263a] p-10 flex flex-col items-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#22263a] flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-gray-300 dark:text-[#4e5870]" />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-[#edf0fa] mb-1">
        {group.privacy === "PUBLIC" ? "Nhóm công khai" : "Bạn chưa tham gia nhóm"}
      </h3>
      <p className="text-sm text-gray-400 dark:text-[#7e89a6]">
        {group.privacy === "PUBLIC"
          ? "Bạn có thể xem bài viết công khai của nhóm"
          : "Hãy tham gia nhóm để xem nội dung và thảo luận"}
      </p>
    </div>
  );
}

  /* ---------------- Tabs ---------------- */
  if (activeTab === "discussion") return <DiscussionTab />;
  if (activeTab === "members")
    return <MembersTab groupId={group.id!} adminId={group.adminId!} />;
  if (activeTab === "photos") return <PhotosTab />;
  if (activeTab === "about") return <AboutTab group={group} />;
  if (activeTab === "posts") return <PostsTab groupId={group.id!} />;

  return null;
}