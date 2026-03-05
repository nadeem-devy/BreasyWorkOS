# Bubble → Supabase Migration Status

## API Details
- Bubble Live API: `https://app.joinbreasy.com/api/1.1/obj`
- Bubble API Key: `7d258f5f7c1d32d2f4003721719b68bb`
- Supabase: `https://caursmdeoghqixudiscb.supabase.co`

## Completed Tables (from live data)
| Table | Supabase Table | Records | Status |
|-------|---------------|---------|--------|
| organization | b_organization | 1,000 | DONE |
| user | b_user | 2,700 | DONE |
| calendarevent | b_calendar_event | 11,400 | DONE |
| leads | b_leads | 0 (empty) | DONE |
| utmviews | b_utm_views | 7,100 | DONE |
| smbonboardintent | b_smb_onboard_intent | 1,600 | DONE |
| snapshot_mm | b_snapshot_mm | 1,000 | DONE |
| snapshot_pmc | b_snapshot_pmc | 13,200 | DONE |
| snapshot_market | b_snapshot_market | 2,000 | DONE |
| appusage | b_app_usage | 5,300 | DONE |
| jobrequest | b_job_request | (small) | DONE |
| jobrequestqualitymetrics | b_job_request_quality_metrics | 2,900 | DONE |
| job | b_job | 16,300 | DONE |
| jobservice | b_job_service | 3,900 | DONE |
| quotelineitem | b_quote_line_item | 2,400 | DONE |
| publishedsmbs | b_published_smbs | 12,100 | DONE |

## In Progress (background task b0d5194)
| Table | Status |
|-------|--------|
| invoice | Currently running (~91%) |

## Remaining Tables (to resume with)
```bash
cd "/Users/Nadeem/Breasy WorkOS" && python3 -u scripts/bubble_migrate.py smbquote invoice note activity nextstep nextstepsmb completion message conversation chat-message email notifications usagemetrics sectionengagementtrack visit
```

## Notes
- `smbquote` failed due to API timeouts (15,973 records) - needs retry
- Duplicate tables (duplicatejob, duplicatejobservice, duplicatequote, duplicateinvoicerf) were DROPPED per user request
- Script uses `on_conflict=bubble_id` for upserts so re-running is safe
- Live data is MUCH larger than test data
- `activity` table will be the biggest (~95K+ records in live)
