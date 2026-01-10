import { useNavigate } from 'react-router-dom';
import { X, Mail } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ResetPasswordVerification() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(165); // 2:45 in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = [...code];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newCode[index] = char;
    });
    setCode(newCode);
  };

  const handleContinue = () => {
    if (code.every((digit) => digit !== '')) {
      navigate('/auth/reset-new-password');
    }
  };

  const isCodeComplete = code.every((digit) => digit !== '');

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-8 relative">
        {/* Close Button */}
        <button
          onClick={() => navigate('/auth/login')}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#E4E6EB] flex items-center justify-center hover:bg-[#D8DADF] transition-colors"
        >
          <X className="w-5 h-5 text-[#8A8D91]" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#E7F3FF] flex items-center justify-center">
            <Mail className="w-10 h-10 text-[#1877F2]" />
          </div>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-[#1C1E21] text-center mb-4">
          Xác minh tài khoản
        </h2>

        {/* Description */}
        <p className="text-center text-[#606770] mb-2">
          Chúng tôi đã gửi mã xác minh đến
        </p>
        <p className="text-center font-semibold text-[#1C1E21] mb-4">
          s***h@example.com
        </p>
        <p className="text-center text-[#606770] mb-6">
          Vui lòng nhập mã để tiếp tục.
        </p>

        {/* Divider */}
        <div className="border-t border-[#DFE1E6] mb-6"></div>

        {/* Verification Code Input */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-[#050505]">Mã xác minh</label>
          
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-16 h-18 text-center text-3xl font-bold rounded-lg border-2 transition-colors ${
                  digit
                    ? 'border-[#1877F2] text-[#1C1E21]'
                    : 'border-[#DFE1E6] text-[#BCC0C4]'
                } focus:outline-none focus:ring-2 focus:ring-[#1877F2]`}
              />
            ))}
          </div>

          {/* Resend Code */}
          <div className="text-center space-y-2">
            <p className="text-sm text-[#65676B]">Không nhận được mã?</p>
            <button className="text-sm text-[#1877F2] hover:underline">
              Gửi lại mã
            </button>
          </div>

          {/* Timer */}
          {timer > 0 && (
            <div className="flex justify-center">
              <div className="px-6 py-2 rounded-full bg-[#E7F3FF]">
                <span className="text-sm font-semibold text-[#1877F2]">
                  ⏱️ {formatTime(timer)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={() => navigate('/auth/forgot-password')}
            className="flex-1 h-12 bg-[#E4E6EB] text-[#050505] font-semibold rounded-md hover:bg-[#D8DADF] transition-colors"
          >
            Quay lại
          </button>
          <button
            onClick={handleContinue}
            disabled={!isCodeComplete}
            className={`flex-1 h-12 font-semibold rounded-md transition-colors ${
              isCodeComplete
                ? 'bg-[#1877F2] text-white hover:bg-[#166FE5]'
                : 'bg-[#BCC0C4] text-white cursor-not-allowed'
            }`}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}

