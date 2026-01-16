import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Share2, Bell, Edit } from 'lucide-react';
import { useState } from 'react';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isGoing, setIsGoing] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  // Mock event data
  const event = {
    id: id,
    title: 'Hội thảo Công nghệ Thông tin 2024',
    description:
      'Hội thảo về các xu hướng công nghệ mới nhất, với sự tham gia của các chuyên gia hàng đầu trong ngành. Sự kiện bao gồm các bài thuyết trình, workshop và networking session.',
    date: '25 Tháng 12, 2024',
    time: '09:00 - 17:00',
    location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    address: 'Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội',
    organizer: { name: 'Nguyễn Văn A', avatar: 'NA', color: '#1877F2' },
    attendees: 1250,
    interested: 3420,
    coverImage: '🎉',
    category: 'Công nghệ',
  };

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chi tiết sự kiện</h1>
      </div>

      {/* Cover Image */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl h-64 mb-6 flex items-center justify-center text-8xl shadow-lg">
        {event.coverImage}
      </div>

      {/* Event Info Card */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm mb-4">
              {event.category}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h2>
            <div className="flex items-center gap-6 text-base text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{event.attendees.toLocaleString()} người tham gia</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <span className="font-semibold">{event.interested.toLocaleString()} quan tâm</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Share2 className="w-6 h-6 text-gray-700" />
            </button>
            <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Edit className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-lg text-gray-700 leading-relaxed mb-8">{event.description}</p>

        {/* Event Details */}
        <div className="space-y-4 border-t border-gray-100 pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900 mb-1">Ngày và giờ</p>
              <p className="text-base text-gray-600">{event.date}</p>
              <p className="text-base text-gray-600">{event.time}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900 mb-1">Địa điểm</p>
              <p className="text-base text-gray-600">{event.location}</p>
              <p className="text-base text-gray-500">{event.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900 mb-1">Người tổ chức</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: event.organizer.color }}
                >
                  {event.organizer.avatar}
                </div>
                <span className="text-base font-semibold text-gray-900">{event.organizer.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              setIsGoing(!isGoing);
              if (!isGoing) setIsInterested(false);
            }}
            className={`flex-1 h-14 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
              isGoing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            {isGoing ? 'Đang tham gia' : 'Tham gia'}
          </button>
          <button
            onClick={() => {
              setIsInterested(!isInterested);
              if (!isInterested) setIsGoing(false);
            }}
            className={`flex-1 h-14 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
              isInterested
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Bell className="w-5 h-5" />
            {isInterested ? 'Đã quan tâm' : 'Quan tâm'}
          </button>
        </div>
      </div>
    </div>
  );
}
