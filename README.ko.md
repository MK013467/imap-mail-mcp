<p align="right">
  <a href="README.md">English</a> | <strong>한국어</strong>
</p>

# IMAP Mail MCP

[![npm version](https://img.shields.io/npm/v/imap-mail-mcp.svg)](https://www.npmjs.com/package/imap-mail-mcp)

Naver, Daum, Kakao Mail을 지원하는 읽기 전용 MCP 서버. Codex와 Claude Code 지원.

## 도구

| 도구               | 설명                              |
| ------------------ | --------------------------------- |
| `search-mail`      | 키워드, 발신자, 수신자, 날짜 검색 |
| `get-latest-mail`  | 가장 최근 메일 조회               |
| `get-recent-mails` | 최근 메일 요약 조회               |
| `list-mailboxes`   | 사용 가능한 메일함 조회           |
| `read-mail`        | 메일함과 UID로 메일 한 건 읽기    |
| `batch-read-mail`  | 같은 메일함에서 최대 10건 읽기    |

모든 도구에서 `naver`, `daum`, `kakao` 선택 가능. 기본 제공자는 Naver.

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

메일 제공자, 주소, 앱 비밀번호 입력. 비밀번호는 `*`로 표시. 계정 정보는 `~/.imap-mail-mcp/.env`에 저장하며 파일 권한은 소유자 전용으로 설정.

IMAP 연결 확인 후 Codex, Claude Code 또는 둘 다에 `naver-mail` 등록. 등록 후 클라이언트 재시작 필요. Codex에서는 `/mcp`로 확인 가능.

## 옵션

| 옵션                              | 설명                                   |
| --------------------------------- | -------------------------------------- |
| `--provider <naver, daum, kakao>` | 제공자 하나 설정                       |
| `--client <all, codex, claude>`   | 등록할 클라이언트 선택. 기본값은 `all` |
| `--dry-run`                       | 설정 변경 없이 등록 예정 내용 출력     |
| `--skip-connection-test`          | IMAP 연결 검사 생략                    |

다른 제공자 추가:

```bash
npx -y imap-mail-mcp setup --provider daum
```

저장된 계정 정보 재사용. 변경 시 `~/.imap-mail-mcp/.env` 수정 후 setup 재실행.

등록되는 서버 명령:

```bash
npx --yes imap-mail-mcp serve
```

`npx`에서 사용할 수 있는 최신 배포 버전 실행.

## 동작 확인

클라이언트 재시작 후 다음 요청으로 확인:

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

`setup:local`은 로컬 TypeScript 진입점을 절대 경로로 등록. 등록 후 checkout 위치 유지 필요.

```bash
npm test
npm run typecheck
npm run format:check
npm run build
```

## 제한 사항

- 메일 검색 및 읽기 지원. 발송, 이동, 삭제 미지원
- 첨부파일 메타데이터만 반환. 파일 내용 미지원
- 10MB 초과 메일 읽기 거부
- 본문 최대 50,000자 반환

이전 변수명 `NAVER_IMTP_PASSWORD`도 지원. 새 setup은 `NAVER_IMAP_PASSWORD` 사용. 계정 파일 위치 변경 시 `IMAP_MAIL_MCP_ENV_FILE` 설정.

## 라이선스

MIT
