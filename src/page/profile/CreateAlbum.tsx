import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Image as ImageIcon, X, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateAlbum() {
  const { t } = useTranslation();
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("profilePage.albumCreate.title")}
        </h1>
        <p className="text-base text-gray-600 mt-1">
          {t("profilePage.albumCreate.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-[28px] shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t("profilePage.albumCreate.sectionInfo")}
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.albumCreate.nameLabel")}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t("profilePage.albumCreate.namePlaceholder")}
                className="w-full h-14 px-5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-base transition-all"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.albumCreate.descriptionLabel")}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder={t("profilePage.albumCreate.descriptionPlaceholder")}
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-base transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                {t("profilePage.albumCreate.privacyLabel")}
              </label>
              <select
                name="privacy"
                value={formData.privacy}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-base transition-all"
              >
                <option value="public">
                  {t("profilePage.albumCreate.privacyPublic")}
                </option>
                <option value="friends">
                  {t("profilePage.albumCreate.privacyFriends")}
                </option>
                <option value="onlyMe">
                  {t("profilePage.albumCreate.privacyOnlyMe")}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-[28px] shadow-sm p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('profilePage.albumCreate.photosSection')}</h2>
              <p className="text-base text-gray-600 mt-1">{t('profilePage.albumCreate.photosSelected', { count: selectedImages.length })}</p>
            </div>
            <button
              type="button"
              onClick={handleImageSelect}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-2xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-5 h-5" />
              {t('profilePage.albumCreate.addPhotos')}
            </button>
          </div>

          {selectedImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden group border border-gray-100">
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {img}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedImages.length < 9 && (
                <button
                  type="button"
                  onClick={handleImageSelect}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50/70 flex flex-col items-center justify-center transition-colors"
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-gray-600">
                    {t("profilePage.albumCreate.addPhotosGrid")}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-[28px] p-12 text-center bg-white/70">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t("profilePage.albumCreate.emptyTitle")}
              </h3>
              <p className="text-base text-gray-600 mb-6">
                {t("profilePage.albumCreate.emptyHint")}
              </p>
              <button
                type="button"
                onClick={handleImageSelect}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-2xl transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Upload className="w-5 h-5" />
                {t("profilePage.albumCreate.choosePhotos")}
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            to="/profile/1"
            className="px-8 py-4 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-lg transition-colors shadow-sm"
          >
            {t("profilePage.albumCreate.cancel")}
          </Link>
          <button
            type="submit"
            disabled={!formData.name || selectedImages.length === 0}
            className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-colors shadow-sm flex items-center gap-2 ${
              !formData.name || selectedImages.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save className="w-5 h-5" />
            {t("profilePage.albumCreate.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
