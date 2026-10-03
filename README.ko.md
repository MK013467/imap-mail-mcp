<p align="right">
  <a href="README.md">English</a> | <strong>한국어</strong>
</p>

# IMAP Mail MCP

[![npm version](https://img.shields.io/npm/v/imap-mail-mcp.svg)](https://www.npmjs.com/package/imap-mail-mcp)

Naver, Daum, Kakao Mail을 지원하는 읽기 전용 MCP 서버입니다. Codex와 Claude Code에서 사용할 수 있습니다.

## 도구

| 도구               | 설명                                       |
| ------------------ | ------------------------------------------ |
| `search-mail`      | 키워드, 발신자, 수신자, 날짜로 검색합니다. |
| `get-latest-mail`  | 가장 최근 메일을 가져옵니다.               |
| `get-recent-mails` | 최근 메일 요약을 조회합니다.               |
| `list-mailboxes`   | 사용할 수 있는 메일함을 조회합니다.        |
| `read-mail`        | 메일함과 UID로 메일 한 건을 읽습니다.      |
| `batch-read-mail`  | 같은 메일함에서 최대 10건을 읽습니다.      |

모든 도구에서 `naver`, `daum`, `kakao`를 선택할 수 있습니다. 기본 제공자는 Naver입니다.

## 설치

요구 사항:

- Node.js 20 이상
- 메일 계정의 IMAP 활성화
- 앱 비밀번호

제공자별 설정: [Naver](https://help.naver.com/service/30029/contents/21344?osType=COMMONOS) · [Daum](https://cs.daum.net/faq/service/43/category/9234/detail/24081) · [Daum/Kakao 앱 비밀번호](https://cs.daum.net/m/faq/site/43/cat/9234/faq/33671)

실행:

```bash
npx -y imap-mail-mcp setup
```

메일 제공자, 주소, 앱 비밀번호를 입력합니다. 비밀번호는 `*`로 표시됩니다. 계정 정보는 `~/.imap-mail-mcp/.env`에 저장되며 파일 권한은 소유자 전용으로 설정됩니다.

IMAP 연결을 확인한 뒤 Codex, Claude Code 또는 둘 다에 `naver-mail`을 등록합니다. 등록 후 클라이언트를 다시 시작하세요. Codex에서는 `/mcp`로 확인할 수 있습니다.

## 옵션

| 옵션                              | 설명                                                |
| --------------------------------- | --------------------------------------------------- |
| `--provider <naver, daum, kakao>` | 제공자 하나를 설정합니다.                           |
| `--client <all, codex, claude>`   | 등록할 클라이언트를 고릅니다. 기본값은 `all`입니다. |
| `--dry-run`                       | 설정을 바꾸지 않고 등록 예정 내용을 출력합니다.     |
| `--skip-connection-test`          | IMAP 연결 검사를 생략합니다.                        |

다른 제공자 추가:

```bash
npx -y imap-mail-mcp setup --provider daum
```

저장된 계정 정보는 재사용됩니다. 바꾸려면 `~/.imap-mail-mcp/.env`를 수정한 뒤 setup을 다시 실행하세요.

등록되는 서버 명령:

```bash
npx --yes imap-mail-mcp serve
```

`npx`에서 사용할 수 있는 최신 배포 버전을 실행합니다.

## 동작 확인

클라이언트를 다시 시작한 뒤 다음과 같이 요청합니다:

```text
네이버 메일함 목록을 보여줘.
네이버 받은메일함의 최근 메일 3개를 보여줘.
알고 있는 발신자의 메일을 검색하고 첫 번째 결과를 읽어줘.
```

## 개발

```bash
git clone https://github.com/MK013467/imap-mail-mcp.git
cd imap-mail-mcp
npm ci
npm run setup:local
```

`setup:local`은 로컬 TypeScript 진입점을 절대 경로로 등록합니다. 등록 후에는 checkout 위치를 바꾸지 마세요.

```bash
npm test
npm run typecheck
npm run format:check
npm run build
```

## 제한 사항

- 메일 검색과 읽기만 지원합니다. 발송, 이동, 삭제는 지원하지 않습니다.
- 첨부파일 메타데이터만 반환하며 파일 내용은 반환하지 않습니다.
- 10MB를 초과하는 메일은 읽지 않습니다.
- 본문은 50,000자까지 반환합니다.

이전 변수명인 `NAVER_IMTP_PASSWORD`도 읽을 수 있습니다. 새 setup은 `NAVER_IMAP_PASSWORD`를 사용합니다. 계정 파일 위치를 바꾸려면 `IMAP_MAIL_MCP_ENV_FILE`을 설정하세요.

## 라이센스
MIT