import React, { useEffect, useState } from 'react';
import { totpApi } from '../../apis/totp';
import { FEATURE_FLAGS } from '../../apis/config';

interface Props {
  onClose: () => void;
}

type Phase = 'loading' | 'setup' | 'verify' | 'done' | 'disable';

export default function TotpSetup({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!FEATURE_FLAGS.TWO_FACTOR) { onClose(); return; }
    totpApi.status().then(res => {
      setPhase(res.totpEnabled ? 'disable' : 'setup');
    }).catch(() => setPhase('setup'));
  }, [onClose]);

  const handleSetup = async () => {
    setSaving(true); setError('');
    try {
      const res = await totpApi.setup();
      setQrUrl(res.qrCodeDataUrl);
      setSecret(res.secret);
      setPhase('verify');
    } catch { setError('Không thể khởi tạo 2FA.'); }
    finally { setSaving(false); }
  };

  const handleVerify = async () => {
    if (code.length !== 6) { setError('Mã gồm 6 chữ số.'); return; }
    setSaving(true); setError('');
    try {
      await totpApi.verify(code);
      setPhase('done');
    } catch { setError('Mã không hợp lệ. Thử lại.'); }
    finally { setSaving(false); }
  };

  const handleDisable = async () => {
    if (code.length !== 6) { setError('Mã gồm 6 chữ số.'); return; }
    setSaving(true); setError('');
    try {
      await totpApi.disable(code);
      setPhase('setup');
      setCode('');
    } catch { setError('Mã không hợp lệ.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Xác thực 2 bước (2FA)</h3>

        {phase === 'loading' && <p className="text-sm text-gray-500">Đang tải...</p>}

        {phase === 'setup' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Dùng ứng dụng Google Authenticator hoặc Authy để quét QR và bảo vệ tài khoản.
            </p>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <button onClick={handleSetup} disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
              {saving ? 'Đang tạo...' : 'Bắt đầu thiết lập'}
            </button>
          </>
        )}

        {phase === 'verify' && (
          <>
            <p className="text-xs text-gray-500 mb-3">Quét mã QR bằng ứng dụng xác thực:</p>
            <img src={qrUrl} alt="QR Code" className="mx-auto mb-3 w-44 h-44 rounded-lg border" />
            <p className="text-xs text-gray-400 mb-4 text-center break-all">Mã thủ công: <b>{secret}</b></p>
            <input
              type="text" inputMode="numeric" maxLength={6} placeholder="Nhập mã 6 số"
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-center tracking-widest text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            <button onClick={handleVerify} disabled={saving}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium disabled:opacity-50">
              {saving ? 'Đang xác minh...' : 'Xác minh & Bật 2FA'}
            </button>
          </>
        )}

        {phase === 'done' && (
          <>
            <p className="text-green-600 font-medium mb-4">✓ 2FA đã được bật thành công!</p>
            <button onClick={onClose} className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium">
              Đóng
            </button>
          </>
        )}

        {phase === 'disable' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              2FA hiện đang <b className="text-green-600">bật</b>. Nhập mã xác thực để tắt.
            </p>
            <input
              type="text" inputMode="numeric" maxLength={6} placeholder="Mã 6 số hiện tại"
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-center tracking-widest text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            <button onClick={handleDisable} disabled={saving}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50">
              {saving ? 'Đang xử lý...' : 'Tắt 2FA'}
            </button>
          </>
        )}

        <button onClick={onClose} className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
          Hủy
        </button>
      </div>
    </div>
  );
}
