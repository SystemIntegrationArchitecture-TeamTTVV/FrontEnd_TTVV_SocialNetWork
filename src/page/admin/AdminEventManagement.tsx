import { Search, Filter, Eye, Edit, Trash2, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type DemoId = 'demo1' | 'demo2' | 'demo3';

export default function AdminEventManagement() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const events: {
    id: number;
    demoId: DemoId;
    date: string;
    time: string;
    attendees: number;
    status: 'upcoming' | 'ongoing' | 'ended';
    organizer: { name: string; avatar: string; color: string };
  }[] = [
    {
      id: 1,
      demoId: 'demo1',
      date: '25/12/2024',
      time: '09:00 - 17:00',
      attendees: 1250,
      status: 'upcoming',
      organizer: { name: 'Nguyễn Văn A', avatar: 'NA', color: '#1877F2' },
    },
    {
      id: 2,
      demoId: 'demo2',
      date: '20/12/2024',
      time: '14:00 - 18:00',
      attendees: 850,
      status: 'upcoming',
      organizer: { name: 'Trần Thị B', avatar: 'TB', color: '#42B72A' },
    },
    {
      id: 3,
      demoId: 'demo3',
      date: '24/12/2024',
      time: '19:00 - 23:00',
      attendees: 200,
      status: 'ongoing',
      organizer: { name: 'Lê Văn C', avatar: 'LC', color: '#FF6B6B' },
    },
  ];

  const statusLabel = (status: string) => {
    if (status === 'upcoming') return t('adminPanel.events.statusUpcoming');
    if (status === 'ongoing') return t('adminPanel.events.statusOngoing');
    return t('adminPanel.events.statusEnded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('adminPanel.events.pageTitle')}</h1>
          <p className="text-lg text-gray-600">{t('adminPanel.events.pageSubtitle')}</p>
        </div>
        <button type="button" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm">
          + {t('adminPanel.events.createEvent')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder={t('adminPanel.events.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
          <button type="button" className="h-14 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-lg">
            <Filter className="w-6 h-6" />
            {t('adminPanel.events.filter')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-1">
                    {t(`adminPanel.events.${event.demoId}.name`)}
                  </h3>
                  <div className="flex items-center gap-4 text-base text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>
                        {event.date} • {event.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{t(`adminPanel.events.${event.demoId}.location`)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-xl font-semibold text-base ${
                  event.status === 'upcoming'
                    ? 'bg-blue-50 text-blue-700'
                    : event.status === 'ongoing'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-50 text-gray-700'
                }`}
              >
                {statusLabel(event.status)}
              </span>
            </div>

            <p className="text-base text-gray-700 mb-4">{t(`adminPanel.events.${event.demoId}.description`)}</p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: event.organizer.color }}
                  >
                    {event.organizer.avatar}
                  </div>
                  <span className="text-base font-semibold text-gray-700">{event.organizer.name}</span>
                </div>
                <div className="flex items-center gap-2 text-base text-gray-600">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">
                    {t('adminPanel.events.attendees', {
                      count: event.attendees,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Eye className="w-5 h-5" />
                </button>
                <button type="button" className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <Edit className="w-5 h-5" />
                </button>
                <button type="button" className="w-11 h-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
