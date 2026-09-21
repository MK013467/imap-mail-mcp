export interface MailClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getLatestEmail(): Promise<unknown>;
}
