import { useEffect, useState } from "react";
import { groupsApi } from "../../../apis/groupsApi";
import { useToast } from "../../../contexts/useToast";

interface Friend {
  id: string;
  fullName: string;
  avatar: string;
}

interface Props {
  groupId: string;
  userId: string;
  onClose: () => void;
  onInvited?: () => void;
}

export default function InviteFriendsModal({
  groupId,
  userId,
  onClose,
  onInvited
}: Props) {

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingIds, setInvitingIds] = useState<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => {

    const loadFriends = async () => {

      try {

        const data = await groupsApi.getInvitableFriends(groupId, userId);
        setFriends(Array.isArray(data) ? data : []);

      } catch (e) {

        console.error("Load friends failed", e);

      } finally {

        setLoading(false);

      }

    };

    loadFriends();

  }, [groupId, userId]);

  const invite = async (friendId: string) => {

    if (invitingIds.includes(friendId)) return;

    try {

      setInvitingIds(prev => [...prev, friendId]);

      await groupsApi.addMembers(groupId, [friendId]);

      setFriends(prev => prev.filter(f => f.id !== friendId));
      onInvited?.();
      showToast("Đã mời thành công", "success");

    } catch (e) {

      console.error("Invite failed", e);
      showToast("Mời thất bại, vui lòng thử lại", "error");

    } finally {

      setInvitingIds(prev => prev.filter(id => id !== friendId));

    }

  };

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-105 rounded-lg shadow-lg p-6">

        <h2 className="text-xl font-bold mb-4">
          Mời bạn bè vào nhóm
        </h2>

        {loading ? (

          <p>Đang tải...</p>

        ) : friends.length === 0 ? (

          <p className="text-gray-500">
            Không còn bạn bè nào để mời
          </p>

        ) : (

          <div className="space-y-3 max-h-100 overflow-y-auto">

            {friends.map(friend => (

              <div
                key={friend.id}
                className="flex items-center justify-between"
              >

                <div className="flex items-center gap-3">

                  <img
                    src={friend.avatar}
                    className="w-8 h-8 rounded-full"
                  />

                  <span>{friend.fullName}</span>

                </div>

                <button
                  onClick={() => invite(friend.id)}
                  disabled={invitingIds.includes(friend.id)}
                  className="px-3 py-1 bg-[#1877F2] text-white rounded-md text-sm"
                >
                  {invitingIds.includes(friend.id) ? "Đang mời..." : "Mời"}
                </button>

              </div>

            ))}

          </div>

        )}

        <div className="mt-4 text-right">

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            Đóng
          </button>

        </div>

      </div>

    </div>

  );

}