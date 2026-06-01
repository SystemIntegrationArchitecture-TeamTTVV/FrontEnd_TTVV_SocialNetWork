import type { Message } from '../apis/messages';

const PREVIEW_PREFIX = {
  contact: '[contact]',
  image: '[image]',
  video: '[video]',
  audio: '[audio]',
  file: '[file]',
  reply: '[reply]',
  sticker: '[sticker]',
} as const;

export type ConversationPreviewKind = 'text' | 'contact' | 'image' | 'video' | 'audio' | 'file' | 'reply' | 'sticker';

export interface ConversationPreviewDisplay {
  kind: ConversationPreviewKind;
  text: string;
}

export const buildConversationPreview = (message: Partial<Message>): string => {
  if (message.messageType === 'POLL') {
    const question = message.pollQuestion || message.content?.trim();
    return question ? `📊 ${question}` : '📊 Binh chon';
  }

  if (message.messageType === 'APPOINTMENT') {
    const title = message.appointmentTitle || message.content?.trim();
    return title ? `📅 ${title}` : '📅 Hen gap';
  }

  const content = message.content?.trim();
  if (content) return content;

  const firstAttachment = message.attachments?.[0];
  if (firstAttachment) {
    if (firstAttachment.type === 'contact') {
      const name = (firstAttachment.fileName || '').trim() || 'Contact';
      return `${PREVIEW_PREFIX.contact} ${name}`;
    }
    if (firstAttachment.type === 'sticker') return PREVIEW_PREFIX.sticker;
    if (firstAttachment.type === 'image') return PREVIEW_PREFIX.image;
    if (firstAttachment.type === 'video') return PREVIEW_PREFIX.video;
    if (firstAttachment.type === 'audio') return PREVIEW_PREFIX.audio;
    return PREVIEW_PREFIX.file;
  }

  if (message.replyTo?.contentPreview) {
    return `${PREVIEW_PREFIX.reply} ${message.replyTo.contentPreview}`;
  }

  return '';
};

export const parseConversationPreview = (preview: string): ConversationPreviewDisplay => {
  const text = preview.trim();
  if (!text) return { kind: 'text', text: '' };

  if (text.startsWith(PREVIEW_PREFIX.contact)) {
    return { kind: 'contact', text: text.slice(PREVIEW_PREFIX.contact.length).trim() || 'Contact' };
  }
  if (text === PREVIEW_PREFIX.sticker) return { kind: 'sticker', text: 'Sticker' };
  if (text === PREVIEW_PREFIX.image) return { kind: 'image', text: 'Photo' };
  if (text === PREVIEW_PREFIX.video) return { kind: 'video', text: 'Video' };
  if (text === PREVIEW_PREFIX.audio) return { kind: 'audio', text: 'Voice message' };
  if (text === PREVIEW_PREFIX.file) return { kind: 'file', text: 'Attachment' };
  if (text.startsWith(PREVIEW_PREFIX.reply)) {
    return { kind: 'reply', text: text.slice(PREVIEW_PREFIX.reply.length).trim() || 'Replied message' };
  }

  return { kind: 'text', text };
};
