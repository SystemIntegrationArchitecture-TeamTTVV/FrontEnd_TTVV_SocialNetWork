import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Trash2, Edit, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AlbumView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const album = useMemo(
    () => ({
      id,
      name: t("profilePage.albumView.demoName"),
      description: t("profilePage.albumView.demoDescription"),
      createdDate: "15/01/2024",
      photoCount: 24,
      privacy: "friends" as const,
      photos: Array.from({ length: 24 }, (_, i) => ({
        id: i + 1,
        thumbnail: "🖼️",
        url: `photo-${i + 1}.jpg`,
        date: t("profilePage.albumView.daysAgo", { count: i + 1 }),
      })),
    }),
    [id, t],
  );

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{album.name}</h1>
          <p className="text-base text-gray-600 mt-1">
            {t("profilePage.albumView.photoMeta", {
              count: album.photoCount,
              date: album.createdDate,
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Share2 className="w-6 h-6 text-gray-700" />
          </button>
          <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Edit className="w-6 h-6 text-gray-700" />
          </button>
          <button className="w-12 h-12 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors">
            <Trash2 className="w-6 h-6 text-red-600" />
          </button>
        </div>
      </div>

      {/* Description */}
      {album.description && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-base text-gray-700 leading-relaxed">{album.description}</p>
        </div>
      )}

      {/* Photos Grid */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.photos.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group relative"
              onClick={() => setSelectedImage(photo.id)}
            >
              <div className="w-full h-full flex items-center justify-center text-6xl">
                {photo.thumbnail}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Download:', photo.id);
                    }}
                    className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                    title={t("profilePage.albumView.downloadTitle")}
                  >
                    <Download className="w-5 h-5 text-gray-900" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Share:', photo.id);
                    }}
                    className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                    title={t("profilePage.albumView.shareTitle")}
                  >
                    <Share2 className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Link
            to="/album/create"
            className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center transition-colors"
          >
            <Plus className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm font-semibold text-gray-600">
              {t("profilePage.albumView.addPhotos")}
            </span>
          </Link>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-5xl w-full">
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <span className="text-9xl">🖼️</span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {album.photos.find((p) => p.id === selectedImage)?.url}
                    </h3>
                    <p className="text-base text-gray-600">
                      {album.photos.find((p) => p.id === selectedImage)?.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <Download className="w-6 h-6 text-gray-700" />
                    </button>
                    <button className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <Share2 className="w-6 h-6 text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
