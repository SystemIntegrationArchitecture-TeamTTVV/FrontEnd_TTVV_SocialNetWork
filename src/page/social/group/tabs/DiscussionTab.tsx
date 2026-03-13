import { Image as ImageIcon, Smile } from "lucide-react";

export default function DiscussionTab() {

  return (

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* Main */}

      <div className="lg:col-span-2 space-y-4">

        <div className="bg-white rounded-lg shadow-sm p-4">

          <div className="flex items-center gap-3 mb-3">

            <div className="w-10 h-10 rounded-full bg-[#42B72A] flex items-center justify-center text-white font-semibold">
              JD
            </div>

            <input
              placeholder="Bạn viết gì đi..."
              className="flex-1 h-10 px-4 rounded-full bg-[#F0F2F5]"
            />

          </div>

          <div className="flex justify-around pt-3 border-t">

            <button className="flex gap-2 text-sm">
              <ImageIcon className="w-5 h-5 text-[#42B72A]" />
              Ảnh/Video
            </button>

            <button className="flex gap-2 text-sm">
              <Smile className="w-5 h-5 text-[#F7B928]" />
              Cảm xúc
            </button>

          </div>

        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
          No posts yet. Be the first to post!
        </div>

      </div>

      {/* Sidebar */}

      <div className="space-y-4">

        <div className="bg-white rounded-lg shadow-sm p-4">

          <h3 className="font-bold mb-4">
            Giới thiệu
          </h3>

          <p className="text-sm text-gray-600">
            Cộng đồng chia sẻ đam mê và kết nối thành viên.
          </p>

        </div>

      </div>

    </div>

  );

}