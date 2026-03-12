import { useParams } from "react-router-dom";
import {
  Check,
  Bell,
  Share2,
  MoreVertical
} from "lucide-react";
import { useEffect, useState } from "react";
import { groupsApi, type GroupData } from "../../apis/groupsApi";
import GroupContent from "./group/GroupContent";
import { authApi } from '../../apis/auth';
import GroupManageModal from "../social/group/GroupManageModal";
import InviteFriendsModal from "./group/InviteFriendsModal";
export default function GroupDetail() {

  const { id } = useParams();

  const [group, setGroup] = useState<GroupData | null>(null);

  const [activeTab, setActiveTab] = useState("discussion");

  const [myRole, setMyRole] = useState<string | null>(null);

  const [loadingJoin, setLoadingJoin] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);

  const [openInvite, setOpenInvite] = useState(false);
  // userId lấy từ login
  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());

  /* ---------------- Load group ---------------- */
  const userId = currentUser?.id;
  useEffect(() => {

    const loadGroup = async () => {

      if (!id) return;

      try {

        const data = await groupsApi.getGroupById(id);
        setGroup(data);

        if (userId) {
          const role = await groupsApi.getUserRole(id, userId);
          setMyRole(role);
        }

      } catch (error) {

        console.error("Load group failed", error);

        /* fallback dữ liệu ảo */

        setGroup({
          id: id,
          name: "Gaming Việt Nam",
          description: "Cộng đồng game thủ Việt Nam",
          memberCount: 45200,
          category: "gaming",
          adminId: "",
        } as GroupData);

      }

    };

    loadGroup();

  }, [id, userId]);

  /* ---------------- Join group ---------------- */

  const handleJoinGroup = async () => {

    if (!id || !userId) return;

    try {

      setLoadingJoin(true);

      await groupsApi.joinGroup(id, userId);

      setMyRole("MEMBER");

      setGroup(prev =>
        prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : prev
      );

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

      setGroup(prev =>
        prev ? { ...prev, memberCount: (prev.memberCount || 1) - 1 } : prev
      );

      setOpenMenu(false);
    } catch (error) {
      console.error("Leave group failed", error);
    }
  };
  if (!group) return null;

  return (

    <div className="min-h-screen bg-[#F0F2F5]">

      {/* Cover Photo */}

      <div className="h-[280px] bg-gradient-to-br from-[#1877F2] to-[#42B72A] relative">

        <div className="absolute inset-0 flex items-center justify-center text-6xl">
          🎮
        </div>

      </div>

      {/* Group Info */}

      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">

        <div className="bg-white rounded-lg shadow-md p-6 mb-4">

          <div className="flex items-start justify-between mb-4">

            <div className="flex items-start gap-4">

              <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center text-4xl">
                🎮
              </div>

              <div>

                <h1 className="text-3xl font-bold text-[#050505] mb-2">
                  {group.name}
                </h1>

                <p className="text-[#65676B]">
                  Nhóm công khai · {group.memberCount || 0} thành viên
                </p>

              </div>

            </div>

            <div className="relative">

              <button
                onClick={() => setOpenMenu(!openMenu)}
                className="w-10 h-10 rounded-full bg-[#E4E6EB] flex items-center justify-center hover:bg-[#D8DADF] transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-[#050505]" />
              </button>

              {openMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">

                  {/* ADMIN */}
                  {myRole === "ADMIN" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setOpenMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5]"
                      >
                        Quản lý nhóm
                      </button>

                      <button className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5]">
                        Chỉnh sửa nhóm
                      </button>

                      <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-[#F0F2F5]">
                        Xóa nhóm
                      </button>
                    </>
                  )}

                  {/* MEMBER */}
                  {myRole === "MEMBER" && (
                    <button
                      onClick={handleLeaveGroup}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-[#F0F2F5]"
                    >
                      Rời nhóm
                    </button>
                  )}

                  {/* NOT MEMBER */}
                  {!myRole && (
                    <button
                      onClick={handleJoinGroup}
                      className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5]"
                    >
                      Tham gia nhóm
                    </button>
                  )}

                </div>
              )}

            </div>

          </div>

          {/* Action Buttons */}

          <div className="flex gap-3">

            {myRole ? (

              <button className="h-10 px-4 bg-[#1877F2] text-white font-bold rounded-md flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Đã tham gia ({myRole})</span>
              </button>

            ) : (

              <button
                onClick={handleJoinGroup}
                disabled={loadingJoin}
                className="h-10 px-4 bg-[#42B72A] text-white font-bold rounded-md hover:bg-[#36A420]"
              >
                {loadingJoin ? "Đang tham gia..." : "Tham gia nhóm"}
              </button>

            )}

            <button className="h-10 px-4 bg-[#E4E6EB] rounded-md flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Thông báo</span>
            </button>

            <button
              onClick={() => setOpenInvite(true)}
              className="h-10 px-4 bg-[#E4E6EB] rounded-md flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Chia sẻ</span>
            </button>

          </div>

        </div>

        {/* Tabs */}

        <div className="bg-white rounded-lg shadow-sm mb-4">

          <div className="flex items-center gap-2 p-2">

            {[
              "discussion",
              "featured",
              "members",
              "events",
              "photos",
              "videos",
              "about"
            ].map((tab) => (

              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md font-semibold capitalize ${activeTab === tab
                  ? "bg-[#E7F3FF] text-[#1877F2]"
                  : "text-[#65676B] hover:bg-[#F0F2F5]"
                  }`}
              >

                {tab === "discussion" && "Thảo luận"}
                {tab === "featured" && "Nổi bật"}
                {tab === "members" && "Thành viên"}
                {tab === "events" && "Sự kiện"}
                {tab === "photos" && "Ảnh"}
                {tab === "videos" && "Video"}
                {tab === "about" && "Giới thiệu"}

              </button>

            ))}

          </div>

        </div>

        {/* Content */}

        <GroupContent
          activeTab={activeTab}
          group={group}
        />
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