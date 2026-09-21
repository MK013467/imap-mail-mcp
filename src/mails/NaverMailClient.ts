import { ImapFlow } from "imapflow";
import type { MailClient } from "./MailClient.js";

export class NaverMailClient implements MailClient {
  private client: ImapFlow;

  constructor() {
    this.client = new ImapFlow({
      host: "imap.naver.com",
      port: 993,
      secure: true,
      auth: {
        user: process.env.NAVER_EMAIL!,
        pass: process.env.NAVER_IMTP_PASSWORD!,
      },
    });
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.logout();
  }

  async getLatestEmail() {
    const lock = await this.client.getMailboxLock("INBOX");

    try {
      const message = await this.client.fetchOne("*", {
        uid: true,
        envelope: true,
      });

      if (!message) {
        return null;
      }

      return {
        uid: message.uid,
        subject: message.envelope?.subject,
        from: message.envelope?.from?.[0]?.address,
        date: message.envelope?.date,
      };
    } finally {
      lock.release();
    }
  }
}
