import { useState, useEffect } from 'react';
import { Search as SearchIcon, Plus, Home, Car, Building, Shirt, Smartphone, Sofa, Gamepad2, Star, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../../i18n';
import { productApi, type ProductDTO } from '../../apis/products';

export default function Marketplace() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = [
    { id: 'all', icon: Home, label: t('marketplace.categories.all') },
    { id: 'vehicles', icon: Car, label: t('marketplace.categories.vehicles') },
    { id: 'property', icon: Building, label: t('marketplace.categories.property') },
    { id: 'clothing', icon: Shirt, label: t('marketplace.categories.clothing') },
    { id: 'electronics', icon: Smartphone, label: t('marketplace.categories.electronics') },
    { id: 'home', icon: Sofa, label: t('marketplace.categories.home') },
    { id: 'hobbies', icon: Gamepad2, label: t('marketplace.categories.hobbies') },
  ];

  // Fetch products on component mount and when filters change
  useEffect(() => {
    loadProducts();
  }, [activeCategory, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productApi.getAllProducts({
        category: activeCategory !== 'all' ? activeCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setProducts(response || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('marketplace.loadError'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const activeCategoryLabel = categories.find((c) => c.id === activeCategory)?.label || t('marketplace.categories.all');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 p-5 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('marketplace.title')}</h1>
        <p className="text-sm text-gray-500 mb-4">{t('marketplace.subtitle')}</p>

        {/* Search */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('marketplace.searchPlaceholder')}
            className="w-full h-11 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('marketplace.categoryTitle')}</p>
          <div className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Listing */}
        <Link
          to="/marketplace/my-products"
          className="w-full h-11 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>{t('marketplace.createListing')}</span>
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('marketplace.todayPicks')}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('marketplace.productSummary', { count: products.length, category: activeCategoryLabel })}
            </p>
          </div>

          {(searchQuery.trim() || activeCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="h-9 px-4 rounded-full bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {t('marketplace.clearFilters')}
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="text-base font-semibold text-red-900">{error}</p>
            <button
              onClick={() => loadProducts()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/marketplace/product/${product.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center text-4xl overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-gray-400">📦</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    {product.price.toLocaleString(getLocaleTag())} {product.currency || 'VND'}
                  </p>
                  <p className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.title}</p>
                  <p className="text-sm text-gray-500 mb-2">{product.location}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {product.condition}
                  </p>
                  {product.seller && (
                    <p className="text-xs text-gray-600 mt-2">
                      {t('marketplace.seller')}: {product.seller.fullName}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-gray-900">{t('marketplace.emptyTitle')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('marketplace.emptySubtitle')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
