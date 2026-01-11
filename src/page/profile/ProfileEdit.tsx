import { useState } from 'react';
import { ArrowLeft, Camera, Save, Globe, Lock, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: 'Nguyễn Văn',
    lastName: 'A',
    bio: 'Yêu thích công nghệ và du lịch',
    work: 'Software Developer',
    education: 'Đại học Bách Khoa',
    location: 'Hà Nội, Việt Nam',
    phone: '+84 123 456 789',
    email: 'nguyenvana@example.com',
    birthday: '1990-01-15',
    privacy: 'public',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Save profile:', formData);
    navigate('/profile/1');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/profile/1"
          className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa trang cá nhân</h1>
          <p className="text-base text-gray-600 mt-1">Cập nhật thông tin cá nhân của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Photo */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-64 bg-gradient-to-r from-blue-500 to-blue-600 relative">
            <button className="absolute bottom-4 right-4 px-5 py-3 bg-white/90 hover:bg-white rounded-xl font-semibold text-gray-900 flex items-center gap-2 transition-colors shadow-lg">
              <Camera className="w-5 h-5" />
              Thay đổi ảnh bìa
            </button>
          </div>
          <div className="p-6 -mt-16">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-xl border-4 border-white">
                NA
              </div>
              <button className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin cơ bản</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">Họ</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">Tên</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Giới thiệu</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all resize-none"
                placeholder="Viết vài dòng về bản thân..."
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Ngày sinh</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Work & Education */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Công việc & Học vấn</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Nơi làm việc</label>
              <input
                type="text"
                name="work"
                value={formData.work}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                placeholder="Công ty, tổ chức..."
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Học vấn</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                placeholder="Trường học, đại học..."
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Địa điểm</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
                placeholder="Thành phố, quốc gia..."
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quyền riêng tư</h2>
          
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">Ai có thể xem trang cá nhân</label>
            <select
              name="privacy"
              value={formData.privacy}
              onChange={handleChange}
              className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
            >
              <option value="public">
                <Globe className="w-5 h-5 inline" /> Công khai
              </option>
              <option value="friends">Bạn bè</option>
              <option value="private">Chỉ mình tôi</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            to="/profile/1"
            className="px-8 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-lg transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors shadow-lg flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
