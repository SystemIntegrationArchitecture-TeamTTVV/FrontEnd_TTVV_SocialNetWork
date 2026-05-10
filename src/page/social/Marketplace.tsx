import { useState, useEffect } from 'react';
import { Search as SearchIcon, Plus, Home, Car, Building, Shirt, Smartphone, Sofa, Gamepad2, Star, Loader, Package } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#0c0e14] flex">
      {/* Left Sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 xl:w-60 bg-white dark:bg-[#13151f] border-r border-gray-200 dark:border-[#22263a] p-3.5 shrink-0 shadow-sm">
        <div className="mb-4">
          <h1 className="text-[16px] font-bold text-gray-900 dark:text-[#edf0fa] tracking-tight">{t('marketplace.title')}</h1>
          <p className="text-[11px] text-gray-400 dark:text-[#5a6278] mt-0.5">{t('marketplace.subtitle')}</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('marketplace.searchPlaceholder')}
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-gray-100 dark:bg-[#1e2133] border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none text-[12.5px] text-gray-800 dark:text-[#edf0fa] placeholder-gray-400 transition-all"
          />
        </div>

        {/* Categories */}
        <div className="mb-4 flex-1">
          <p className="text-[10px] font-bold text-gray-400 dark:text-[#4a5270] uppercase tracking-widest mb-2 px-1">{t('marketplace.categoryTitle')}</p>
          <div className="space-y-0.5">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-[#c8ccde] hover:bg-gray-50 dark:hover:bg-[#1e2133]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-[#22263a] text-gray-500 dark:text-[#9aa3bc]'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[12.5px] font-semibold">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Listing */}
        <Link
          to="/marketplace/my-products"
          className="mt-auto w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-[0_1px_4px_rgba(37,99,235,0.3)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('marketplace.createListing')}</span>
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-5 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-[#edf0fa] tracking-tight">{t('marketplace.todayPicks')}</h2>
            <p className="text-[11.5px] text-gray-400 dark:text-[#6a7494] mt-0.5">
              {t('marketplace.productSummary', { count: products.length, category: activeCategoryLabel })}
            </p>
          </div>

          {(searchQuery.trim() || activeCategory !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="h-7 px-3 rounded-full bg-gray-100 dark:bg-[#22263a] text-[11.5px] font-semibold text-gray-600 dark:text-[#9aa3bc] hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
            >
              {t('marketplace.clearFilters')}
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 p-10 text-center">
            <p className="text-[12.5px] font-semibold text-red-700 dark:text-red-400">{error}</p>
            <button onClick={() => loadProducts()} className="mt-4 px-4 py-2 bg-red-600 text-white text-[12.5px] rounded-xl hover:bg-red-700 transition-colors">
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product, i) => (
              <Link
                key={product.id}
                to={`/marketplace/product/${product.id}`}
                className="group bg-white dark:bg-[#1a1d28] rounded-2xl border border-gray-100 dark:border-[#252840] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:-translate-y-[3px] transition-all duration-200 overflow-hidden flex flex-col"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 dark:bg-[#22263a] overflow-hidden rounded-t-2xl">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-300 dark:text-[#3a3f5c]" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 flex flex-col gap-0.5">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-[#edf0fa] leading-tight">
                    {product.price.toLocaleString(getLocaleTag())}&nbsp;<span className="text-[10px] font-semibold text-gray-400">{product.currency || 'VND'}</span>
                  </p>
                  <p className="text-[11.5px] font-medium text-gray-700 dark:text-[#b8becf] line-clamp-2 leading-snug">{product.title}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#6a7494]">{product.location}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-[10.5px] text-gray-500 dark:text-[#7e89a6]">{product.condition}</span>
                  </div>
                  {product.seller && (
                    <p className="text-[10.5px] text-gray-400 dark:text-[#5a6278] truncate mt-0.5">
                      {t('marketplace.seller')}: <span className="font-medium">{product.seller.fullName}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-100 dark:border-[#252840] bg-white dark:bg-[#1a1d28] p-14 text-center">
            <Package className="w-10 h-10 text-gray-300 dark:text-[#3a3f5c] mx-auto mb-3" />
            <p className="text-[12.5px] font-semibold text-gray-700 dark:text-[#c8ccde]">{t('marketplace.emptyTitle')}</p>
            <p className="text-[11.5px] text-gray-400 dark:text-[#6a7494] mt-1">{t('marketplace.emptySubtitle')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
