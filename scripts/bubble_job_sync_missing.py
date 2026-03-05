#!/usr/bin/env python3
"""
Bubble Job → Supabase b_job: Sync missing fields + missing records.
Fetches ALL Job records from Bubble, maps ALL fields (old + new),
and upserts into b_job. Existing rows get new fields populated;
missing rows get fully inserted.
"""

import json
import urllib.request
import urllib.parse
import time
import sys

# ============================================================
# CONFIGURATION
# ============================================================

BUBBLE_API_BASE = "https://app.joinbreasy.com/api/1.1/obj"
BUBBLE_API_KEY = "7d258f5f7c1d32d2f4003721719b68bb"

SUPABASE_URL = "https://caursmdeoghqixudiscb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXJzbWRlb2docWl4dWRpc2NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM2MzE2MywiZXhwIjoyMDg2OTM5MTYzfQ.-7XA8EMwqZonb8SSR5EjALWmMOdjCM4wOnHcjss8lHQ"

BUBBLE_PAGE_SIZE = 100

# ============================================================
# COMPLETE FIELD MAPPING: Bubble Job → Supabase b_job
# Covers all 113 Bubble fields → 115 Supabase columns
# ============================================================

FIELD_MAP = {
    # --- Original mapped fields (44) ---
    "_id": "bubble_id",
    "Created By": "created_by",
    "Created Date": "created_date",
    "Modified Date": "modified_date",
    "jobID": "job_id",
    "jobWorkOrder": "job_work_order",
    "jobInvoiceNo": "job_invoice_no",
    "jobMarket": "job_market",
    "jobDescription": "job_description",
    "jobServicesList": "job_services_list",
    "jobRecommendedPrice": "job_recommended_price",
    "lifecycle": "lifecycle",
    "statusJobStage": "status_job_stage",
    "statusSmbQuote": "status_smb_quote",
    "addressGeo": "address_geo",
    "assignedCustOrg": "assigned_cust_org",
    "assignedCustUser": "assigned_cust_user",
    "assignedFulfillmentUser": "assigned_fulfillment_user",
    "assignedSmbUser": "assigned_smb_user",
    "acceptedQuote": "accepted_quote",
    "activeNextStep": "active_next_step",
    "calendarEvent": "calendar_event",
    "associatedQuotes": "associated_quotes",
    "associatedActivities(updated)": "associated_activities",
    "amountCostOfMaterials": "amount_cost_of_materials",
    "amountSmbPrice": "amount_smb_price",
    "dateClosed": "date_closed",
    "dateQuoteScheduled": "date_quote_scheduled",
    "dateQuoteScheduledTxt": "date_quote_scheduled_txt",
    "dateSmbQuoteRecieved": "date_smb_quote_received",
    "dateWorkScheduled": "date_work_scheduled",
    "dateWorkScheduledTxt": "date_work_scheduled_txt",
    "lastActivity": "last_activity",
    "blocked": "blocked",
    "occupiedFirst": "occupied_first",
    "occupiedLast": "occupied_last",
    "occupiedNote": "occupied_note",
    "occupiedPhone": "occupied_phone",
    "quoteCustScopeOfWork": "quote_cust_scope_of_work",
    "quoteSmbScopeOfWork": "quote_smb_scope_of_work",
    "smbPaymentStatusZapier": "smb_payment_status_zapier",
    "hubspotDealId": "hubspot_deal_id",
    "hubspotDealIdInserted": "hubspot_deal_id_inserted",
    "timeToQuote": "time_to_quote",

    # --- NEW: 70 previously missing fields ---
    # Financial
    "amountCustPrice": "amount_cust_price",
    "amountMarkup": "amount_markup",
    "NTE": "nte",
    "tripCharge": "trip_charge",

    # Status
    "statusJobCompletion": "status_job_completion",
    "statusCustQuote": "status_cust_quote",
    "statusCustInvoice": "status_cust_invoice",

    # Metadata
    "Difficulty": "difficulty",
    "Urgency": "urgency",
    "source": "source",
    "creation_tool": "creation_tool",
    "hrsToComplete": "hrs_to_complete",
    "onsiteneeded?": "onsite_needed",
    "note": "note",
    "mm name": "mm_name",

    # Closed/completion
    "closedReason": "closed_reason",
    "closedDetails": "closed_details",
    "closedOpportunityReasons": "closed_opportunity_reasons",
    "completionSummary": "completion_summary",
    "completionSMSSent": "completion_sms_sent",

    # Dates
    "dateClosedTxt": "date_closed_txt",
    "dateCustInvoiceDue": "date_cust_invoice_due",
    "dateCustInvoicePaid": "date_cust_invoice_paid",
    "dateCustInvoiceSent": "date_cust_invoice_sent",
    "dateCustQuoteApproved": "date_cust_quote_approved",
    "dateCustQuoteSent": "date_cust_quote_sent",
    "dateFulfillmentConfirmedCompletion": "date_fulfillment_confirmed_completion",
    "dateLastActivity": "date_last_activity",
    "dateSmbConfirmedPaid": "date_smb_confirmed_paid",
    "dateSmbPaid": "date_smb_paid",
    "dateSmbSentToAP": "date_smb_sent_to_ap",
    "dateWoRecieved": "date_wo_received",
    "dateWorkCompleted": "date_work_completed",
    "date_changedDateQuoteScheduled": "date_changed_date_quote_scheduled",
    "date_smbAssigned": "date_smb_assigned",
    "date_startCustQuoteStage": "date_start_cust_quote_stage",
    "date_startPaymentsStage": "date_start_payments_stage",
    "date_startScheduledStage": "date_start_scheduled_stage",
    "date_startSmbQuoteStage": "date_start_smb_quote_stage",
    "NewProposedDate": "new_proposed_date",
    "suggestedChangedCompletionDate": "suggested_changed_completion_date",
    "workDateConfirmed_PMC": "work_date_confirmed_pmc",
    "workDateConfirmed_SMB": "work_date_confirmed_smb",
    "workDateConfirmed_Tenant": "work_date_confirmed_tenant",

    # Relationships
    "acceptedCompletion": "accepted_completion",
    "activeactivity(updated)": "active_activity",
    "associatedCustInvoice": "associated_cust_invoice",
    "associatedNextSteps": "associated_next_steps",
    "associatedSmbPayment": "associated_smb_payment",
    "invoiceSmbInvoice": "invoice_smb_invoice",
    "invoicecustTripchargeInvoice": "invoice_cust_tripcharge_invoice",
    "job-chat": "job_chat",
    "published SMBs": "published_smbs",
    "visits": "visits",

    # Media
    "jobCustPhotos": "job_cust_photos",
    "customerquoteimage": "customer_quote_image",

    # Recurring
    "recurring_WOroot": "recurring_wo_root",
    "recurring_child": "recurring_child",
    "recurring_occurrence": "recurring_occurrence",
    "recurring_previous_WOs": "recurring_previous_wos",
    "recurring_status": "recurring_status",
    "recurring_weekly_frequency": "recurring_weekly_frequency",

    # Tenant/scheduling
    "tenant_presence_required?": "tenant_presence_required",
    "tenant_site_vacant?": "tenant_site_vacant",
    "requestTripCharge": "request_trip_charge",

    # Booleans
    "hubspotDealClosed": "hubspot_deal_closed",
    "quoteSMSSent": "quote_sms_sent",
    "viewed?": "viewed",

    # Other
    "quoteDatesList": "quote_dates_list",
    "mapbox_table_cache": "mapbox_table_cache",
}

# Columns that should be stored as jsonb
JSONB_COLUMNS = {"address_geo"}

# Columns that should be stored as text[]
ARRAY_COLUMNS = {
    "job_services_list", "associated_quotes", "associated_activities",
    "closed_opportunity_reasons", "associated_next_steps", "published_smbs",
    "job_cust_photos", "active_activity", "recurring_previous_wos",
    "visits", "quote_dates_list",
}

# Columns that are date/timestamptz
DATE_COLUMNS = {
    "created_date", "modified_date", "date_closed", "date_quote_scheduled",
    "date_smb_quote_received", "date_work_scheduled", "last_activity",
    "date_cust_invoice_due", "date_cust_invoice_paid", "date_cust_invoice_sent",
    "date_cust_quote_approved", "date_cust_quote_sent",
    "date_fulfillment_confirmed_completion", "date_last_activity",
    "date_smb_confirmed_paid", "date_smb_paid", "date_smb_sent_to_ap",
    "date_wo_received", "date_work_completed",
    "date_changed_date_quote_scheduled", "date_smb_assigned",
    "date_start_cust_quote_stage", "date_start_payments_stage",
    "date_start_scheduled_stage", "date_start_smb_quote_stage",
    "new_proposed_date", "suggested_changed_completion_date",
    "work_date_confirmed_pmc", "work_date_confirmed_smb",
    "work_date_confirmed_tenant",
}


# ============================================================
# HELPERS
# ============================================================

def sanitize_date(value):
    """Sanitize date strings - set to None if year is out of PostgreSQL range."""
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


def bubble_fetch(cursor=0, limit=BUBBLE_PAGE_SIZE):
    """Fetch Job records from Bubble Data API."""
    url = f"{BUBBLE_API_BASE}/job?cursor={cursor}&limit={limit}"
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
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  HTTP Error {e.code}: {e.reason}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(2)
        except Exception as e:
            print(f"  Error (attempt {attempt+1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                raise
            time.sleep(3 * (attempt + 1))
    return {"results": [], "remaining": 0}


def fetch_all_jobs():
    """Fetch ALL Job records from Bubble with pagination."""
    all_records = []
    seen_ids = set()
    cursor = 0

    # Get total count
    resp = bubble_fetch(cursor=0, limit=1)
    total = resp.get("remaining", 0) + len(resp.get("results", []))
    print(f"  Total Bubble Job records: {total}")

    for r in resp.get("results", []):
        rid = r.get("_id")
        if rid and rid not in seen_ids:
            seen_ids.add(rid)
            all_records.append(r)
    cursor = len(all_records)

    if total == 0:
        return []

    consecutive_failures = 0
    while cursor < total:
        try:
            resp = bubble_fetch(cursor=cursor)
            results = resp.get("results", [])
            remaining = resp.get("remaining", 0)
            consecutive_failures = 0
        except Exception as e:
            print(f"  WARN: Page at cursor {cursor} failed: {e}")
            consecutive_failures += 1
            if consecutive_failures >= 5:
                print(f"  ABORTING: Too many consecutive failures")
                break
            cursor += BUBBLE_PAGE_SIZE
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
        pct = min(100, int(len(all_records) / max(total, 1) * 100))
        print(f"  Fetched {len(all_records)}/{total} ({pct}%)")

        if remaining <= 0:
            break

        time.sleep(0.1)

    return all_records


def transform_record(record):
    """Transform a Bubble Job record to Supabase b_job format."""
    transformed = {}
    for bubble_key, supabase_key in FIELD_MAP.items():
        if bubble_key in record:
            value = record[bubble_key]

            if supabase_key in JSONB_COLUMNS:
                if isinstance(value, (dict, list)):
                    transformed[supabase_key] = json.dumps(value)
                else:
                    transformed[supabase_key] = value

            elif supabase_key in ARRAY_COLUMNS:
                if isinstance(value, list):
                    transformed[supabase_key] = value
                elif value is None:
                    transformed[supabase_key] = []
                else:
                    transformed[supabase_key] = [str(value)]

            elif supabase_key in DATE_COLUMNS:
                transformed[supabase_key] = sanitize_date(value)

            else:
                transformed[supabase_key] = value

    return transformed


def normalize_batch(records):
    """Ensure all records in a batch have the same keys."""
    if not records:
        return records
    all_keys = set()
    for r in records:
        all_keys.update(r.keys())
    return [{k: r.get(k) for k in all_keys} for r in records]


def supabase_upsert(records, batch_size=50):
    """Upsert records into Supabase b_job via REST API."""
    if not records:
        return 0, 0

    total_inserted = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = normalize_batch(records[i:i + batch_size])
        url = f"{SUPABASE_URL}/rest/v1/b_job?on_conflict=bubble_id"
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
                    wait = 2 ** (attempt + 1)
                    print(f"    Rate limited, waiting {wait}s...")
                    time.sleep(wait)
                elif attempt == max_retries - 1:
                    print(f"    Error batch {i//batch_size + 1}: {e.code} - {error_body[:300]}")
                    # Fallback: insert one by one
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
                            if errors <= 5:
                                print(f"      Single insert error: {se}")
                    break
                else:
                    time.sleep(0.5)
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"    Error: {e}")
                    errors += len(batch)
                    break
                time.sleep(0.5)

        batch_num = i // batch_size + 1
        total_batches = (len(records) + batch_size - 1) // batch_size
        if batch_num % 20 == 0 or batch_num == total_batches:
            print(f"    Upserted: {min(i + batch_size, len(records))}/{len(records)}")

    return total_inserted, errors


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("  BUBBLE JOB → SUPABASE b_job: SYNC MISSING FIELDS")
    print("=" * 60)

    start_time = time.time()

    # 1. Fetch all Job records from Bubble
    print("\n[1/3] Fetching all Job records from Bubble...")
    records = fetch_all_jobs()
    print(f"  Fetched {len(records)} records total")

    if not records:
        print("  No records found, exiting.")
        return

    # 2. Transform
    print(f"\n[2/3] Transforming {len(records)} records...")
    transformed = []
    transform_errors = 0
    for r in records:
        try:
            t = transform_record(r)
            if t.get("bubble_id"):
                transformed.append(t)
        except Exception as e:
            transform_errors += 1
            if transform_errors <= 5:
                print(f"    Transform error: {e}")

    print(f"  Transformed {len(transformed)} records ({transform_errors} errors)")

    # 3. Upsert
    print(f"\n[3/3] Upserting {len(transformed)} records into Supabase b_job...")
    inserted, errors = supabase_upsert(transformed)

    elapsed = time.time() - start_time
    print(f"\n{'=' * 60}")
    print(f"  SYNC COMPLETE")
    print(f"  Upserted:  {inserted}")
    print(f"  Errors:    {errors}")
    print(f"  Time:      {elapsed:.1f}s")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
