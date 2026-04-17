/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  pinned?: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64
}

export interface ChatThread {
  id: string;
  title: string;
  lastMessageAt: string;
  isPinned: boolean;
  userId: string;
  previewText?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
}
