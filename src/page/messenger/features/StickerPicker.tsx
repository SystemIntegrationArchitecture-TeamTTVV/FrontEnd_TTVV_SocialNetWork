import { useTranslation } from 'react-i18next';

export default function StickerPicker() {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('messenger.featureStubs.stickerPicker')}</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-[#65676B]">{t('messenger.featureStubs.comingSoon')}</p>
      </div>
    </div>
  );
}
