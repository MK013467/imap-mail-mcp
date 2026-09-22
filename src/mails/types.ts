export const IMAP_HOSTS = {
  naver: "imap.naver.com",
  daum: "imap.daum.net",
  kakao: "imap.kakao.com",
  icloud: "imap.mail.me.com",
} as const;

export type MailProvider = "naver" | "daum" | "kakao";

export type ImapHost = (typeof IMAP_HOSTS)[MailProvider];

export type EmailSummary = {
  provider: MailProvider;
  mailbox: string;
  uid: number;
  subject?: string | undefined;
  from?: string | undefined;
  date?: Date | undefined;
};

export type MailAddress = {
  name?: string | undefined;
  address?: string | undefined;
};

export type EmailDetail = EmailSummary & {
  messageId?: string | undefined;
  to: MailAddress[];
  cc: MailAddress[];
  body: string;
  bodyFormat: "text" | "html";
  bodyTruncated: boolean;
  attachments: Array<{
    filename?: string | undefined;
    contentType: string;
    size: number;
  }>;
};

export type MailboxSummary = {
  path: string;
  name: string;
  specialUse?: string | undefined;
};

export type MailSearchOptions = {
  query?: string | undefined;
  field?: "all" | "subject" | "from" | "to" | "body";
  from?: string | undefined;
  to?: string | undefined;
  since?: string | undefined;
  before?: string | undefined;
  scope?: "inbox" | "all";
  limit?: number;
};
