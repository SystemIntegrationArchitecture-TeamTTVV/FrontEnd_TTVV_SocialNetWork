import { Check, X } from 'lucide-react';
import { useState } from 'react';

export default function FriendRequests() {
  const [requests] = useState([
    { id: 1, name: 'Sarah Mitchell', avatar: 'SM', color: '#42B72A', mutual: 12 },
    { id: 2, name: 'Michael Chen', avatar: 'MC', color: '#FF6B6B', mutual: 8 },
    { id: 3, name: 'Emma Rodriguez', avatar: 'ER', color: '#4ECDC4', mutual: 25 },
    { id: 4, name: 'Alex Thompson', avatar: 'AT', color: '#FFD93D', mutual: 5 },
    { id: 5, name: 'Lisa Anderson', avatar: 'LA', color: '#A8E6CF', mutual: 3 },
    { id: 6, name: 'David Park', avatar: 'DP', color: '#FFB6B9', mutual: 15 },
  ]);

  const handleConfirm = (id: number) => {
    console.log('Confirm friend request:', id);
  };

  const handleDelete = (id: number) => {
    console.log('Delete friend request:', id);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa] mb-8">Lời mời kết bạn</h1>


      {requests.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1d28] rounded-[32px] p-16 text-center border border-gray-100/50 dark:border-white/5 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Không có lời mời kết bạn nào</p>
        </div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-[#1a1d28] rounded-[32px] overflow-hidden border border-gray-100/50 dark:border-white/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >

              <div className="aspect-video bg-gray-100 dark:bg-[#1e212b] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl transform group-hover:scale-110 transition-transform duration-500 z-10"
                  style={{ backgroundColor: request.color }}
                >
                  {request.avatar}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-base font-semibold text-[#050505] mb-1">{request.name}</h3>
                <p className="text-sm text-[#65676B] mb-4">{request.mutual} mutual friends</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleConfirm(request.id)}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >

                    <Check className="w-4 h-4" />
                    <span>Confirm</span>
                  </button>
                  <button
                    onClick={() => handleDelete(request.id)}
                    className="w-full h-11 bg-gray-100 dark:bg-[#22263a] text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-[#2b2f45] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >

                    <X className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
