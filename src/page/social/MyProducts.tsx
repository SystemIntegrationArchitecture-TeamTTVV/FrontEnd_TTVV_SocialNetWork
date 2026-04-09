import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Check, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  productApi,
  type ProductDTO,
  type CreateProductRequest,
  type UpdateProductRequest
} from '../../apis/products';
import ProductForm from '../../components/products/ProductForm';
import { getLocaleTag } from '../../i18n';

export default function MyProducts() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'sold'>('all');

  useEffect(() => {
    loadProducts();
  }, [user?.id]);

  const loadProducts = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await productApi.getUserProducts(user.id);
      setProducts(response || []);
      setError('');
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('myProducts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEditClick = (product: ProductDTO) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    if (!user?.id) return;

    try {
      setSubmitting(true);

      if (editingProduct?.id) {
        const updatedProduct = await productApi.updateProduct(
          editingProduct.id,
          data as UpdateProductRequest,
          user.id
        );

        if (updatedProduct) {
          setProducts(products.map(p => (p.id === editingProduct.id ? updatedProduct : p)));
        }
      } else {
        const newProduct = await productApi.createProduct(
          data as CreateProductRequest,
          user.id
        );

        if (newProduct) {
          setProducts([...products, newProduct]);
        }
      }

      setShowForm(false);
      setEditingProduct(undefined);
    } catch (err) {
      console.error('Error submitting form:', err);
      alert(t('myProducts.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm(t('myProducts.deleteConfirm'))) return;

    try {
      await productApi.deleteProduct(productId, user!.id);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(t('myProducts.deleteError'));
    }
  };

  const handleToggleActive = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const updatedProduct = await productApi.updateProduct(
        productId,
        {
          active: !product.active
        },
        user!.id
      );

      if (updatedProduct) {
        setProducts(products.map(p => (p.id === productId ? updatedProduct : p)));
      }
    } catch (err) {
      console.error('Error toggling product:', err);
      alert(t('myProducts.toggleError'));
    }
  };

  const handleMarkAsSold = async (productId: string) => {
    try {
      const updatedProduct = await productApi.markAsSold(productId, user!.id);
      if (updatedProduct) {
        setProducts(products.map(p => (p.id === productId ? updatedProduct : p)));
      }
    } catch (err) {
      console.error('Error marking as sold:', err);
      alert(t('myProducts.markSoldError'));
    }
  };

  const getFilteredProducts = () => {
    switch (filterStatus) {
      case 'active':
        return products.filter(p => p.active && !p.sold);
      case 'sold':
        return products.filter(p => p.sold);
      default:
        return products;
    }
  };

  const filteredProducts = getFilteredProducts();

  const stats = {
    total: products.length,
    active: products.filter(p => p.active && !p.sold).length,
    sold: products.filter(p => p.sold).length
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <ProductForm
          product={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(undefined);
          }}
          isLoading={submitting}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('myProducts.title')}</h1>
            <p className="text-gray-600 mt-1">{t('myProducts.subtitle')}</p>
          </div>

          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('myProducts.createNew')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">{t('myProducts.total')}</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">{t('myProducts.active')}</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">{t('myProducts.sold')}</p>
            <p className="text-3xl font-bold text-blue-600">{stats.sold}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          {(['all', 'active', 'sold'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t(`myProducts.filter.${status}`)}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">{t('myProducts.empty')}</p>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('myProducts.createNew')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">{t('myProducts.table.product')}</th>
                    <th className="px-6 py-3 text-left">{t('myProducts.table.price')}</th>
                    <th className="px-6 py-3 text-left">{t('myProducts.table.category')}</th>
                    <th className="px-6 py-3 text-left">{t('myProducts.table.status')}</th>
                    <th className="px-6 py-3 text-left">{t('myProducts.table.actions')}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{product.title}</p>
                        <p className="text-sm text-gray-500">{product.location}</p>
                      </td>

                      <td className="px-6 py-4 font-semibold">
                        {product.price.toLocaleString(getLocaleTag())} {product.currency}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {product.sold ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            {t('myProducts.status.sold')}
                          </span>
                        ) : product.active ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {t('myProducts.status.active')}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {t('myProducts.status.inactive')}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(product.id!)}
                          >
                            {product.active ? <Eye /> : <EyeOff />}
                          </button>

                          <button onClick={() => handleEditClick(product)}>
                            <Edit2 />
                          </button>

                          {!product.sold && (
                            <button onClick={() => handleMarkAsSold(product.id!)}>
                              <Check />
                            </button>
                          )}

                          <button onClick={() => handleDelete(product.id!)}>
                            <Trash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}