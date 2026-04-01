import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type AuthRequiredModalProps = {
  open: boolean;
  fromPath?: string;
  onClose: () => void;
};

export default function AuthRequiredModal({ open, fromPath, onClose }: AuthRequiredModalProps) {
  const { t } = useTranslation();
  if (!open) return null;

  const loginState = fromPath ? { from: { pathname: fromPath } } : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label={t('authRequiredModal.closeAria')}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="p-6 sm:p-7">
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">{t('authRequiredModal.title')}</h3>
          <p className="mt-2.5 text-base leading-7 text-gray-600">
            {t('authRequiredModal.description')}
          </p>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 sm:px-5">
            <p className="text-sm leading-7 text-blue-900">
              {t('authRequiredModal.benefit')}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-gray-200 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('authRequiredModal.cancel')}
            </button>
            <Link
              to="/auth/login"
              state={loginState}
              className="h-12 rounded-xl bg-blue-600 px-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 inline-flex items-center justify-center"
              onClick={onClose}
            >
              {t('authRequiredModal.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
