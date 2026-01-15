import { useState } from 'react';
import { Search as SearchIcon, Plus, Home, Car, Building, Shirt, Smartphone, Sofa, Gamepad2, ChevronDown, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LaptopIcon, BikeIcon, CameraIcon, SofaIcon, PhoneIcon, GuitarIcon, WatchIcon, GamepadIcon } from '../../common/icons/IconComponents';

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', icon: Home, label: 'Browse all' },
    { id: 'vehicles', icon: Car, label: 'Vehicles' },
    { id: 'property', icon: Building, label: 'Property Rentals' },
    { id: 'clothing', icon: Shirt, label: 'Clothing & Accessories' },
    { id: 'electronics', icon: Smartphone, label: 'Electronics' },
    { id: 'home', icon: Sofa, label: 'Home & Garden' },
    { id: 'hobbies', icon: Gamepad2, label: 'Hobbies' },
  ];

  const products = [
    { id: 1, title: 'MacBook Pro 2020', price: 450, location: 'San Francisco, CA', icon: 'laptop', condition: 'Excellent condition' },
    { id: 2, title: 'Mountain Bike', price: 180, location: 'Oakland, CA', icon: 'bike', condition: 'Like new' },
    { id: 3, title: 'Canon DSLR Camera', price: 320, location: 'Berkeley, CA', icon: 'camera', condition: 'Good condition' },
    { id: 4, title: 'Comfortable Sofa', price: 200, location: 'San Jose, CA', icon: 'sofa', condition: 'Must pick up' },
    { id: 5, title: 'iPhone 14 Pro', price: 650, location: 'Palo Alto, CA', icon: 'phone', condition: 'Unlocked' },
    { id: 6, title: 'Acoustic Guitar', price: 280, location: 'Fremont, CA', icon: 'guitar', condition: 'With case' },
    { id: 7, title: 'Smart Watch', price: 220, location: 'Sunnyvale, CA', icon: 'watch', condition: 'GPS enabled' },
    { id: 8, title: 'Gaming Console', price: 380, location: 'Mountain View, CA', icon: 'gamepad', condition: '2 controllers' },
  ];

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
    <div className="min-h-screen bg-[#F0F2F5] flex">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white shadow-sm p-4 shrink-0">
        <h1 className="text-xl font-bold text-[#050505] mb-4">Marketplace</h1>

        {/* Search */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]" />
          <input
            type="text"
            placeholder="Search"
            className="w-full h-10 pl-10 pr-4 rounded-full bg-[#F0F2F5] border-none focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-[#65676B] uppercase mb-3">BROWSE ALL</p>
          <div className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-[#E7F3FF] text-[#1877F2]'
                      : 'hover:bg-[#F0F2F5] text-[#050505]'
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
        <button className="w-full h-11 bg-[#1877F2] text-white font-semibold rounded-lg hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Create new listing</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#050505]">Today's picks</h2>
          <div className="flex gap-3">
            <button className="h-9 px-4 rounded-full bg-[#E4E6EB] text-sm font-semibold text-[#050505] hover:bg-[#D8DADF] transition-colors flex items-center gap-1">
              <ChevronDown className="w-4 h-4" />
              Location
            </button>
            <button className="h-9 px-4 rounded-full bg-[#E4E6EB] text-sm font-semibold text-[#050505] hover:bg-[#D8DADF] transition-colors flex items-center gap-1">
              <ChevronDown className="w-4 h-4" />
              Price
            </button>
            <button className="h-9 px-4 rounded-full bg-[#E4E6EB] text-sm font-semibold text-[#050505] hover:bg-[#D8DADF] transition-colors flex items-center gap-1">
              <ChevronDown className="w-4 h-4" />
              Category
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/marketplace/product/${product.id}`}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="aspect-square bg-[#E4E6EB] flex items-center justify-center">
                {getProductIcon(product.icon)}
              </div>
              <div className="p-4">
                <p className="text-xl font-bold text-[#050505] mb-1">${product.price}</p>
                <p className="font-semibold text-[#050505] mb-1 line-clamp-1">{product.title}</p>
                <p className="text-sm text-[#65676B] mb-2">{product.location}</p>
                <p className="text-xs text-[#65676B] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {product.condition}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
