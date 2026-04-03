import { useMemo, useState } from 'react';
import { Search as SearchIcon, Plus, Home, Car, Building, Shirt, Smartphone, Sofa, Gamepad2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LaptopIcon, BikeIcon, CameraIcon, SofaIcon, PhoneIcon, GuitarIcon, WatchIcon, GamepadIcon } from '../../common/icons/IconComponents';
import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../../i18n';

export default function Marketplace() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', icon: Home, label: t('marketplace.categories.all') },
    { id: 'vehicles', icon: Car, label: t('marketplace.categories.vehicles') },
    { id: 'property', icon: Building, label: t('marketplace.categories.property') },
    { id: 'clothing', icon: Shirt, label: t('marketplace.categories.clothing') },
    { id: 'electronics', icon: Smartphone, label: t('marketplace.categories.electronics') },
    { id: 'home', icon: Sofa, label: t('marketplace.categories.home') },
    { id: 'hobbies', icon: Gamepad2, label: t('marketplace.categories.hobbies') },
  ];

  const products = [
    { id: 1, titleKey: 'marketplace.products.1.title', price: 11500000, locationKey: 'marketplace.products.1.location', icon: 'laptop', conditionKey: 'marketplace.products.1.condition', category: 'electronics' },
    { id: 2, titleKey: 'marketplace.products.2.title', price: 4200000, locationKey: 'marketplace.products.2.location', icon: 'bike', conditionKey: 'marketplace.products.2.condition', category: 'vehicles' },
    { id: 3, titleKey: 'marketplace.products.3.title', price: 7900000, locationKey: 'marketplace.products.3.location', icon: 'camera', conditionKey: 'marketplace.products.3.condition', category: 'electronics' },
    { id: 4, titleKey: 'marketplace.products.4.title', price: 5100000, locationKey: 'marketplace.products.4.location', icon: 'sofa', conditionKey: 'marketplace.products.4.condition', category: 'home' },
    { id: 5, titleKey: 'marketplace.products.5.title', price: 16900000, locationKey: 'marketplace.products.5.location', icon: 'phone', conditionKey: 'marketplace.products.5.condition', category: 'electronics' },
    { id: 6, titleKey: 'marketplace.products.6.title', price: 3600000, locationKey: 'marketplace.products.6.location', icon: 'guitar', conditionKey: 'marketplace.products.6.condition', category: 'hobbies' },
    { id: 7, titleKey: 'marketplace.products.7.title', price: 2800000, locationKey: 'marketplace.products.7.location', icon: 'watch', conditionKey: 'marketplace.products.7.condition', category: 'electronics' },
    { id: 8, titleKey: 'marketplace.products.8.title', price: 9200000, locationKey: 'marketplace.products.8.location', icon: 'gamepad', conditionKey: 'marketplace.products.8.condition', category: 'hobbies' },
  ];

  const activeCategoryLabel = categories.find((c) => c.id === activeCategory)?.label || t('marketplace.categories.all');

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchSearch =
        !query ||
        t(product.titleKey).toLowerCase().includes(query) ||
        t(product.locationKey).toLowerCase().includes(query);

      return matchCategory && matchSearch;
    });
  }, [activeCategory, products, searchQuery]);

  const getProductIcon = (iconType: string) => {
    switch (iconType) {
      case 'laptop': return <LaptopIcon className="w-16 h-16 text-gray-600" />;
      case 'bike': return <BikeIcon className="w-16 h-16 text-gray-600" />;
      case 'camera': return <CameraIcon className="w-16 h-16 text-gray-600" />;
      case 'sofa': return <SofaIcon className="w-16 h-16 text-gray-600" />;
      case 'phone': return <PhoneIcon className="w-16 h-16 text-gray-600" />;
      case 'guitar': return <GuitarIcon className="w-16 h-16 text-gray-600" />;
      case 'watch': return <WatchIcon className="w-16 h-16 text-gray-600" />;
      case 'gamepad': return <GamepadIcon className="w-16 h-16 text-gray-600" />;
      default: return null;
    }
  };

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
        <button className="w-full h-11 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          <span>{t('marketplace.createListing')}</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('marketplace.todayPicks')}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('marketplace.productSummary', { count: filteredProducts.length, category: activeCategoryLabel })}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/marketplace/product/${product.id}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {getProductIcon(product.icon)}
              </div>
              <div className="p-4">
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {product.price.toLocaleString(getLocaleTag())} {t('marketplace.currencySuffix')}
                </p>
                <p className="font-semibold text-gray-900 mb-1 line-clamp-1">{t(product.titleKey)}</p>
                <p className="text-sm text-gray-500 mb-2">{t(product.locationKey)}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {t(product.conditionKey)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-gray-900">{t('marketplace.emptyTitle')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('marketplace.emptySubtitle')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
