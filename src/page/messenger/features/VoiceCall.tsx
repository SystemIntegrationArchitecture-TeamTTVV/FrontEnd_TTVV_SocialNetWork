import { useTranslation } from 'react-i18next';

export default function VoiceCall() {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{t('messenger.featureStubs.voiceCall')}</h1>
        <p>{t('messenger.featureStubs.comingSoon')}</p>
      </div>
    </div>
  );
}
