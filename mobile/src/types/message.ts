export type MessageChannel = 'sms' | 'email' | 'push';
export type MessageType = 'promotion' | 'transactional';
export type MessageStatus = 'queued' | 'sent' | 'failed';

export type MessageLog = {
  id: string;
  title?: string | null;
  content: string;
  channel: MessageChannel;
  type: MessageType;
  status: MessageStatus;
  createdAt: string;
};

