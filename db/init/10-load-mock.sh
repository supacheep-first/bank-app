#!/bin/bash
# Runs as a subprocess, not sourced: the entrypoint tests -x and Docker Desktop bind mounts report true for root.
set -eo pipefail

mock_tables="account_balances account_details account_flags accounts banners
  debit_card_design debit_card_details debit_card_status debit_cards
  transactions user_greetings users"

missing=
for name in $mock_tables; do
  [ -f "/mock/$name.sql" ] || missing="$missing $name.sql"
done
if [ -n "$missing" ]; then
  echo "ERROR: missing mock files in /mock:$missing" >&2
  exit 1
fi

for name in $mock_tables; do
  echo "loading mock $name"
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --protocol=socket -uroot --socket=/var/run/mysqld/mysqld.sock \
    --database="$MYSQL_DATABASE" --comments < "/mock/$name.sql"
done
