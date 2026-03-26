/**
 * Plain-data interface for Mia assistant messages.
 *
 * Each message is identified by a unique `messageId` key (e.g. "step-0-default")
 * and contains Hebrew title + description text displayed in the speech bubble.
 */

export interface IMiaMessageData {
  _id?: string;
  messageId: string;
  title: string;
  description: string;
  isActive: boolean;
}
