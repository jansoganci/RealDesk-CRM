#!/usr/bin/env bash
# Salt okunur: eski Supabase projesinden şema dökümü alır, migration dosyası yazar.
#
# En güvenilir yöntem — Dashboard’tan URI yapıştır:
#   Supabase → Project → Settings → Database → Connection string → "Session pooler" (URI)
#   Şifreyi yerine koy, tek satır:
#   export LEGACY_DATABASE_URL='postgresql://postgres.xxx:ŞİFRE@HOST:5432/postgres'
#   ./scripts/dump-legacy-supabase-schema.sh
#   (LEGACY_DB_PASSWORD gerekmez; URI içinde olur.)
#
# Veya şifreyi ayrı veriyorsan script aws-1 / aws-0 pooler’ları sırayla dener (Sydney).
#
# pg_dump: brew install libpq && export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LEGACY_PROJECT_REF="${LEGACY_PROJECT_REF:-jglxczzxliaiigccavnb}"
OUT="${OUT:-$ROOT/supabase/migrations/0001_baseline_from_legacy.sql}"
LEGACY_DB_MODE="${LEGACY_DB_MODE:-pooler}"

# Sydney bölgesi: Supabase bazen aws-1 pooler kullanır; "Tenant or user not found" genelde yanlış aws-0/1
DEFAULT_POOLER_HOSTS=(
  "aws-1-ap-southeast-2.pooler.supabase.com"
  "aws-0-ap-southeast-2.pooler.supabase.com"
)

if [[ -z "${LEGACY_DATABASE_URL:-}" ]] && [[ -z "${LEGACY_DB_PASSWORD:-}" ]]; then
  echo "LEGACY_DATABASE_URL veya LEGACY_DB_PASSWORD gerekli." >&2
  exit 1
fi

find_pg_dump() {
  if command -v pg_dump >/dev/null 2>&1; then
    command -v pg_dump
    return
  fi
  for candidate in \
    /opt/homebrew/opt/libpq/bin/pg_dump \
    /usr/local/opt/libpq/bin/pg_dump; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return
    fi
  done
  return 1
}

echo "Döküm alınıyor (salt okunur): ${LEGACY_PROJECT_REF} → ${OUT}"

PG_DUMP_BIN="$(find_pg_dump || true)"

run_pg_dump_uri() {
  local uri="$1"
  local rc
  export PGSSLMODE="${PGSSLMODE:-require}"
  "$PG_DUMP_BIN" \
    "$uri" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --schema=public \
    -f "$OUT"
  rc=$?
  return "$rc"
}

run_pg_dump_parts() {
  local host="$1"
  local port="$2"
  local user="$3"
  local rc
  export PGPASSWORD="$LEGACY_DB_PASSWORD"
  export PGSSLMODE="${PGSSLMODE:-require}"
  "$PG_DUMP_BIN" \
    -h "$host" \
    -p "$port" \
    -U "$user" \
    -d postgres \
    --schema-only \
    --no-owner \
    --no-privileges \
    --schema=public \
    -f "$OUT"
  rc=$?
  unset PGPASSWORD
  return "$rc"
}

if [[ -n "${PG_DUMP_BIN:-}" ]]; then
  echo "pg_dump kullanılıyor: ${PG_DUMP_BIN}"

  if [[ -n "${LEGACY_DATABASE_URL:-}" ]]; then
    echo "Bağlantı: LEGACY_DATABASE_URL (Dashboard Session pooler URI)"
    run_pg_dump_uri "$LEGACY_DATABASE_URL"
  elif [[ "$LEGACY_DB_MODE" == "direct" ]]; then
    echo "Bağlantı: direct db host"
    run_pg_dump_parts "db.${LEGACY_PROJECT_REF}.supabase.co" 5432 "postgres"
  else
    echo "Bağlantı: Session pooler — sırayla deneniyor (Tenant or user not found = yanlış pooler sunucusu)"
    if [[ -n "${LEGACY_POOLER_HOST:-}" ]]; then
      POOLER_HOSTS=("$LEGACY_POOLER_HOST")
    else
      POOLER_HOSTS=("${DEFAULT_POOLER_HOSTS[@]}")
    fi
    ok=0
    for host in "${POOLER_HOSTS[@]}"; do
      echo "  denenen host: ${host} …"
      if run_pg_dump_parts "$host" 5432 "postgres.${LEGACY_PROJECT_REF}"; then
        ok=1
        echo "  tamam: ${host}"
        break
      fi
      echo "  olmadı, sıradaki…"
    done
    if [[ "$ok" -ne 1 ]]; then
      echo "" >&2
      echo "Hepsi başarısız. Supabase Dashboard → Database → Connection string → Session pooler URI’yi kopyala," >&2
      echo "şifreyi yaz ve şunu export et:" >&2
      echo "  export LEGACY_DATABASE_URL='postgresql://postgres.${LEGACY_PROJECT_REF}:ŞİFRE@<HOST>:5432/postgres'" >&2
      exit 1
    fi
  fi
else
  echo "pg_dump yok. brew install libpq && PATH ekle." >&2
  exit 1
fi

# pg_dump 18+ bazen dosyaya sadece psql'in anladığı \\restrict / \\unrestrict yazar; SQL Editor hataya düşer.
strip_psql_meta_from_dump() {
  local f="$1"
  local t
  t="$(mktemp)"
  grep -v '^\\restrict ' "$f" | grep -v '^\\unrestrict ' > "$t" && mv "$t" "$f"
}

# Yeni Supabase projesinde public şeması zaten vardır; pg_dump'un CREATE SCHEMA public satırı 42P06 verir.
fix_create_schema_public() {
  local f="$1"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    sed -i '' 's/^CREATE SCHEMA public;$/CREATE SCHEMA IF NOT EXISTS public;/' "$f"
  else
    sed -i 's/^CREATE SCHEMA public;$/CREATE SCHEMA IF NOT EXISTS public;/' "$f"
  fi
}

strip_psql_meta_from_dump "$OUT"
fix_create_schema_public "$OUT"

if [[ ! -s "$OUT" ]]; then
  echo "Hata: dump dosyası boş veya yok — pg_dump aslında başarısız olmuş olabilir (önceki sürümde exit kodu yanlıştı)." >&2
  exit 1
fi

echo "Tamam: ${OUT}"
echo "Sonra: yeni projede uygula; ardından npm run gen:types"
