import { useState } from 'react';
import { ArrowLeft, Upload, Image as ImageIcon, X, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateAlbum() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'friends',
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = () => {
    // Simulate image selection
    const newImages = [...selectedImages, '🖼️', '📷', '🖼️'];
    setSelectedImages(newImages.slice(0, 9)); // Max 9 images
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Create album:', { ...formData, images: selectedImages });
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
          <h1 className="text-3xl font-bold text-gray-900">Tạo album mới</h1>
          <p className="text-base text-gray-600 mt-1">Tạo album để tổ chức ảnh của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin album</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Tên album *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nhập tên album..."
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Mô tả về album này..."
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">Quyền riêng tư</label>
              <select
                name="privacy"
                value={formData.privacy}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-all"
              >
                <option value="public">Công khai</option>
                <option value="friends">Bạn bè</option>
                <option value="onlyMe">Chỉ mình tôi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ảnh trong album</h2>
              <p className="text-base text-gray-600 mt-1">{selectedImages.length} ảnh đã chọn</p>
            </div>
            <button
              type="button"
              onClick={handleImageSelect}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-xl transition-colors flex items-center gap-2 shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Thêm ảnh
            </button>
          </div>

          {selectedImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {img}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedImages.length < 9 && (
                <button
                  type="button"
                  onClick={handleImageSelect}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center transition-colors"
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-gray-600">Thêm ảnh</span>
                </button>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có ảnh nào</h3>
              <p className="text-base text-gray-600 mb-6">Thêm ảnh để tạo album</p>
              <button
                type="button"
                onClick={handleImageSelect}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Chọn ảnh
              </button>
            </div>
          )}
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
            disabled={!formData.name || selectedImages.length === 0}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg flex items-center gap-2 ${
              !formData.name || selectedImages.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save className="w-5 h-5" />
            Tạo album
          </button>
        </div>
      </form>
    </div>
  );
}
