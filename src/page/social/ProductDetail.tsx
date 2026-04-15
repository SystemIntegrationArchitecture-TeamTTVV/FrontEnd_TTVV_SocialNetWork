import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, MessageCircle, Loader, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { productApi,type ProductDTO } from '../../apis/products';
import { getLocaleTag } from '../../i18n';

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (!id) {
      setError(t('productDetail.notFound'));
      setLoading(false);
      return;
    }
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const product = await productApi.getProductById(id!);
      if (product) {
        setProduct(product);
        setError('');
      } else {
        setError(t('productDetail.notFound'));
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError(t('productDetail.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!user?.id) {
      alert(t('productDetail.loginRequired'));
      navigate('/auth/login');
      return;
    }

    if (product?.seller?.id === user.id) {
      alert(t('productDetail.ownProduct'));
      return;
    }

    // Navigate to messenger with seller
    navigate(`/messenger?userId=${product?.seller?.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="text-base font-semibold text-red-900">{error || t('productDetail.notFound')}</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('productDetail.backToMarketplace')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
              {product.images && product.images.length > 0 && product.images[imageIndex] ? (
                <img
                  src={product.images[imageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-9xl">📦</span>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setImageIndex(index)}
                    className={`aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer transition-all ${
                      imageIndex === index ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img_el = e.target as HTMLImageElement;
                        img_el.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div>
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm mb-4">
                {product.category}
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">{product.title}</h2>
            </div>

            {/* Price */}
            <div className="py-4 border-t border-b border-gray-200">
              <p className="text-4xl font-bold text-blue-600 mb-2">
                {product.price.toLocaleString(getLocaleTag())} {product.currency || 'VND'}
              </p>
            </div>

            {/* Condition */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">{t('productDetail.condition')}</p>
              <p className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                {product.condition}
              </p>
            </div>

            {/* Location */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{t('productDetail.location')}</p>
              <p className="flex items-start gap-2 text-gray-900">
                <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{product.location}</p>
                  {product.address && <p className="text-sm text-gray-600">{product.address}</p>}
                </div>
              </p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">{t('productDetail.tags')}</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('productDetail.description')}</h3>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleContactSeller}
                className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {t('productDetail.contactSeller')}
              </button>
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                  isLiked
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={t('productDetail.toggleLike')}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Sold Status */}
            {product.isSold && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-center text-red-700 font-semibold">{t('productDetail.soldOut')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Seller Info Card */}
        {product.seller && (
          <div className="mt-12 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('productDetail.sellerInfo')}</h3>
            <div className="flex items-start gap-4">
              {product.seller?.avatar ? (
                <img
                  src={product.seller.avatar}
                  alt={product.seller.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center text-white font-bold text-xl">
                  {product.seller.fullName?.charAt(0) || 'S'}
                </div>
              )}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{product.seller.fullName}</h4>
                {product.seller?.id === user?.id && (
                  <p className="text-sm text-blue-600 font-semibold mt-1">{t('productDetail.yourProduct')}</p>
                )}
              </div>
              {product.seller?.id !== user?.id && (
                <button
                  onClick={handleContactSeller}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('productDetail.message')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
