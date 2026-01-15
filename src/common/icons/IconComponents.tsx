import { 
  Globe, Mountain, Laptop, Heart, ThumbsUp, Smile, 
  Camera, Image as ImageIcon, Smartphone, Sofa, Guitar, 
  Watch, Gamepad2, Plane, BookOpen, ChefHat, Waves, 
  Sun, Building2, Calendar, CalendarDays, ClipboardList, 
  Star, Cake, PartyPopper, Eye, Lock, Search, User, 
  Bell, Palette, Pencil, AlertTriangle, Clock, 
  CheckCircle2, XCircle, ChevronDown, MapPin, Users, Bike
} from 'lucide-react';

// Icon wrapper component
interface IconProps {
  className?: string;
  size?: number;
}

export const LocationIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Globe className={className} size={size} />
);

export const MountainIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Mountain className={className} size={size} />
);

export const LaptopIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Laptop className={className} size={size} />
);

export const HeartIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Heart className={className} size={size} />
);

export const ThumbsUpIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <ThumbsUp className={className} size={size} />
);

export const SmileIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Smile className={className} size={size} />
);

export const CameraIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Camera className={className} size={size} />
);

export const ImagePlaceholderIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <ImageIcon className={className} size={size} />
);

export const PhoneIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Smartphone className={className} size={size} />
);

export const SofaIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Sofa className={className} size={size} />
);

export const GuitarIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Guitar className={className} size={size} />
);

export const WatchIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Watch className={className} size={size} />
);

export const GamepadIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Gamepad2 className={className} size={size} />
);

export const PlaneIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Plane className={className} size={size} />
);

export const BookIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <BookOpen className={className} size={size} />
);

export const ChefHatIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <ChefHat className={className} size={size} />
);

export const BeachIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Waves className={className} size={size} />
);

export const SunIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Sun className={className} size={size} />
);

export const BuildingIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Building2 className={className} size={size} />
);

export const CalendarIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Calendar className={className} size={size} />
);

export const CalendarDaysIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <CalendarDays className={className} size={size} />
);

export const ClipboardIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <ClipboardList className={className} size={size} />
);

export const StarIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Star className={className} size={size} />
);

export const CakeIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Cake className={className} size={size} />
);

export const PartyPopperIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <PartyPopper className={className} size={size} />
);

export const EyeIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Eye className={className} size={size} />
);

export const LockIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Lock className={className} size={size} />
);

export const SearchIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Search className={className} size={size} />
);

export const UserIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <User className={className} size={size} />
);

export const BellIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Bell className={className} size={size} />
);

export const PaletteIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Palette className={className} size={size} />
);

export const PencilIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Pencil className={className} size={size} />
);

export const AlertIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <AlertTriangle className={className} size={size} />
);

export const ClockIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Clock className={className} size={size} />
);

export const CheckCircleIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <CheckCircle2 className={className} size={size} />
);

export const XCircleIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <XCircle className={className} size={size} />
);

export const ChevronDownIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <ChevronDown className={className} size={size} />
);

export const MapPinIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <MapPin className={className} size={size} />
);

export const UsersIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Users className={className} size={size} />
);

export const BikeIcon = ({ className = "w-4 h-4", size }: IconProps) => (
  <Bike className={className} size={size} />
);

// Large icon components for placeholders
export const LargeImagePlaceholder = ({ className = "w-24 h-24 text-gray-300" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
    <ImageIcon className="w-12 h-12 text-gray-400" />
  </div>
);

export const LargeMountainPlaceholder = ({ className = "w-full h-full text-gray-300" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg`}>
    <Mountain className="w-24 h-24 text-gray-400" />
  </div>
);

export const LargePhonePlaceholder = ({ className = "w-full h-full text-gray-300" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
    <Smartphone className="w-16 h-16 text-gray-400" />
  </div>
);

export const LargeCameraPlaceholder = ({ className = "w-full h-full text-gray-300" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
    <Camera className="w-16 h-16 text-gray-400" />
  </div>
);

export const LargeBeachPlaceholder = ({ className = "w-full h-full text-gray-300" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg`}>
    <Waves className="w-16 h-16 text-blue-400" />
  </div>
);

export const LargeSunPlaceholder = ({ className = "w-full h-full text-gray-300" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg`}>
    <Sun className="w-16 h-16 text-yellow-500" />
  </div>
);

export const LargeBuildingPlaceholder = ({ className = "w-full h-full text-gray-300" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
    <Building2 className="w-16 h-16 text-gray-400" />
  </div>
);

export const LargePartyPlaceholder = ({ className = "w-full h-full text-gray-300" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg`}>
    <PartyPopper className="w-16 h-16 text-pink-500" />
  </div>
);

