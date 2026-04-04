import { useParams } from 'react-router-dom';
import { Heart, Share2, ShoppingCart, MapPin, Star, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../../i18n';

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Mock product data
  const product = {
    id: id,
    name: 'iPhone 15 Pro Max 256GB',
    price: 28990000,
    originalPrice: 32990000,
    images: ['📱', '📱', '📱'],
    description:
      'iPhone 15 Pro Max với chip A17 Pro mạnh mẽ, camera 48MP chuyên nghiệp, màn hình Super Retina XDR 6.7 inch. Bộ nhớ 256GB, pin siêu bền, sạc nhanh. Thiết kế titan cao cấp, chống nước IP68.',
    seller: {
      name: 'Tech Store',
      avatar: 'TS',
      color: '#1877F2',
      rating: 4.8,
      reviews: 1250,
      location: 'Hà Nội, Việt Nam',
      verified: true,
    },
    rating: 4.7,
    reviews: 342,
    stock: 15,
    category: 'Điện thoại & Phụ kiện',
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('marketplace.productDetailTitle')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-9xl shadow-lg">
            {product.images[0]}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {product.images.map((img, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-4xl cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                {img}
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title and Actions */}
          <div>
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm mb-4">
              {product.category}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-gray-900">{product.rating}</span>
                <span className="text-gray-600">({t('marketplace.reviewsCount', { count: product.reviews })})</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-blue-600">
                {product.price.toLocaleString(getLocaleTag())} ₫
              </span>
              <span className="text-2xl text-gray-400 line-through">
                {product.originalPrice.toLocaleString(getLocaleTag())} ₫
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-semibold">
                -12%
              </span>
            </div>
          </div>

          {/* Stock */}
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-base font-semibold text-green-700">
              {t('marketplace.stockRemaining', { count: product.stock })}
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">{t('marketplace.quantity')}</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-semibold text-lg transition-colors"
              >
                -
              </button>
              <span className="w-20 text-center font-bold text-xl text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-semibold text-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {t('marketplace.addToCart')}
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                isLiked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Share2 className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Seller Info */}
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: product.seller.color }}
              >
                {product.seller.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-xl text-gray-900">{product.seller.name}</p>
                  {product.seller.verified && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-semibold">
                      ✓ {t('marketplace.verifiedSeller')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{product.seller.rating}</span>
                    <span>({t('marketplace.sellerReviews', { count: product.seller.reviews })})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {product.seller.location}
                  </div>
                </div>
              </div>
            </div>
            <button type="button" className="w-full h-12 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl font-semibold text-gray-900 transition-colors">
              {t('marketplace.viewStore')}
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('marketplace.descriptionHeading')}</h3>
        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
          {product.description}
        </p>
      </div>

      {/* Reviews */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{t('marketplace.reviewsHeading', { count: product.reviews })}</h3>
          <button type="button" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t('marketplace.writeReview')}
          </button>
        </div>
        <div className="text-center py-12 text-gray-600">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">{t('marketplace.noReviewsYet')}</p>
        </div>
      </div>
    </div>
  );
}
