import { Calendar, Clock, MapPin, Users, Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminEventManagement() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('adminPanel.events.pageTitle')}</h1>
        <p className="text-lg text-gray-600">{t('adminPanel.events.pageSubtitle')}</p>
      </div>

      {/* Feature overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Calendar, label: t('adminPanel.events.featureCreate'), color: '#3B82F6' },
          { icon: Users, label: t('adminPanel.events.featureManage'), color: '#10B981' },
          { icon: MapPin, label: t('adminPanel.events.featureLocation'), color: '#F59E0B' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: item.color + '15' }}
              >
                <Icon className="w-7 h-7" style={{ color: item.color }} />
              </div>
              <p className="font-semibold text-gray-900">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm p-12 text-center border border-blue-100">
        <Construction className="w-16 h-16 text-blue-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('adminPanel.events.comingTitle')}</h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-6">{t('adminPanel.events.comingBody')}</p>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{t('adminPanel.events.comingETA')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
