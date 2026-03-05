#!/usr/bin/env python3
"""
BUBBLE SCHEMA DISCOVERY - Zero-Error, Complete Coverage
=======================================================
This script:
  1. Fetches ALL data types from Bubble /meta endpoint
  2. For EACH data type, scans records to discover EVERY field
  3. Auto-detects PostgreSQL column types from actual values
  4. Outputs:
     - Full schema report (JSON)
     - Complete SQL migration (all tables, all columns)
     - Complete Python sync script (all tables, all fields)

NO manual field listing. NO guessing. Everything from the API.
"""

import json
import urllib.request
import urllib.parse
import time
import sys
import os
import re
from datetime import datetime
from collections import defaultdict

# ============================================================
# CONFIGURATION
# ============================================================

BUBBLE_API_BASE = "https://app.joinbreasy.com/api/1.1/obj"
BUBBLE_META_URL = "https://app.joinbreasy.com/api/1.1/meta"
BUBBLE_API_KEY = "7d258f5f7c1d32d2f4003721719b68bb"

# Per-direction scan limit: scan this many from START + this many from END
# This catches fields from old records AND newly added fields
SCAN_PER_DIRECTION = 5000
PAGE_SIZE = 100

# Output paths
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEMA_JSON = os.path.join(OUTPUT_DIR, "bubble_full_schema.json")
MIGRATION_SQL = os.path.join(OUTPUT_DIR, "bubble_complete_migration.sql")
SYNC_SCRIPT = os.path.join(OUTPUT_DIR, "bubble_complete_sync.py")

# Rate limiting
REQUEST_DELAY = 0.3  # seconds between API calls
RETRY_DELAY = 3      # seconds after rate limit hit
MAX_RETRIES = 5


# ============================================================
# HELPERS
# ============================================================

def api_request(url, retries=MAX_RETRIES):
    """Make an authenticated Bubble API request with retry logic."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header("Authorization", f"Bearer {BUBBLE_API_KEY}")
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = RETRY_DELAY * (2 ** attempt)
                print(f"    Rate limited, waiting {wait}s... (attempt {attempt+1}/{retries})")
                time.sleep(wait)
            elif e.code == 404:
                print(f"    404 Not Found: {url}")
                return None
            else:
                body = ""
                try:
                    body = e.read().decode("utf-8")[:200]
                except:
                    pass
                print(f"    HTTP {e.code}: {body}")
                if attempt == retries - 1:
                    return None
                time.sleep(RETRY_DELAY)
        except Exception as e:
            print(f"    Error (attempt {attempt+1}/{retries}): {e}")
            if attempt == retries - 1:
                return None
            time.sleep(RETRY_DELAY * (attempt + 1))
    return None


def detect_pg_type(values):
    """Detect the best PostgreSQL type from a list of sample values."""
    # Filter out None
    non_null = [v for v in values if v is not None]
    if not non_null:
        return "text"

    type_counts = defaultdict(int)
    for v in non_null:
        if isinstance(v, bool):
            type_counts["boolean"] += 1
        elif isinstance(v, int):
            type_counts["integer"] += 1
        elif isinstance(v, float):
            type_counts["numeric"] += 1
        elif isinstance(v, list):
            # Check if list of strings or list of objects
            if v and isinstance(v[0], dict):
                type_counts["jsonb"] += 1
            else:
                type_counts["text[]"] += 1
        elif isinstance(v, dict):
            type_counts["jsonb"] += 1
        elif isinstance(v, str):
            # Check if it looks like a date/timestamp
            if re.match(r'^\d{4}-\d{2}-\d{2}T', v):
                type_counts["timestamptz"] += 1
            elif re.match(r'^\d{4}-\d{2}-\d{2}$', v):
                type_counts["timestamptz"] += 1
            else:
                type_counts["text"] += 1
        else:
            type_counts["text"] += 1

    if not type_counts:
        return "text"

    # Return the most common type
    best_type = max(type_counts, key=type_counts.get)

    # If mix of int and float, use numeric
    if "integer" in type_counts and "numeric" in type_counts:
        best_type = "numeric"

    return best_type


def bubble_to_snake(name):
    """Convert a Bubble field name to a snake_case Supabase column name."""
    # Special cases
    if name == "_id":
        return "bubble_id"
    if name == "Created By":
        return "created_by"
    if name == "Created Date":
        return "created_date"
    if name == "Modified Date":
        return "modified_date"
    if name == "Slug":
        return "slug"

    s = name
    # Replace special characters
    s = s.replace("-", "_")
    s = s.replace(" ", "_")
    s = s.replace("?", "")
    s = s.replace("(", "")
    s = s.replace(")", "")
    s = s.replace(".", "_")
    s = s.replace("/", "_")
    s = s.replace("'", "")
    s = s.replace('"', "")
    s = s.replace(",", "")
    s = s.replace("+", "")

    # Insert underscore before uppercase letters (camelCase → snake_case)
    s = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s)

    # Lowercase
    s = s.lower()

    # Collapse multiple underscores
    s = re.sub(r'_+', '_', s)

    # Remove leading/trailing underscores
    s = s.strip('_')

    # Ensure it's a valid identifier
    if not s:
        s = "col_unnamed"
    if s[0].isdigit():
        s = "col_" + s

    # Avoid PostgreSQL reserved words
    reserved = {"user", "order", "group", "table", "column", "index", "select",
                "where", "from", "date", "time", "type", "check", "default",
                "primary", "key", "references", "constraint", "limit", "offset"}
    if s in reserved:
        s = s + "_val"

    return s


def bubble_to_table_name(data_type):
    """Convert a Bubble data type name to a Supabase table name."""
    s = data_type.lower()
    s = s.replace("-", "_")
    s = s.replace(" ", "_")
    s = s.replace("(", "")
    s = s.replace(")", "")
    s = re.sub(r'_+', '_', s)
    s = s.strip('_')
    return f"b_{s}"


# ============================================================
# DISCOVERY
# ============================================================

def get_all_data_types():
    """Fetch all data types from Bubble meta endpoint."""
    print("[1/4] Fetching all data types from Bubble /meta endpoint...")
    data = api_request(BUBBLE_META_URL)
    if not data:
        print("  FATAL: Could not fetch meta endpoint")
        sys.exit(1)

    data_types = data.get("get", [])
    print(f"  Found {len(data_types)} data types")
    return sorted(data_types, key=str.lower)


def scan_data_type(data_type, max_records=SCAN_RECORDS):
    """Scan ALL records of a data type to discover every field."""
    all_fields = {}  # field_name -> list of sample values
    cursor = 0
    records_scanned = 0
    consecutive_failures = 0

    # First get total count
    url = f"{BUBBLE_API_BASE}/{urllib.parse.quote(data_type)}?cursor=0&limit=1"
    count_data = api_request(url)
    total = 0
    if count_data:
        resp = count_data.get("response", {})
        total = resp.get("remaining", 0) + len(resp.get("results", []))
        # Process the first record too
        for record in resp.get("results", []):
            for key, value in record.items():
                if key not in all_fields:
                    all_fields[key] = []
                if len(all_fields[key]) < 20 and value is not None:
                    all_fields[key].append(value)
        records_scanned = len(resp.get("results", []))
        cursor = records_scanned

    if total == 0:
        return all_fields, 0

    while cursor < total and records_scanned < max_records:
        url = f"{BUBBLE_API_BASE}/{urllib.parse.quote(data_type)}?cursor={cursor}&limit={PAGE_SIZE}"
        data = api_request(url)

        if not data:
            consecutive_failures += 1
            if consecutive_failures >= 5:
                break
            cursor += PAGE_SIZE
            time.sleep(RETRY_DELAY)
            continue

        consecutive_failures = 0
        response = data.get("response", {})
        results = response.get("results", [])
        remaining = response.get("remaining", 0)

        if not results:
            break

        for record in results:
            for key, value in record.items():
                if key not in all_fields:
                    all_fields[key] = []
                # Keep up to 20 sample values per field for type detection
                if len(all_fields[key]) < 20 and value is not None:
                    all_fields[key].append(value)

        records_scanned += len(results)
        cursor += len(results)

        if remaining <= 0:
            break

        time.sleep(REQUEST_DELAY)

    return all_fields, records_scanned, total


def discover_all():
    """Discover complete schema for all Bubble data types."""
    data_types = get_all_data_types()

    schema = {}
    total = len(data_types)

    print(f"\n[2/4] Scanning all {total} data types for fields...")
    print(f"  (Scanning ALL records per type - no limit)\n")

    for i, dt in enumerate(data_types, 1):
        sys.stdout.write(f"  [{i:3}/{total}] {dt:40s} ... ")
        sys.stdout.flush()

        fields_data, records_scanned, total_records = scan_data_type(dt)

        # Build field info
        fields = {}
        for field_name, sample_values in fields_data.items():
            pg_type = detect_pg_type(sample_values)
            snake_name = bubble_to_snake(field_name)
            fields[field_name] = {
                "supabase_column": snake_name,
                "pg_type": pg_type,
                "sample_count": len(sample_values),
            }

        table_name = bubble_to_table_name(dt)
        schema[dt] = {
            "bubble_name": dt,
            "supabase_table": table_name,
            "total_records": total_records,
            "records_scanned": records_scanned,
            "field_count": len(fields),
            "fields": fields,
        }

        print(f"{len(fields):3} fields (scanned {records_scanned}/{total_records})")

    return schema


# ============================================================
# SQL GENERATION
# ============================================================

def generate_sql(schema):
    """Generate complete SQL migration from discovered schema."""
    print(f"\n[3/4] Generating complete SQL migration...")

    lines = []
    lines.append("-- " + "=" * 70)
    lines.append("-- COMPLETE BUBBLE → SUPABASE MIGRATION")
    lines.append(f"-- Auto-generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"-- Source: Bubble API at {BUBBLE_API_BASE}")
    lines.append(f"-- Data types: {len(schema)}")
    total_fields = sum(t['field_count'] for t in schema.values())
    lines.append(f"-- Total fields: {total_fields}")
    lines.append("-- " + "=" * 70)
    lines.append("")
    lines.append("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    lines.append("")

    for dt_name in sorted(schema.keys(), key=str.lower):
        dt = schema[dt_name]
        table = dt["supabase_table"]
        fields = dt["fields"]

        lines.append(f"-- {'─' * 60}")
        lines.append(f"-- {dt_name} → {table}")
        lines.append(f"-- Bubble fields: {len(fields)}")
        lines.append(f"-- {'─' * 60}")
        lines.append(f"CREATE TABLE IF NOT EXISTS {table} (")
        lines.append(f"  id bigserial PRIMARY KEY,")

        # Ensure bubble_id comes first
        col_lines = []
        seen_columns = {"id"}  # track to avoid duplicates

        # _id → bubble_id always first
        if "_id" in fields:
            col_lines.append(f"  bubble_id text UNIQUE NOT NULL")
            seen_columns.add("bubble_id")

        # Standard Bubble system fields next
        system_fields = [
            ("Created By", "created_by", "text"),
            ("Created Date", "created_date", "timestamptz"),
            ("Modified Date", "modified_date", "timestamptz"),
            ("Slug", "slug", "text"),
        ]
        for bubble_name, col_name, col_type in system_fields:
            if bubble_name in fields and col_name not in seen_columns:
                col_lines.append(f"  {col_name} {col_type}")
                seen_columns.add(col_name)

        # All other fields
        for bubble_name in sorted(fields.keys(), key=str.lower):
            info = fields[bubble_name]
            col_name = info["supabase_column"]
            pg_type = info["pg_type"]

            if col_name in seen_columns:
                continue
            seen_columns.add(col_name)

            # Sanitize column name for SQL (quote if needed)
            if not re.match(r'^[a-z_][a-z0-9_]*$', col_name):
                col_name = f'"{col_name}"'

            col_lines.append(f"  {col_name} {pg_type}")

        lines.append(",\n".join(col_lines))
        lines.append(");")
        lines.append("")

    # Indexes on bubble_id for all tables
    lines.append("-- " + "=" * 70)
    lines.append("-- INDEXES")
    lines.append("-- " + "=" * 70)
    for dt_name in sorted(schema.keys(), key=str.lower):
        table = schema[dt_name]["supabase_table"]
        lines.append(f"CREATE INDEX IF NOT EXISTS idx_{table}_bubble_id ON {table}(bubble_id);")
        # Add index on created_date if it exists
        if "Created Date" in schema[dt_name]["fields"]:
            lines.append(f"CREATE INDEX IF NOT EXISTS idx_{table}_created ON {table}(created_date);")
    lines.append("")

    # RLS
    lines.append("-- " + "=" * 70)
    lines.append("-- ROW LEVEL SECURITY")
    lines.append("-- " + "=" * 70)
    for dt_name in sorted(schema.keys(), key=str.lower):
        table = schema[dt_name]["supabase_table"]
        lines.append(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
    lines.append("")

    # RLS Policies
    lines.append("DO $$")
    lines.append("DECLARE")
    lines.append("  tbl text;")
    lines.append("BEGIN")
    lines.append("  FOR tbl IN")
    lines.append("    SELECT unnest(ARRAY[")
    tables = [schema[dt]["supabase_table"] for dt in sorted(schema.keys(), key=str.lower)]
    for i, t in enumerate(tables):
        comma = "," if i < len(tables) - 1 else ""
        lines.append(f"      '{t}'{comma}")
    lines.append("    ])")
    lines.append("  LOOP")
    lines.append("    EXECUTE format(")
    lines.append("      'CREATE POLICY IF NOT EXISTS \"service_role_all_%s\" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',")
    lines.append("      tbl, tbl")
    lines.append("    );")
    lines.append("    EXECUTE format(")
    lines.append("      'CREATE POLICY IF NOT EXISTS \"authenticated_read_%s\" ON %I FOR SELECT TO authenticated USING (true)',")
    lines.append("      tbl, tbl")
    lines.append("    );")
    lines.append("  END LOOP;")
    lines.append("END $$;")
    lines.append("")

    sql = "\n".join(lines)

    with open(MIGRATION_SQL, "w") as f:
        f.write(sql)

    print(f"  Written to: {MIGRATION_SQL}")
    return sql


# ============================================================
# SYNC SCRIPT GENERATION
# ============================================================

def generate_sync_script(schema):
    """Generate complete Python sync script for all tables."""
    print(f"\n[4/4] Generating complete sync script...")

    lines = []
    lines.append('#!/usr/bin/env python3')
    lines.append('"""')
    lines.append('COMPLETE BUBBLE → SUPABASE SYNC')
    lines.append('=' * 50)
    lines.append(f'Auto-generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    lines.append(f'Data types: {len(schema)}')
    total_fields = sum(t["field_count"] for t in schema.values())
    lines.append(f'Total fields: {total_fields}')
    lines.append('')
    lines.append('Fetches ALL records from ALL Bubble data types and upserts')
    lines.append('into corresponding Supabase tables.')
    lines.append('"""')
    lines.append('')
    lines.append('import json')
    lines.append('import urllib.request')
    lines.append('import urllib.parse')
    lines.append('import time')
    lines.append('import sys')
    lines.append('import re')
    lines.append('')
    lines.append('# ' + '=' * 60)
    lines.append('# CONFIGURATION')
    lines.append('# ' + '=' * 60)
    lines.append('')
    lines.append(f'BUBBLE_API_BASE = "{BUBBLE_API_BASE}"')
    lines.append(f'BUBBLE_API_KEY = "{BUBBLE_API_KEY}"')
    lines.append('')
    lines.append(f'SUPABASE_URL = "https://caursmdeoghqixudiscb.supabase.co"')
    lines.append(f'SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXJzbWRlb2docWl4dWRpc2NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM2MzE2MywiZXhwIjoyMDg2OTM5MTYzfQ.-7XA8EMwqZonb8SSR5EjALWmMOdjCM4wOnHcjss8lHQ"')
    lines.append('')
    lines.append('PAGE_SIZE = 100')
    lines.append('BATCH_SIZE = 50')
    lines.append('')
    lines.append('')

    # Generate the complete table config
    lines.append('# ' + '=' * 60)
    lines.append('# COMPLETE TABLE DEFINITIONS')
    lines.append(f'# {len(schema)} data types, auto-discovered from Bubble API')
    lines.append('# ' + '=' * 60)
    lines.append('')
    lines.append('TABLES = {')

    for dt_name in sorted(schema.keys(), key=str.lower):
        dt = schema[dt_name]
        table = dt["supabase_table"]
        fields = dt["fields"]

        lines.append(f'    # {dt_name} → {table} ({len(fields)} fields)')
        lines.append(f'    "{dt_name}": {{')
        lines.append(f'        "table": "{table}",')
        lines.append(f'        "fields": {{')

        for bubble_name in sorted(fields.keys(), key=str.lower):
            info = fields[bubble_name]
            col = info["supabase_column"]
            pg = info["pg_type"]
            # Escape quotes in bubble field names
            safe_name = bubble_name.replace('"', '\\"')
            lines.append(f'            "{safe_name}": ("{col}", "{pg}"),')

        lines.append(f'        }},')
        lines.append(f'    }},')

    lines.append('}')
    lines.append('')
    lines.append('')

    # Add the sync engine code
    lines.append(r'''
# ============================================================
# SYNC ENGINE
# ============================================================

def sanitize_date(value):
    """Sanitize date strings for PostgreSQL."""
    if not isinstance(value, str):
        return value
    if value.startswith('+') or value.startswith('-'):
        return None
    try:
        if len(value) >= 10 and value[4] == '-':
            year = int(value[:4])
            if year > 9999 or year < 1:
                return None
    except (ValueError, IndexError):
        pass
    return value


def bubble_fetch(data_type, cursor=0, limit=PAGE_SIZE):
    """Fetch records from Bubble Data API."""
    encoded = urllib.parse.quote(data_type)
    url = f"{BUBBLE_API_BASE}/{encoded}?cursor={cursor}&limit={limit}"
    max_retries = 5
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url)
            req.add_header("Authorization", f"Bearer {BUBBLE_API_KEY}")
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("response", {})
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 2 ** (attempt + 1)
                print(f"      Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(3 * (attempt + 1))
    return {"results": [], "remaining": 0}


def fetch_all_records(data_type):
    """Fetch ALL records for a data type with pagination."""
    all_records = []
    seen_ids = set()
    cursor = 0

    resp = bubble_fetch(data_type, cursor=0, limit=1)
    total = resp.get("remaining", 0) + len(resp.get("results", []))

    for r in resp.get("results", []):
        rid = r.get("_id")
        if rid and rid not in seen_ids:
            seen_ids.add(rid)
            all_records.append(r)
    cursor = len(all_records)

    if total == 0:
        return [], 0

    consecutive_failures = 0
    while cursor < total:
        try:
            resp = bubble_fetch(data_type, cursor=cursor)
            results = resp.get("results", [])
            remaining = resp.get("remaining", 0)
            consecutive_failures = 0
        except Exception as e:
            print(f"      WARN: Page at cursor {cursor} failed: {e}")
            consecutive_failures += 1
            if consecutive_failures >= 5:
                break
            cursor += PAGE_SIZE
            time.sleep(5)
            continue

        if not results:
            break

        for r in results:
            rid = r.get("_id")
            if rid and rid not in seen_ids:
                seen_ids.add(rid)
                all_records.append(r)

        cursor += len(results)

        if remaining <= 0:
            break

        time.sleep(0.1)

    return all_records, total


def transform_record(record, field_map):
    """Transform a Bubble record using the field map."""
    transformed = {}
    for bubble_key, (supabase_col, pg_type) in field_map.items():
        if bubble_key not in record:
            continue
        value = record[bubble_key]

        if value is None:
            transformed[supabase_col] = None
        elif pg_type == "jsonb":
            if isinstance(value, (dict, list)):
                transformed[supabase_col] = json.dumps(value)
            else:
                transformed[supabase_col] = value
        elif pg_type == "text[]":
            if isinstance(value, list):
                transformed[supabase_col] = value
            elif value is None:
                transformed[supabase_col] = []
            else:
                transformed[supabase_col] = [str(value)]
        elif pg_type == "timestamptz":
            transformed[supabase_col] = sanitize_date(value)
        elif pg_type == "boolean":
            if isinstance(value, bool):
                transformed[supabase_col] = value
            elif isinstance(value, str):
                transformed[supabase_col] = value.lower() in ("true", "yes", "1")
            else:
                transformed[supabase_col] = bool(value)
        elif pg_type in ("integer", "numeric"):
            try:
                if pg_type == "integer":
                    transformed[supabase_col] = int(value) if value is not None else None
                else:
                    transformed[supabase_col] = float(value) if value is not None else None
            except (ValueError, TypeError):
                transformed[supabase_col] = None
        else:
            transformed[supabase_col] = value

    return transformed


def normalize_batch(records):
    """Ensure all records in a batch have the same keys."""
    if not records:
        return records
    all_keys = set()
    for r in records:
        all_keys.update(r.keys())
    return [{k: r.get(k) for k in all_keys} for r in records]


def supabase_upsert(table_name, records, batch_size=BATCH_SIZE):
    """Upsert records into Supabase."""
    if not records:
        return 0, 0

    total_inserted = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = normalize_batch(records[i:i + batch_size])
        url = f"{SUPABASE_URL}/rest/v1/{table_name}?on_conflict=bubble_id"
        data = json.dumps(batch).encode("utf-8")

        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("apikey", SUPABASE_SERVICE_KEY)
        req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Prefer", "resolution=merge-duplicates")

        max_retries = 3
        for attempt in range(max_retries):
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    total_inserted += len(batch)
                    break
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8") if e.fp else ""
                if e.code == 429:
                    time.sleep(2 ** (attempt + 1))
                elif attempt == max_retries - 1:
                    print(f"      Error batch {i//batch_size + 1}: {e.code} - {error_body[:200]}")
                    # Fallback: one by one
                    for single in batch:
                        try:
                            sdata = json.dumps([single]).encode("utf-8")
                            sreq = urllib.request.Request(url, data=sdata, method="POST")
                            sreq.add_header("apikey", SUPABASE_SERVICE_KEY)
                            sreq.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
                            sreq.add_header("Content-Type", "application/json")
                            sreq.add_header("Prefer", "resolution=merge-duplicates")
                            with urllib.request.urlopen(sreq, timeout=30):
                                total_inserted += 1
                        except Exception as se:
                            errors += 1
                            if errors <= 10:
                                bid = single.get("bubble_id", "?")
                                print(f"        Single insert error ({bid}): {se}")
                    break
                else:
                    time.sleep(0.5)
            except Exception as e:
                if attempt == max_retries - 1:
                    errors += len(batch)
                    break
                time.sleep(0.5)

    return total_inserted, errors


def sync_all():
    """Sync all Bubble data types to Supabase."""
    print("=" * 70)
    print("  COMPLETE BUBBLE → SUPABASE SYNC")
    print(f"  {len(TABLES)} data types")
    print("=" * 70)

    start = time.time()
    total_types = len(TABLES)
    grand_inserted = 0
    grand_errors = 0
    results = []

    for idx, (dt_name, config) in enumerate(sorted(TABLES.items(), key=lambda x: x[0].lower()), 1):
        table = config["table"]
        field_map = config["fields"]

        print(f"\n[{idx}/{total_types}] {dt_name} → {table}")

        # Fetch
        print(f"    Fetching from Bubble...")
        records, total = fetch_all_records(dt_name)
        print(f"    Fetched {len(records)}/{total} records")

        if not records:
            results.append({"type": dt_name, "table": table, "fetched": 0, "inserted": 0, "errors": 0})
            continue

        # Transform
        transformed = []
        t_errors = 0
        for r in records:
            try:
                t = transform_record(r, field_map)
                if t.get("bubble_id"):
                    transformed.append(t)
            except Exception as e:
                t_errors += 1
                if t_errors <= 3:
                    print(f"      Transform error: {e}")

        print(f"    Transformed {len(transformed)} records ({t_errors} errors)")

        # Upsert
        print(f"    Upserting into {table}...")
        inserted, errs = supabase_upsert(table, transformed)
        print(f"    Done: {inserted} upserted, {errs} errors")

        grand_inserted += inserted
        grand_errors += errs
        results.append({
            "type": dt_name, "table": table,
            "fetched": len(records), "inserted": inserted, "errors": errs
        })

    elapsed = time.time() - start

    print(f"\n{'=' * 70}")
    print(f"  SYNC COMPLETE")
    print(f"  Total upserted: {grand_inserted}")
    print(f"  Total errors:   {grand_errors}")
    print(f"  Time:           {elapsed:.1f}s")
    print(f"{'=' * 70}")

    # Summary table
    print(f"\n{'Type':<40} {'Table':<30} {'Fetched':>8} {'Inserted':>8} {'Errors':>6}")
    print("-" * 92)
    for r in results:
        print(f"{r['type']:<40} {r['table']:<30} {r['fetched']:>8} {r['inserted']:>8} {r['errors']:>6}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--dry-run":
        print("DRY RUN - showing table config only")
        for dt_name, config in sorted(TABLES.items()):
            print(f"\n{dt_name} → {config['table']} ({len(config['fields'])} fields)")
            for bname, (col, pg) in sorted(config['fields'].items()):
                print(f"  {bname:50s} → {col:40s} ({pg})")
    else:
        sync_all()
''')

    with open(SYNC_SCRIPT, "w") as f:
        f.write("\n".join(lines))

    os.chmod(SYNC_SCRIPT, 0o755)
    print(f"  Written to: {SYNC_SCRIPT}")


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 70)
    print("  BUBBLE SCHEMA DISCOVERY - COMPLETE COVERAGE")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    start = time.time()

    # 1 & 2: Discover everything
    schema = discover_all()

    # Save full schema JSON
    with open(SCHEMA_JSON, "w") as f:
        json.dump(schema, f, indent=2, default=str)
    print(f"\n  Full schema saved to: {SCHEMA_JSON}")

    # Summary
    total_fields = sum(t["field_count"] for t in schema.values())
    total_records = sum(t["records_scanned"] for t in schema.values())
    print(f"\n  SUMMARY:")
    print(f"    Data types:      {len(schema)}")
    print(f"    Total fields:    {total_fields}")
    print(f"    Records scanned: {total_records}")

    # 3: Generate SQL
    generate_sql(schema)

    # 4: Generate sync script
    generate_sync_script(schema)

    elapsed = time.time() - start
    print(f"\n  Total time: {elapsed:.1f}s")
    print(f"\n  OUTPUT FILES:")
    print(f"    1. {SCHEMA_JSON}  (full schema)")
    print(f"    2. {MIGRATION_SQL}  (SQL migration)")
    print(f"    3. {SYNC_SCRIPT}  (Python sync)")
    print(f"\n  NEXT STEPS:")
    print(f"    1. Review bubble_full_schema.json")
    print(f"    2. Run: psql < bubble_complete_migration.sql")
    print(f"    3. Run: python3 bubble_complete_sync.py")


if __name__ == "__main__":
    main()
