import { useState } from 'react';
import { Search, Filter, Eye, Trash2, Ban, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type MessageTab = 'all' | 'reported' | 'spam' | 'blocked';

const TAB_KEYS: Record<MessageTab, string> = {
  all: 'adminPanel.messages.tabAll',
  reported: 'adminPanel.messages.tabReported',
  spam: 'adminPanel.messages.tabSpam',
  blocked: 'adminPanel.messages.tabBlocked',
};

export default function AdminMessages() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MessageTab>('all');

  const tabs: { id: MessageTab; labelKey: string; badge?: number }[] = [
    { id: 'all', labelKey: TAB_KEYS.all, badge: 128 },
    { id: 'reported', labelKey: TAB_KEYS.reported, badge: 7 },
    { id: 'spam', labelKey: TAB_KEYS.spam, badge: 3 },
    { id: 'blocked', labelKey: TAB_KEYS.blocked, badge: 2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('adminPanel.messages.pageTitle')}</h1>
          <p className="text-lg text-gray-600">{t('adminPanel.messages.pageSubtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span>{t(tab.labelKey)}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`min-w-[28px] h-6 px-2 rounded-full text-xs flex items-center justify-center
                      ${isActive ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('adminPanel.messages.searchPlaceholder')}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm md:text-base transition-all"
            />
          </div>
          <button
            type="button"
            className="h-12 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-sm md:text-base"
          >
            <Filter className="w-5 h-5" />
            {t('adminPanel.messages.advancedFilter')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('adminPanel.messages.listTitle', {
                filter: t(TAB_KEYS[activeTab]),
              })}
            </h2>
            <p className="text-sm text-gray-500">{t('adminPanel.messages.placeholderNote')}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <Eye className="w-4 h-4" />
            <span>{t('adminPanel.messages.legendView')}</span>
            <Trash2 className="w-4 h-4 ml-3" />
            <span>{t('adminPanel.messages.legendDelete')}</span>
            <Ban className="w-4 h-4 ml-3" />
            <span>{t('adminPanel.messages.legendBlock')}</span>
          </div>
        </div>

        <div className="mt-6 border border-gray-100 rounded-xl bg-gray-50/80 p-8 text-center">
          <MessageSquare className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">{t('adminPanel.messages.comingTitle')}</h3>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">{t('adminPanel.messages.comingBody')}</p>
        </div>
      </div>
    </div>
  );
}
