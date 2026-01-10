import { useState } from 'react';
import { Plus, Calendar, MapPin, Users, Share2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Events() {
  const [activeTab, setActiveTab] = useState('today');

  const tabs = [
    { id: 'today', label: '📅 Today' },
    { id: 'upcoming', label: '📆 Upcoming' },
    { id: 'your', label: '📋 Your Events' },
    { id: 'hosting', label: '⭐ Hosting' },
    { id: 'birthdays', label: '🎂 Birthdays' },
  ];

  const events = [
    {
      id: 1,
      title: 'Tech Conference 2026',
      date: { day: 8, month: 'JAN' },
      time: 'Today at 2:00 PM',
      location: 'Convention Center, San Francisco',
      attendees: { interested: 256, going: 128 },
      status: 'going',
      color: '#1877F2',
    },
    {
      id: 2,
      title: "Sarah's Birthday Party 🎂",
      date: { day: 15, month: 'JAN' },
      time: 'Wed, January 15 at 7:00 PM',
      location: 'The Garden Restaurant',
      attendees: { invited: 45, going: 32 },
      status: 'interested',
      color: '#42B72A',
    },
    {
      id: 3,
      title: 'Community Meetup',
      date: { day: 22, month: 'JAN' },
      time: 'Wed, January 22 at 6:00 PM',
      location: 'Downtown Coffee Shop',
      attendees: { invited: 18, going: 12 },
      status: 'none',
      color: '#FF6B6B',
    },
    {
      id: 4,
      title: 'Charity Fundraiser',
      date: { day: 28, month: 'JAN' },
      time: 'Tue, January 28 at 5:00 PM',
      location: 'City Hall Auditorium',
      attendees: { interested: 1200, going: 586 },
      status: 'interested',
      color: '#4ECDC4',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white shadow-sm p-4 shrink-0">
        <h1 className="text-2xl font-bold text-[#050505] mb-4">Events</h1>

        {/* Create Event */}
        <button className="w-full h-11 bg-[#1877F2] text-white font-semibold rounded-lg hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-2 mb-6">
          <Plus className="w-5 h-5" />
          <span>Create new event</span>
        </button>

        {/* Tabs */}
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#E7F3FF] text-[#1877F2]'
                  : 'hover:bg-[#F0F2F5] text-[#050505]'
              }`}
            >
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Calendar Widget */}
        <div className="mt-6 bg-[#F0F2F5] rounded-lg p-4">
          <h3 className="text-base font-bold text-[#050505] mb-4 text-center">January 2026</h3>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="text-xs text-[#65676B] text-center font-semibold">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const hasEvent = day === 8;
              const isToday = day === 15;
              return (
                <div
                  key={day}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                    hasEvent
                      ? 'bg-[#1877F2] text-white'
                      : isToday
                      ? 'relative text-[#050505]'
                      : 'text-[#65676B] hover:bg-white'
                  }`}
                >
                  {day}
                  {isToday && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-red-500"></div>}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#050505]">Upcoming Events</h2>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* Date Badge */}
                <div
                  className="w-20 h-20 rounded-lg flex flex-col items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: event.color }}
                >
                  <span className="text-2xl font-bold">{event.date.day}</span>
                  <span className="text-sm">{event.date.month}</span>
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[#050505] mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-[#65676B] mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.attendees.going || event.attendees.interested} people{' '}
                        {event.attendees.going ? 'going' : 'interested'}
                        {event.attendees.invited && ` · ${event.attendees.invited} invited`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {event.status === 'going' ? (
                    <button className="h-9 px-4 bg-[#1877F2] text-white text-sm font-semibold rounded-md hover:bg-[#166FE5] transition-colors flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Going</span>
                    </button>
                  ) : (
                    <button
                      className={`h-9 px-4 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${
                        event.status === 'interested'
                          ? 'bg-[#E4E6EB] text-[#050505] hover:bg-[#D8DADF]'
                          : 'bg-[#E4E6EB] text-[#050505] hover:bg-[#D8DADF]'
                      }`}
                    >
                      <span>{event.status === 'interested' ? 'Interested' : 'Going'}</span>
                    </button>
                  )}
                  <button className="h-9 px-4 bg-[#E4E6EB] text-[#050505] text-sm font-semibold rounded-md hover:bg-[#D8DADF] transition-colors flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Events */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#050505]">Suggested for you</h2>
            <button className="text-sm text-[#1877F2] hover:underline font-semibold">See all</button>
          </div>
        </div>
      </main>
    </div>
  );
}
