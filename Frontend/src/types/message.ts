export type MessageType =
  | 'transaction'
  | 'promo'
  | 'expiry_warning'
  | 'reward'
  | 'trial_warning';

export type MessageChannel = 'sms' | 'whatsapp';
export type MessageStatus = 'sent' | 'failed';

export interface MessageLog {
  id: string;
  shopId: string;
  customerId: string | null;
  phone: string;
  messageType: MessageType;
  channel: MessageChannel;
  content: string;
  status: MessageStatus;
  createdAt: string;
}
