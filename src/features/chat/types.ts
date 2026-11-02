export interface ChatContact {
  hcpId: string;
  hcpName: string;
  peerName: string;
  peerRole: string;
  specialty: string | null;
  institutionName: string | null;
}
export interface Conversation extends ChatContact {
  id: string;
  canSend: boolean;
  updatedAt: string;
  peerReadSequence: number;
  lastMessage: string | null;
  lastSenderId: string | null;
  unreadCount: number;
}
export interface ChatMessage {
  id: string;
  sequence: number;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  body: string;
  createdAt: string;
}
export interface MessagePage {
  items: ChatMessage[];
  conversation: Conversation;
  nextCursor: number | null;
}
