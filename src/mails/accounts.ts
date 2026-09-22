import { IMAP_HOSTS, type MailProvider } from "./types.js";

export type ImapAccount = {
  provider: MailProvider;
  host: string;
  user: string;
  password: string;
};

export function getImapAccount(provider: MailProvider): ImapAccount {
  const prefix = provider.toUpperCase();
  const user = process.env[`${prefix}_EMAIL`];
  const password =
    process.env[`${prefix}_IMAP_PASSWORD`] ??
    (provider === "naver" ? process.env.NAVER_IMTP_PASSWORD : undefined);

  if (!user || !password) {
    throw new Error(
      `Missing ${prefix}_EMAIL or ${prefix}_IMAP_PASSWORD in .env`,
    );
  }

  return { provider, host: IMAP_HOSTS[provider], user, password };
}
