<p align="right">
  <a href="README.md">English</a> | <strong>한국어</strong>
</p>

# IMAP Mail MCP

Naver, Daum, Kakao Mail을 IMAP으로 검색하고 조회할 수 있는 Codex 및 Claude Code용 로컬 MCP 서버입니다.

## 설치

1. 이 저장소를 다운로드하거나 clone한 뒤 `npm ci`를 실행합니다.
2. 메일 제공자의 웹 설정에서 IMAP과 2단계 인증을 활성화하고 앱 비밀번호를 생성합니다.
3. 터미널에서 `npm run setup`을 실행합니다. Naver, Daum, Kakao 중 하나를 선택한 뒤 메일 주소와 앱 비밀번호를 한 번 입력합니다. setup은 자격 증명을 로컬 `.env`에 저장하고 IMAP 연결을 검증한 다음, Codex와 Claude Code를 탐지해 설치된 모든 클라이언트에 MCP 서버를 등록합니다.
4. 등록된 클라이언트를 다시 시작하고 `naver-mail` 항목과 메일 도구가 표시되는지 확인합니다. Codex에서는 `/mcp`로 확인할 수 있습니다. 등록 이름은 호환성을 위해 유지되며 서버 자체는 세 제공자를 모두 지원합니다.

제공자별 안내: [Naver IMAP 설정](https://help.naver.com/service/30029/contents/21344?osType=COMMONOS), [Daum IMAP 설정](https://cs.daum.net/faq/service/43/category/9234/detail/24081), [Daum/Kakao 앱 비밀번호](https://cs.daum.net/m/faq/site/43/cat/9234/faq/33671). 이 제공자들은 IMAP 접속에 앱 비밀번호가 필요하므로 로컬 setup에서 한 번 입력받습니다.

다른 계정을 나중에 추가하려면 `npm run setup -- --provider daum` 또는 `npm run setup -- --provider kakao`를 실행합니다. 기존 계정의 자격 증명은 재사용됩니다. setup은 앱 비밀번호를 터미널 출력에 표시하지 않으며 `.env`를 소유자 전용 권한으로 저장합니다. 등록 대상을 선택하려면 `--client all`(기본값), `--client codex`, `--client claude`를 사용합니다. 동일한 등록은 생략하고 설정이 달라진 등록은 갱신합니다. `npm run setup -- --dry-run`으로 파일이나 설정을 변경하지 않고 탐지 결과와 등록 계획을 확인할 수 있습니다. IMAP 서버에 일시적으로 접속할 수 없다면 `npm run setup -- --skip-connection-test`로 연결 검사만 생략할 수 있습니다.

등록 설정에는 현재 checkout의 절대 경로가 저장되며 등록후에는 프로젝트 위치를 유지하여야합니다. `.env`는 Git에서 제외됩니다. 이전 버전의 `NAVER_IMTP_PASSWORD` 환경 변수도 호환성을 위해 읽지만, 새로운 setup은 `NAVER_IMAP_PASSWORD`를 사용합니다.

## 메일 검색

`search-mail` 도구는 일반 메일 검색창과 비슷하게 `query`를 받습니다. 기본적으로 Naver `INBOX`에서 메일 헤더와 본문을 검색하고 최신 요약을 최대 50개 반환합니다.

- `provider`: `naver`(기본값), `daum`, `kakao` 중 하나입니다. 선택한 계정이 `.env`에 설정되어 있어야 합니다.
- `field`: `all`(기본값), `subject`, `from`, `to`, `body` 중 검색할 영역을 선택합니다.
- `from`, `to`: 발신자와 수신자 조건을 추가합니다.
- `since`, `before`: `YYYY-MM-DD` 형식의 수신 날짜 범위입니다. `before` 날짜는 포함하지 않습니다.
- `scope`: `inbox`(기본값) 또는 선택 가능한 모든 폴더를 뜻하는 `all`입니다.
- `limit`: 1~100개의 결과를 반환합니다. 각 결과에는 메일을 식별하는 `provider`, `mailbox`, 폴더별 `uid`가 포함됩니다.

`query` 또는 검색 조건을 하나 이상 전달해야 합니다.
예를 들어 `{ "query": "회의", "field": "subject", "from": "example@naver.com", "scope": "all" }`은 모든 폴더에서 제목에 `회의`가 들어가고 지정한 발신자가 보낸 메일을 검색합니다.

`get-latest-mail`도 `provider`를 받을 수 있으며 기본값은 Naver입니다. 사용할 계정마다 IMAP을 활성화하고, 제공자가 요구하는 경우 앱 비밀번호를 사용하세요.

## 메일 읽기

모든 도구의 기본 계정은 Naver입니다. 검색 결과와 최근 메일 목록에는 `provider`, `mailbox`, `uid`가 포함되며, 특정 메일을 읽을 때 이 값을 사용합니다.

- `get-recent-mails`: 지정한 메일함의 최신 요약을 최대 100개 반환합니다. 기본 메일함은 `INBOX`입니다.
- `list-mailboxes`: 선택 가능한 메일함 경로를 반환합니다.
- `read-mail`: `mailbox`와 `uid`로 메일 한 건을 읽고 발신자, 수신자, 본문, 첨부파일 메타데이터를 반환합니다.
- `batch-read-mail`: 같은 메일함에서 최대 10개의 UID를 입력 순서대로 읽습니다. 찾을 수 없는 메일은 `null`로 반환됩니다.

읽기 도구는 첨부파일 내용 자체를 반환하지 않습니다. 10MB를 초과하는 메일은 읽기를 거부하며, 표시할 본문은 50,000자에서 잘라내고 `bodyTruncated`에 잘림 여부를 표시합니다.
