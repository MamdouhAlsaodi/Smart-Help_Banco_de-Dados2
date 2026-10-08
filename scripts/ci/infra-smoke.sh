#!/usr/bin/env bash
set -euo pipefail

# CI-only, synthetic database; refuse a project already used by another job.
if [[ "${GITHUB_ACTIONS:-}" != "true" || -z "${GITHUB_RUN_ID:-}" || -z "${RUNNER_TEMP:-}" ]]; then
  printf 'infra smoke runs only on an isolated GitHub Actions runner\n' >&2
  exit 1
fi

project="smarthelp-ci-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT:-1}"
envfile="$(mktemp "${RUNNER_TEMP}/smarthelp-env.XXXXXX")"
chmod 600 "$envfile"
compose=(docker compose --env-file "$envfile" --project-name "$project")
created=0
cleanup() {
  if [[ "$created" == 1 ]]; then
    "${compose[@]}" down --volumes --remove-orphans || true
  fi
  rm -f "$envfile"
}
trap cleanup EXIT

python3 - "$envfile" <<'PY'
import secrets
import sys

with open(sys.argv[1], 'w', encoding='utf-8') as handle:
    handle.write('POSTGRES_USER=smarthelp_ci\nPOSTGRES_DB=smarthelp_ci\n')
    handle.write(f'POSTGRES_PASSWORD={secrets.token_urlsafe(32)}\n')
    handle.write('PGADMIN_DEFAULT_EMAIL=ci@smarthelp.dev\n')
    handle.write(f'PGADMIN_DEFAULT_PASSWORD={secrets.token_urlsafe(32)}\n')
PY

if [[ -n "$("${compose[@]}" ps --all --quiet)" ]]; then
  printf 'refusing to reuse an existing Compose project\n' >&2
  exit 1
fi
"${compose[@]}" config --quiet
created=1
"${compose[@]}" up --detach --wait
"${compose[@]}" exec --no-TTY postgres pg_isready -U smarthelp_ci -d smarthelp_ci

ready=0
for attempt in {1..30}; do
  if curl --noproxy '*' --fail --silent --location --max-time 3 --output /dev/null http://127.0.0.1:5050/; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "$ready" != 1 ]]; then
  status="$(curl --noproxy '*' --silent --max-time 3 --output /dev/null --write-out '%{http_code}' http://127.0.0.1:5050/ || true)"
  printf 'pgAdmin did not answer HTTP on loopback (last status: %s)\n' "$status" >&2
  "${compose[@]}" ps --all >&2
  "${compose[@]}" logs --no-color --tail 40 pgadmin 2>&1 | python3 -c 'import re,sys
for line in sys.stdin:
    if re.search(r"password|token|secret|credential|postgresql://", line, re.I):
        print("[pgAdmin diagnostic redacted]")
    else:
        print(line.rstrip())' >&2
  exit 1
fi

"${compose[@]}" exec --no-TTY postgres psql -v ON_ERROR_STOP=1 -U smarthelp_ci -d smarthelp_ci -c 'CREATE TABLE ci_volume_probe (value integer NOT NULL); INSERT INTO ci_volume_probe VALUES (1);' >/dev/null
"${compose[@]}" down
"${compose[@]}" up --detach --wait
value="$("${compose[@]}" exec --no-TTY postgres psql -v ON_ERROR_STOP=1 -U smarthelp_ci -d smarthelp_ci -Atqc 'SELECT value FROM ci_volume_probe;')"
if [[ "$value" != 1 ]]; then
  printf 'PostgreSQL volume did not retain the synthetic row\n' >&2
  exit 1
fi
printf 'CI synthetic PostgreSQL, pgAdmin HTTP and volume-restart checks passed\n'
