import type { GroupData } from "../../../../apis/groupsApi";

interface Props {
  group: GroupData;
}

export default function AboutTab({ group }: Props) {

  return (

    <div className="bg-white rounded-lg shadow-sm p-6">

      <h2 className="text-xl font-bold mb-4">
        Giới thiệu
      </h2>

      <p className="text-gray-600">
        {group.description || "Chưa có mô tả"}
      </p>

      <div className="mt-4 text-sm text-gray-500 space-y-1">
        <p>🌍 Nhóm công khai</p>
        <p>📍 Việt Nam</p>
      </div>

    </div>

  );

}