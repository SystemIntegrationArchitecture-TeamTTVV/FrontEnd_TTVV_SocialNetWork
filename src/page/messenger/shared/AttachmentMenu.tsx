// ─── AttachmentMenu — grid of attachment type options ────────────────────
import { useTranslation } from 'react-i18next';
import {
  Image as ImageIcon, Video, FileText, Music, MapPin, Contact, Gift,
} from 'lucide-react';
import type { ChangeEvent } from 'react';

interface AttachmentMenuProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onShareLocation: () => void;
  onShareContact: () => void;
}

export default function AttachmentMenu({
  fileInputRef,
  onFileUpload,
  onShareLocation,
  onShareContact,
}: AttachmentMenuProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-2 md:mb-3 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileUpload}
            className="hidden"
          />
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.photo')}</span>
        </label>
        <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
          <input type="file" accept="video/*" onChange={onFileUpload} className="hidden" />
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-green-100 flex items-center justify-center">
            <Video className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.video')}</span>
        </label>
        <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
          <input type="file" onChange={onFileUpload} className="hidden" />
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-purple-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.file')}</span>
        </label>
        <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
          <input type="file" accept="audio/*" onChange={onFileUpload} className="hidden" />
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-pink-100 flex items-center justify-center">
            <Music className="w-5 h-5 text-pink-600" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.audio')}</span>
        </label>
        <button onClick={onShareLocation} className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-red-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.location')}</span>
        </button>
        <button onClick={onShareContact} className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-cyan-100 flex items-center justify-center">
            <Contact className="w-5 h-5 text-cyan-600" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.contact')}</span>
        </button>
        <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
          <input type="file" accept="image/gif" onChange={onFileUpload} className="hidden" />
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Gift className="w-5 h-5 text-yellow-600" />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">GIF</span>
        </label>
      </div>
    </div>
  );
}
