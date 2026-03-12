import DiscussionTab from "./tabs/DiscussionTab";
import MembersTab from "./tabs/MembersTab";
import PhotosTab from "./tabs/PhotosTab";
import AboutTab from "./tabs/AboutTab";

import type { GroupData } from "../../../apis/groupsApi";
import { groupsApi } from "../../../apis/groupsApi";
import { authApi } from "../../../apis/auth";

import { useEffect, useState } from "react";

interface Props {
  activeTab: string;
  group: GroupData;
}

export default function GroupContent({ activeTab, group }: Props) {

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

        const result = await groupsApi.checkUserMembership(
          group.id,
          userId
        );

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
      <div className="bg-white rounded-lg shadow-sm p-10 text-center">
        Đang kiểm tra quyền truy cập...
      </div>
    );

  }

  /* ---------------- Not member ---------------- */

  if (!isMember && activeTab !== "about") {

    return (
      <div className="bg-white rounded-lg shadow-sm p-10 text-center">

        <div className="text-4xl mb-3">🔒</div>

        <h3 className="text-lg font-bold mb-2">
          Bạn chưa tham gia nhóm
        </h3>

        <p className="text-gray-500">
          Hãy tham gia nhóm để xem nội dung và thảo luận
        </p>

      </div>
    );

  }

  /* ---------------- Tabs ---------------- */

  if (activeTab === "discussion") {
    return <DiscussionTab />;
  }

  if (activeTab === "members") {
    return (
      <MembersTab
        groupId={group.id!}
        adminId={group.adminId!}
      />
    );
  }

  if (activeTab === "photos") {
    return <PhotosTab />;
  }

  if (activeTab === "about") {
    return <AboutTab group={group} />;
  }

  return null;

}