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
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#050505] mb-6">Friend Requests</h1>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-[#65676B] text-lg">No pending friend requests</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-[#E4E6EB] flex items-center justify-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-xl"
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
                    className="w-full h-10 bg-[#1877F2] text-white font-semibold rounded-md hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm</span>
                  </button>
                  <button
                    onClick={() => handleDelete(request.id)}
                    className="w-full h-10 bg-[#E4E6EB] text-[#050505] font-semibold rounded-md hover:bg-[#D8DADF] transition-colors flex items-center justify-center gap-2"
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
