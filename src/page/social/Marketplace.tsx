import { useMemo, useState } from 'react';
import { Search as SearchIcon, Plus, Home, Car, Building, Shirt, Smartphone, Sofa, Gamepad2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LaptopIcon, BikeIcon, CameraIcon, SofaIcon, PhoneIcon, GuitarIcon, WatchIcon, GamepadIcon } from '../../common/icons/IconComponents';

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', icon: Home, label: 'Tất cả' },
    { id: 'vehicles', icon: Car, label: 'Xe cộ' },
    { id: 'property', icon: Building, label: 'Nhà cho thuê' },
    { id: 'clothing', icon: Shirt, label: 'Thời trang & phụ kiện' },
    { id: 'electronics', icon: Smartphone, label: 'Điện tử' },
    { id: 'home', icon: Sofa, label: 'Nhà cửa & đời sống' },
    { id: 'hobbies', icon: Gamepad2, label: 'Sở thích' },
  ];

  const products = [
    { id: 1, title: 'MacBook Pro 2020', price: 11500000, location: 'Quận 1, TP.HCM', icon: 'laptop', condition: 'Tình trạng rất tốt', category: 'electronics' },
    { id: 2, title: 'Xe đạp địa hình', price: 4200000, location: 'Thủ Đức, TP.HCM', icon: 'bike', condition: 'Như mới', category: 'vehicles' },
    { id: 3, title: 'Canon DSLR', price: 7900000, location: 'Hải Châu, Đà Nẵng', icon: 'camera', condition: 'Hoạt động ổn định', category: 'electronics' },
    { id: 4, title: 'Ghế sofa 2 chỗ', price: 5100000, location: 'Cầu Giấy, Hà Nội', icon: 'sofa', condition: 'Tự vận chuyển', category: 'home' },
    { id: 5, title: 'iPhone 14 Pro', price: 16900000, location: 'Ninh Kiều, Cần Thơ', icon: 'phone', condition: 'Máy quốc tế', category: 'electronics' },
    { id: 6, title: 'Guitar acoustic', price: 3600000, location: 'Biên Hòa, Đồng Nai', icon: 'guitar', condition: 'Tặng kèm bao đàn', category: 'hobbies' },
    { id: 7, title: 'Đồng hồ thông minh', price: 2800000, location: 'Long Biên, Hà Nội', icon: 'watch', condition: 'Có GPS', category: 'electronics' },
    { id: 8, title: 'Máy chơi game', price: 9200000, location: 'Bình Thạnh, TP.HCM', icon: 'gamepad', condition: 'Kèm 2 tay cầm', category: 'hobbies' },
  ];

  const activeCategoryLabel = categories.find((c) => c.id === activeCategory)?.label || 'Tất cả';

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchSearch =
        !query ||
        product.title.toLowerCase().includes(query) ||
        product.location.toLowerCase().includes(query);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Chợ</h1>
        <p className="text-sm text-gray-500 mb-4">Khám phá sản phẩm phù hợp với bạn</p>

        {/* Search */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trên chợ"
            className="w-full h-11 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Danh mục</p>
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
          <span>Tạo tin đăng mới</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gợi ý hôm nay</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredProducts.length} sản phẩm • {activeCategoryLabel}
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
              Xóa bộ lọc
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
                <p className="text-xl font-bold text-gray-900 mb-1">{product.price.toLocaleString('vi-VN')} đ</p>
                <p className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.title}</p>
                <p className="text-sm text-gray-500 mb-2">{product.location}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {product.condition}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-gray-900">Không tìm thấy sản phẩm phù hợp</p>
            <p className="text-sm text-gray-500 mt-1">Thử từ khóa khác hoặc chọn lại danh mục.</p>
          </div>
        )}
      </main>
    </div>
  );
}
