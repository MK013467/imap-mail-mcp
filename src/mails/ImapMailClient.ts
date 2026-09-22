import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { SearchObject } from "imapflow";
import type { MailClient } from "./MailClient.js";
import type { ImapAccount } from "./accounts.js";
import type {
  EmailDetail,
  EmailSummary,
  MailboxSummary,
  MailSearchOptions,
} from "./types.js";

const MAX_MESSAGE_BYTES = 10_000_000;
const MAX_BODY_CHARS = 50_000;

export class ImapMailClient implements MailClient {
  private client: ImapFlow;

  constructor(private readonly account: ImapAccount) {
    this.client = new ImapFlow({
      host: account.host,
      port: 993,
      secure: true,
      auth: {
        user: account.user,
        pass: account.password,
      },
      logger: false,
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
        provider: this.account.provider,
        mailbox: "INBOX",
        uid: message.uid,
        subject: message.envelope?.subject,
        from: message.envelope?.from?.[0]?.address,
        date: message.envelope?.date
          ? new Date(message.envelope.date)
          : undefined,
      };
    } finally {
      lock.release();
    }
  }

  async getRecentEmails(
    limit: number,
    mailbox = "INBOX",
  ): Promise<EmailSummary[]> {
    const lock = await this.client.getMailboxLock(mailbox);
    try {
      const count = this.client.mailbox ? this.client.mailbox.exists : 0;
      if (count === 0) return [];

      const result: EmailSummary[] = [];
      const first = Math.max(1, count - limit + 1);
      for await (const message of this.client.fetch(`${first}:*`, {
        envelope: true,
      })) {
        result.push({
          provider: this.account.provider,
          mailbox,
          uid: message.uid,
          subject: message.envelope?.subject,
          from: message.envelope?.from?.[0]?.address,
          date: message.envelope?.date
            ? new Date(message.envelope.date)
            : undefined,
        });
      }
      return result
        .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
        .slice(0, limit);
    } finally {
      lock.release();
    }
  }

  async listMailboxes(): Promise<MailboxSummary[]> {
    return (await this.client.list())
      .filter((box) => !box.flags.has("\\Noselect"))
      .map((box) => ({
        path: box.path,
        name: box.name,
        specialUse: box.specialUse,
      }));
  }

  async readEmail(mailbox: string, uid: number): Promise<EmailDetail | null> {
    const lock = await this.client.getMailboxLock(mailbox);
    try {
      const metadata = await this.client.fetchOne(
        String(uid),
        { size: true },
        { uid: true },
      );
      if (!metadata) return null;
      if (typeof metadata.size !== "number") {
        throw new Error(`Could not determine the size of message ${uid}.`);
      }
      if (metadata.size > MAX_MESSAGE_BYTES) {
        throw new Error(`Message ${uid} is larger than the 10 MB read limit.`);
      }

      const message = await this.client.fetchOne(
        String(uid),
        { source: true, envelope: true },
        { uid: true },
      );
      if (!message || !message.source) return null;

      const parsed = await simpleParser(message.source);
      const html = typeof parsed.html === "string" ? parsed.html : "";
      const bodyFormat = parsed.text ? "text" : "html";
      const fullBody = parsed.text || html;
      return {
        provider: this.account.provider,
        mailbox,
        uid: message.uid,
        messageId: parsed.messageId,
        subject: parsed.subject ?? message.envelope?.subject,
        from:
          parsed.from?.value[0]?.address ??
          message.envelope?.from?.[0]?.address,
        to: (Array.isArray(parsed.to)
          ? parsed.to
          : parsed.to
            ? [parsed.to]
            : []
        )
          .flatMap((entry) => entry.value)
          .map(({ name, address }) => ({ name, address })),
        cc: (Array.isArray(parsed.cc)
          ? parsed.cc
          : parsed.cc
            ? [parsed.cc]
            : []
        )
          .flatMap((entry) => entry.value)
          .map(({ name, address }) => ({ name, address })),
        date:
          parsed.date ??
          (message.envelope?.date
            ? new Date(message.envelope.date)
            : undefined),
        body: fullBody.slice(0, MAX_BODY_CHARS),
        bodyFormat,
        bodyTruncated: fullBody.length > MAX_BODY_CHARS,
        attachments: parsed.attachments.map(
          ({ filename, contentType, size }) => ({
            filename,
            contentType,
            size,
          }),
        ),
      };
    } finally {
      lock.release();
    }
  }

  async readEmails(
    mailbox: string,
    uids: number[],
  ): Promise<Array<EmailDetail | null>> {
    const result: Array<EmailDetail | null> = [];
    for (const uid of uids) result.push(await this.readEmail(mailbox, uid));
    return result;
  }

  async searchEmails(options: MailSearchOptions): Promise<EmailSummary[]> {
    const result: EmailSummary[] = [];
    const criteria: SearchObject = {};
    if (options.query)
      criteria[
        options.field === "all" || !options.field ? "text" : options.field
      ] = options.query;
    if (options.from) criteria.from = options.from;
    if (options.to) criteria.to = options.to;
    if (options.since) criteria.since = options.since;
    if (options.before) criteria.before = options.before;

    const mailboxes =
      options.scope === "all"
        ? (await this.client.list())
            .filter((box) => !box.flags.has("\\Noselect"))
            .map((box) => box.path)
        : ["INBOX"];
    const limit = options.limit ?? 50;

    for (const mailbox of mailboxes) {
      const lock = await this.client.getMailboxLock(mailbox);
      try {
        const uids = await this.client.search(criteria, { uid: true });
        if (!uids || !Array.isArray(uids) || uids.length === 0) continue;
        const recentUids = uids.slice(-limit);
        for await (const message of this.client.fetch(
          recentUids,
          { envelope: true },
          { uid: true },
        )) {
          result.push({
            provider: this.account.provider,
            mailbox,
            uid: message.uid,
            subject: message.envelope?.subject,
            from: message.envelope?.from?.[0]?.address,
            date: message.envelope?.date
              ? new Date(message.envelope.date)
              : undefined,
          });
        }
      } finally {
        lock.release();
      }
    }

    return result
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
      .slice(0, limit);
  }
}
