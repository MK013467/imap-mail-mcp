# Mail Assistant skill development

## Source of truth

[`SKILL.md`](./SKILL.md) is the single source of truth for the Mail Assistant
skill. Update that file when the skill's description, setup guidance, tool
workflow, or safety rules change. Do not maintain a second copy elsewhere in
this repository.

The skill instructions alone do not configure a mail account or register the
MCP server. A fresh clone becomes usable only after its dependencies are
installed and setup completes successfully:

```sh
npm ci
npm run setup
```

Use `npm run setup`; `npx run setup` is not an npm package-script command.

## What setup creates or changes

When `npm run setup` succeeds, it creates or updates the following local state:

- `<repository>/.env`: stores the selected provider's email address and IMAP
  app password. The file is local, ignored by Git, and restricted to the
  current user with mode `0600`.
- Each detected client's MCP configuration: adds or updates the `naver-mail`
  server entry that launches this repository's `src/index.ts` through its
  local `tsx` binary. Matching registrations are left unchanged. Codex uses
  its user MCP configuration and Claude Code uses `~/.claude.json`.

The setup command also verifies the selected Naver, Daum, or Kakao IMAP
connection before registering the server. It does not generate or overwrite
`skills/mail-assistant/SKILL.md`; that checked-in file remains the canonical
skill definition.

Setup targets every installed client by default. A developer can restrict it
to one client:

```sh
npm run setup -- --client all
npm run setup -- --client codex
npm run setup -- --client claude
```

After setup, restart each registered client and confirm that `naver-mail` is
available.
