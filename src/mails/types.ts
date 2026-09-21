const IMAP_HOSTS = {
  naver: "imap.naver.com",
  daum: "imap.daum.net",
  icloud: "imap.mail.me.com",
} as const;

export type MailClient = keyof typeof IMAP_HOSTS;

export type ImapHost = (typeof IMAP_HOSTS)[MailClient];
