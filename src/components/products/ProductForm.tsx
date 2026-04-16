import { useState } from 'react';
import { X, Plus, Trash2, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProductDTO, CreateProductRequest, UpdateProductRequest } from '../../apis/products';

interface ProductFormProps {
  product?: ProductDTO;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, isLoading = false }: ProductFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateProductRequest | UpdateProductRequest>({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    currency: product?.currency || 'VND',
    condition: product?.condition || 'NEW',
    location: product?.location || '',
    address: product?.address || '',
    images: product?.images || [],
    tags: product?.tags || [],
    category: product?.category || '',
  });

  const [imageInput, setImageInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const conditions = [
    { value: 'NEW', label: t('productForm.conditions.new') },
    { value: 'EXCELLENT', label: t('productForm.conditions.excellent') },
    { value: 'GOOD', label: t('productForm.conditions.good') },
    { value: 'FAIR', label: t('productForm.conditions.fair') },
  ];

  const categories = [
    { value: 'electronics', label: t('marketplace.categories.electronics') },
    { value: 'vehicles', label: t('marketplace.categories.vehicles') },
    { value: 'property', label: t('marketplace.categories.property') },
    { value: 'clothing', label: t('marketplace.categories.clothing') },
    { value: 'home', label: t('marketplace.categories.home') },
    { value: 'hobbies', label: t('marketplace.categories.hobbies') },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) newErrors.title = t('productForm.validation.titleRequired');
    if (!formData.description?.trim()) newErrors.description = t('productForm.validation.descriptionRequired');
    if (!formData.price || formData.price <= 0) newErrors.price = t('productForm.validation.priceRequired');
    if (!formData.location?.trim()) newErrors.location = t('productForm.validation.locationRequired');
    if (!formData.category) newErrors.category = t('productForm.validation.categoryRequired');
    if (!formData.images || formData.images.length === 0) newErrors.images = t('productForm.validation.imagesRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddImage = () => {
    if (imageInput.trim() && formData.images && formData.images.length < 10) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images!, imageInput.trim()],
      }));
      setImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images!.filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags && formData.tags.length < 20) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags!, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags!.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {product ? t('productForm.editTitle') : t('productForm.createTitle')}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            {t('productForm.title')} *
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder={t('productForm.titlePlaceholder')}
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              errors.title
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }`}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            {t('productForm.description')} *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder={t('productForm.descriptionPlaceholder')}
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
              errors.description
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }`}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Price & Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('productForm.price')} *
            </label>
            <input
              id="price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.price
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('productForm.currency')}
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('productForm.category')} *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.category
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            >
              <option value="">{t('productForm.selectCategory')}</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('productForm.condition')}
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {conditions.map(cond => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Address */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('productForm.location')} *
            </label>
            <input
              id="location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder={t('productForm.locationPlaceholder')}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                errors.location
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('productForm.address')}
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              placeholder={t('productForm.addressPlaceholder')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('productForm.images')} * ({formData.images?.length || 0}/10)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder={t('productForm.imagePlaceholder')}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
            />
            <button
              type="button"
              onClick={handleAddImage}
              disabled={!imageInput.trim() || (formData.images?.length || 0) >= 10}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {errors.images && <p className="text-red-500 text-sm mb-2">{errors.images}</p>}
          <div className="space-y-2">
            {formData.images?.map((img, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-600 truncate">{img}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('productForm.tags')} ({formData.tags?.length || 0}/20)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value.replace(/\s+/g, ''))}
              placeholder={t('productForm.tagPlaceholder')}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || (formData.tags?.length || 0) >= 20}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map((tag, index) => (
              <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                <span className="text-sm">{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(index)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && <Loader className="w-4 h-4 animate-spin" />}
          {product ? t('productForm.update') : t('productForm.create')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
