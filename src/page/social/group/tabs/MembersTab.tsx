import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { groupsApi } from "../../../../apis/groupsApi";

interface Props {
  groupId: string;
  adminId: string;
}

interface Member {
  id: string;
  fullName: string;
  avatar?: string;
}

export default function MembersTab({ groupId, adminId }: Props) {

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const loadMembers = async () => {
    try {

      const data = await groupsApi.getGroupMembers(groupId);

      console.log("Members API response:", data);

      setMembers(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error("Load members failed:", err);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        Đang tải danh sách thành viên...
      </div>
    );
  }

  /* ------------ Filter search ------------ */

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  /* ------------ Admin first ------------ */

  const admin = filteredMembers.find((m) => m.id === adminId);

  const others = filteredMembers
    .filter((m) => m.id !== adminId)
    .slice(0, 5); // chỉ hiển thị 5 người

  const displayMembers = admin ? [admin, ...others] : others;

  return (

    <div className="bg-white rounded-lg shadow-sm p-6">

      {/* Title */}

      <h2 className="text-xl font-bold mb-4">
        Thành viên ({members.length})
      </h2>

      {/* Search */}

      <div className="relative mb-4">

        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Tìm thành viên..."
          className="w-full h-10 pl-9 border rounded-lg"
        />

      </div>

      {/* Member list */}

      <div className="space-y-3">

        {displayMembers.map((member) => {

          const isAdmin = member.id === adminId;

          return (

            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
            >

              <div className="flex items-center gap-3">

                <img
                  src={
                    member.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}`
                  }
                  alt={member.fullName}
                  className="w-10 h-10 rounded-full"
                />

                <div>

                  <p className="font-medium">
                    {member.fullName}
                  </p>

                  {isAdmin && (
                    <p className="text-xs text-blue-600 font-medium">
                      Trưởng nhóm
                    </p>
                  )}

                </div>

              </div>

              {isAdmin && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                  Admin
                </span>
              )}

            </div>

          );

        })}

      </div>

    </div>

  );

}