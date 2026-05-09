import { useRef } from 'react';
import { Paperclip, Image, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// Chat upload limits (per message)
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function validateFile(file: File, allowedTypes?: string[]): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `File quá lớn (tối đa ${MAX_FILE_BYTES / 1024 / 1024} MB)`;
  }
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return `Định dạng không hỗ trợ: ${file.type}`;
  }
  return null;
}

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  minimal?: boolean;
}

export default function FileUpload({ onFileSelect, accept = '*', multiple = false, minimal = false }: FileUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const error = validateFile(files[0]);
      if (error) { toast.error(error); return; }
      onFileSelect(files[0]);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={minimal
          ? "w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          : "w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors shrink-0"}
        title={t('messenger.attachmentsTitle')}
      >
        <Paperclip className="w-5 h-5" />
      </button>
    </>
  );
}

export function ImageUpload({ onFileSelect, minimal = false }: FileUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const error = validateFile(files[0], ALLOWED_IMAGE_TYPES);
      if (error) { toast.error(error); return; }
      onFileSelect(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={minimal
          ? "w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          : "w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors shrink-0"}
        title={t('messenger.sendImage')}
      >
        <Image className="w-5 h-5" />
      </button>
    </>
  );
}

export function VideoUpload({ onFileSelect, minimal = false }: FileUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const error = validateFile(files[0], ALLOWED_VIDEO_TYPES);
      if (error) { toast.error(error); return; }
      onFileSelect(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={minimal
          ? "w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          : "w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors shrink-0"}
        title={t('messenger.sendVideo')}
      >
        <Video className="w-5 h-5" />
      </button>
    </>
  );
}
