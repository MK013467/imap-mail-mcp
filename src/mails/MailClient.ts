import type {
  EmailDetail,
  EmailSummary,
  MailboxSummary,
  MailSearchOptions,
} from "./types.js";

export interface MailClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getLatestEmail(): Promise<EmailSummary | null>;
  getRecentEmails(limit: number, mailbox?: string): Promise<EmailSummary[]>;
  searchEmails(options: MailSearchOptions): Promise<EmailSummary[]>;
  readEmail(mailbox: string, uid: number): Promise<EmailDetail | null>;
  readEmails(
    mailbox: string,
    uids: number[],
  ): Promise<Array<EmailDetail | null>>;
  listMailboxes(): Promise<MailboxSummary[]>;
}
