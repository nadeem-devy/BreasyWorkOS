#!/usr/bin/env python3
"""
Bubble.io → Supabase Data Migration Script
Fetches all data from Bubble Data API and inserts into Supabase.
Uses only Python standard library (no pip installs needed).
"""

import json
import urllib.request
import urllib.parse
import urllib.error
import time
import sys
import os

# ============================================================
# CONFIGURATION
# ============================================================

BUBBLE_API_BASE = "https://app.joinbreasy.com/api/1.1/obj"
BUBBLE_API_KEY = "7d258f5f7c1d32d2f4003721719b68bb"

SUPABASE_URL = "https://caursmdeoghqixudiscb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXJzbWRlb2docWl4dWRpc2NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM2MzE2MywiZXhwIjoyMDg2OTM5MTYzfQ.-7XA8EMwqZonb8SSR5EjALWmMOdjCM4wOnHcjss8lHQ"

BUBBLE_PAGE_SIZE = 100  # Bubble max per request

# ============================================================
# TABLE MAPPING: Bubble type → Supabase table + field mapping
# ============================================================

TABLE_MAP = {
    "user": {
        "table": "b_user",
        "fields": {
            "_id": "bubble_id",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "authentication": "authentication",
            "userFirstName": "user_first_name",
            "userLastName": "user_last_name",
            "userFullName": "user_full_name",
            "userRole": "user_role",
            "userFunction": "user_function",
            "userContactEmail": "user_contact_email",
            "userContactPhone": "user_contact_phone",
            "userMarkets": "user_markets",
            "userAccountStatus": "user_account_status",
            "userLifecycle": "user_lifecycle",
            "userAddedVia": "user_added_via",
            "userAcceptTerms": "user_accept_terms",
            "userBetaTester": "user_beta_tester",
            "userVerified": "user_verified",
            "user_signed_up": "user_signed_up",
            "userLoginLastDate": "user_login_last_date",
            "userAssociatedOrg": "user_associated_org",
            "smbSource": "smb_source",
            "mmDialpadId": "mm_dialpad_id",
            "mmSlackID": "mm_slack_id",
            "mmJobPage": "mm_job_page",
            "custContactHubspotID": "cust_contact_hubspot_id",
        },
    },
    "organization": {
        "table": "b_organization",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "orgName": "org_name",
            "orgFunction": "org_function",
            "orgTier": "org_tier",
            "custTier": "cust_tier",
            "orgWebsite": "org_website",
            "orgAddressGeo": "org_address_geo",
            "orgMarkets": "org_markets",
            "orgHubspotID": "org_hubspot_id",
            "orgAddedVia": "org_added_via",
            "associatedPrimaryContact": "associated_primary_contact",
            "associatedUsers": "associated_users",
            "lifecycleStage": "lifecycle_stage",
            "lifecycleStagePrev": "lifecycle_stage_prev",
            "smbSource": "smb_source",
            "smbServices": "smb_services",
            "smbApprovedForWork": "smb_approved_for_work",
            "smbEIN": "smb_ein",
            "smbLicenseNum": "smb_license_num",
            "smbLicenseExp": "smb_license_exp",
            "smbInsuranceNum": "smb_insurance_num",
            "smbInsuranceExp": "smb_insurance_exp",
            "smbPaymentClosedWon": "smb_payment_closed_won",
            "mercuryStatus": "mercury_status",
            "metricWoCreatedAllTime": "metric_wo_created_all_time",
            "metricWoCountClosedWon": "metric_wo_count_closed_won",
            "metricComplPerc": "metric_compl_perc",
            "metricCwRevPerc": "metric_cw_rev_perc",
            "metricPaymentCount": "metric_payment_count",
            "dateLastComplete": "date_last_complete",
            "dateLastPublished": "date_last_published",
            "dateLastSentOrAssigned": "date_last_sent_or_assigned",
        },
    },
    "job": {
        "table": "b_job",
        "fields": {
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
        },
    },
    "activity": {
        "table": "b_activity",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "Title": "title",
            "body": "body",
            "associatedJob": "associated_job",
            "associatedFulfillmentOwner": "associated_fulfillment_owner",
            "jobStage": "job_stage",
            "percentage": "percentage",
            "complete": "complete",
            "dateCompleted": "date_completed",
        },
    },
    "message": {
        "table": "b_message",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "content": "content",
            "direction": "direction",
            "messageDate": "message_date",
            "messageNote": "message_note",
            "relatedNote": "related_note",
        },
    },
    "nextstep": {
        "table": "b_next_step",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "nextStepDetails": "next_step_details",
            "taskJobStage": "task_job_stage",
            "taskStatus": "task_status",
            "dateDue": "date_due",
            "dueDateText": "due_date_text",
            "blocked": "blocked",
        },
    },
    "note": {
        "table": "b_note",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "body": "body",
            "noteType": "note_type",
        },
    },
    "invoice": {
        "table": "b_invoice",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "jobWorkOrder": "job_work_order",
            "invoiceType": "invoice_type",
            "invoiceStatus": "invoice_status",
            "associatedCustOrg": "associated_cust_org",
            "amountSmbPrice": "amount_smb_price",
            "dateJobCompleted": "date_job_completed",
            "dateJobCompletionConfirmed": "date_job_completion_confirmed",
            "paidDate": "paid_date",
        },
    },
    "duplicateinvoicerf": {
        "table": "b_duplicate_invoice_rf",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "jobWorkOrder": "job_work_order",
            "invoiceType": "invoice_type",
            "invoiceStatus": "invoice_status",
            "associatedCustOrg": "associated_cust_org",
            "associatedSmb": "associated_smb",
            "amountSmbPayout": "amount_smb_payout",
            "dateJobCompleted": "date_job_completed",
            "dateJobCompletionConfirmed": "date_job_completion_confirmed",
            "dateSentToAP": "date_sent_to_ap",
            "smbName": "smb_name",
            "smbPhone": "smb_phone",
            "smbAddressStreet": "smb_address_street",
            "smbAddressCity": "smb_address_city",
            "smbAddressState": "smb_address_state",
            "smbAddressZipcode": "smb_address_zipcode",
        },
    },
    "usagemetrics": {
        "table": "b_usage_metrics",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "pageName": "page_name",
            "allVisits": "all_visits",
            "uniqueVisits": "unique_visits",
            "visitTimeDate": "visit_time_date",
            "visitTimeDateTxt": "visit_time_date_txt",
        },
    },
    "duplicatequote": {
        "table": "b_duplicate_quote",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "associatedSmbOrg": "associated_smb_org",
            "associatedSmbUser": "associated_smb_user",
            "status": "status",
            "quoteScopeOfWork": "quote_scope_of_work",
            "quoteAdditionalRecommendations": "quote_additional_recommendations",
            "quoteExpectedTimeToCompletion": "quote_expected_time_to_completion",
            "quoteSmbName": "quote_smb_name",
            "quoteSmbPhone": "quote_smb_phone",
            "onsiteNote": "onsite_note",
            "amountCostOfMaterials": "amount_cost_of_materials",
            "amountSmbLabor": "amount_smb_labor",
            "amountCustomerCalculation": "amount_customer_calculation",
            "amountCustomerTotal": "amount_customer_total",
            "amountCustomerMarkup": "amount_customer_markup",
            "dateSmbSubmitted": "date_smb_submitted",
        },
    },
    "jobservice": {
        "table": "b_job_service",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "jobWorkOrder": "job_work_order",
            "serviceMarket": "service_market",
            "customerPrice": "customer_price",
            "smbTotalCost": "smb_total_cost",
            "serviceSmbHours": "service_smb_hours",
            "serviceSmbRate": "service_smb_rate",
            "markup": "markup",
        },
    },
    "duplicatejob": {
        "table": "b_duplicate_job",
        "fields": {
            "_id": "bubble_id",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "jobWorkOrder": "job_work_order",
            "jobMarket": "job_market",
            "jobDescription": "job_description",
            "jobServices": "job_services",
            "jobServicesList": "job_services_list",
            "jobNotes": "job_notes",
            "statusJobStage": "status_job_stage",
            "addressGeo": "address_geo",
            "addressStreet": "address_street",
            "addressCity": "address_city",
            "addressState": "address_state",
            "addressZip": "address_zip",
            "assignedCustOrg": "assigned_cust_org",
            "assignedCustUser": "assigned_cust_user",
            "assignedFulfillmentUser": "assigned_fulfillment_user",
            "assignedSmbUser": "assigned_smb_user",
            "nextStep": "next_step",
            "breasyMMnextStep": "breasy_mm_next_step",
            "amountCustInvoice": "amount_cust_invoice",
            "amountSmbTotal": "amount_smb_total",
            "dateClosed": "date_closed",
            "dateClosedTxt": "date_closed_txt",
            "dateCompletionApproved": "date_completion_approved",
            "dateCompletionConfirmed": "date_completion_confirmed",
            "dateCustInvoiceConfirmed": "date_cust_invoice_confirmed",
            "dateCustInvoiceDue": "date_cust_invoice_due",
            "dateCustInvoiceSent": "date_cust_invoice_sent",
            "dateCustQuoteSent": "date_cust_quote_sent",
            "dateSmbInvoiceAP": "date_smb_invoice_ap",
            "dateSmbQuoteConfirmed": "date_smb_quote_confirmed",
            "dateSmbReminder1": "date_smb_reminder_1",
            "dateSmbReminder2": "date_smb_reminder_2",
            "dateWorkApprovalConfirmed": "date_work_approval_confirmed",
            "dateWorkAssigned": "date_work_assigned",
            "dateWorkCompleted": "date_work_completed",
            "dateWorkScheduled": "date_work_scheduled",
            "dateWorkSubmitted": "date_work_submitted",
            "lastActivity": "last_activity",
            "jobNextStepDue": "job_next_step_due",
            "jobCustQuoteStatus": "job_cust_quote_status",
            "jobSmbCompletionStatus": "job_smb_completion_status",
            "jobSmbQuoteStatus": "job_smb_quote_status",
            "invoiceCustInvoice": "invoice_cust_invoice",
            "invoiceNumber": "invoice_number",
            "invoiceSmbInvoice": "invoice_smb_invoice",
            "dealHubspotID": "deal_hubspot_id",
            "occupiedFirst": "occupied_first",
            "occupiedLast": "occupied_last",
            "relatedInvoiceNumbers": "related_invoice_numbers",
        },
    },
    "email": {
        "table": "b_email",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "emailSubject": "email_subject",
            "emailBody": "email_body",
            "emailType": "email_type",
            "senderEmail": "sender_email",
            "senderName": "sender_name",
            "receiverEmail": "receiver_email",
            "messageID": "message_id",
            "isRead": "is_read",
            "isStarred": "is_starred",
            "readBy": "read_by",
            "slackNotificationSent": "slack_notification_sent",
        },
    },
    "conversation": {
        "table": "b_conversation",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "associatedExternalUser": "associated_external_user",
            "associatedInternalUser": "associated_internal_user",
            "associatedMarkets": "associated_markets",
            "externalPhoneNo": "external_phone_no",
            "jobAddress": "job_address",
            "jobWorkOrder": "job_work_order",
            "messages": "messages",
            "smb": "smb",
            "unread": "unread",
        },
    },
    "smbquote": {
        "table": "b_smb_quote",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "associatedJob": "associated_job",
            "associatedSmbUser": "associated_smb_user",
            "statusQuote": "status_quote",
            "source": "source",
            "quoteScopeOfWork": "quote_scope_of_work",
            "quoteAdditionalRecommendations": "quote_additional_recommendations",
            "quoteExpectedTimeToComplete": "quote_expected_time_to_complete",
            "quoteSmbName": "quote_smb_name",
            "quoteSmbPhone": "quote_smb_phone",
            "amountCostOfMaterials": "amount_cost_of_materials",
            "amountSmbTotal": "amount_smb_total",
            "dateQuoteScheduled": "date_quote_scheduled",
            "dateQuoteSubmitted": "date_quote_submitted",
            "dateCompletionExpected": "date_completion_expected",
            "createdDateText": "created_date_text",
            "onsitePhotos": "onsite_photos",
        },
    },
    "duplicatejobservice": {
        "table": "b_duplicate_job_service",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "customerPrice": "customer_price",
            "smbTotalCost": "smb_total_cost",
            "serviceSmbHours": "service_smb_hours",
            "serviceSmbRate": "service_smb_rate",
            "serviceSuggestedHours": "service_suggested_hours",
            "serviceSuggestedRate": "service_suggested_rate",
            "serviceMarket": "service_market",
            "markup": "markup",
        },
    },
    "sectionengagementtrack": {
        "table": "b_section_engagement_track",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "pageName": "page_name",
            "Duration": "duration",
            "enterTime": "enter_time",
            "leaveTime": "leave_time",
            "createdDateTxt": "created_date_txt",
            "relatedUser": "related_user",
        },
    },
    "snapshot_market": {
        "table": "b_snapshot_market",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "date": "date",
            "market": "market",
            "agg-co_count": "agg_co_count",
            "agg-cw_count": "agg_cw_count",
        },
    },
    "notifications": {
        "table": "b_notification",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "Content": "content",
            "Type": "type",
            "Sender": "sender",
            "relatedMessage": "related_message",
            "Read": "read",
        },
    },
    "nextstepsmb": {
        "table": "b_next_step_smb",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "associatedFulfillmentUser": "associated_fulfillment_user",
            "nextStepDetails": "next_step_details",
            "taskStatus": "task_status",
            "taskManager": "task_manager",
            "dateDue": "date_due",
            "dateCompleted": "date_completed",
            "dueDateText": "due_date_text",
            "blocked": "blocked",
        },
    },
    "publishedsmbs": {
        "table": "b_published_smbs",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "job": "job",
            "SMB ID": "smb_id",
            "Accepted": "accepted",
            "viewed": "viewed",
            "Quotation date": "quotation_date",
            "Quotation date TXT": "quotation_date_txt",
        },
    },
    "calendarevent": {
        "table": "b_calendar_event",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "Event": "event",
            "StartDateTime": "start_date_time",
            "EndDateTime": "end_date_time",
            "Completed": "completed",
        },
    },
    "quotelineitem": {
        "table": "b_quote_line_item",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "associatedJob": "associated_job",
            "LineItemType": "line_item_type",
            "description": "description",
        },
    },
    "appusage": {
        "table": "b_app_usage",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "type": "type",
            "user": "user",
        },
    },
    "snapshot_pmc": {
        "table": "b_snapshot_pmc",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "date": "date",
            "pmc": "pmc",
            "agg-co_count": "agg_co_count",
            "agg-cw_count": "agg_cw_count",
            "snap-old_wos_count": "snap_old_wos_count",
            "snap-open_wos_count": "snap_open_wos_count",
        },
    },
    "snapshot_mm": {
        "table": "b_snapshot_mm",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "date": "date",
            "marketmanager": "market_manager",
            "agg-co_count": "agg_co_count",
            "agg-cw_count": "agg_cw_count",
            "snap-activities_added_count": "snap_activities_added_count",
            "snap-jobs_w_no_2_day_activity": "snap_jobs_w_no_2_day_activity",
            "snap-old_open_WOs_count": "snap_old_open_wos_count",
            "snap-open_WOs_count": "snap_open_wos_count",
            "snap-past_due_next_steps_count": "snap_past_due_next_steps_count",
            "snap-tomorrow_next_steps_count": "snap_tomorrow_next_steps_count",
        },
    },
    "completion": {
        "table": "b_completion",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "dateCompleted": "date_completed",
            "isAccepted": "is_accepted",
            "source": "source",
        },
    },
    "jobrequestqualitymetrics": {
        "table": "b_job_request_quality_metrics",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "budget_missing": "budget_missing",
            "eligible_smbs": "eligible_smbs",
            "n8n_description_rating": "n8n_description_rating",
            "pmc_compl_%": "pmc_compl_pct",
            "pmc_jobs_to_date": "pmc_jobs_to_date",
            "site_images_missing": "site_images_missing",
            "smb_compl_%s": "smb_compl_pcts",
            "smb_distances": "smb_distances",
            "warning_no_smbs_in_range_30mi": "warning_no_smbs_in_range_30mi",
            "warning_no_smbs_with_80%": "warning_no_smbs_with_80_pct",
            "warning_pmc_compl_below_50": "warning_pmc_compl_below_50",
        },
    },
    "jobrequest": {
        "table": "b_job_request",
        "fields": {
            "_id": "bubble_id",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
        },
    },
    "utmviews": {
        "table": "b_utm_views",
        "fields": {
            "_id": "bubble_id",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "campaign": "campaign",
            "source": "source",
            "medium": "medium",
            "term": "term",
        },
    },
    "visit": {
        "table": "b_visit",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "visitType": "visit_type",
            "visitPermission": "visit_permission",
            "tenant_last_viewed": "tenant_last_viewed",
            "tenant_response_stage": "tenant_response_stage",
        },
    },
    "chat-message": {
        "table": "b_chat_message",
        "fields": {
            "_id": "bubble_id",
            "Created By": "created_by",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "chat": "chat",
            "content": "content",
            "owner": "owner",
            "source": "source",
            "inbound": "inbound",
            "IsRead": "is_read",
        },
    },
    "leads": {
        "table": "b_leads",
        "fields": {
            "_id": "bubble_id",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "email": "email",
            "blog": "blog",
        },
    },
    "smbonboardintent": {
        "table": "b_smb_onboard_intent",
        "fields": {
            "_id": "bubble_id",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
            "market": "market",
            "SuperServices": "super_services",
        },
    },
    "blogpost": {
        "table": "b_blogpost",
        "fields": {
            "_id": "bubble_id",
            "Created Date": "created_date",
            "Modified Date": "modified_date",
        },
    },
}

# Migration order: tables with no dependencies first
MIGRATION_ORDER = [
    "organization",
    "user",
    "calendarevent",
    "leads",
    "utmviews",
    "smbonboardintent",
    "snapshot_mm",
    "snapshot_pmc",
    "snapshot_market",
    "appusage",
    "jobrequest",
    "jobrequestqualitymetrics",
    "job",
    "jobservice",
    "duplicatejob",
    "duplicatejobservice",
    "smbquote",
    "duplicatequote",
    "quotelineitem",
    "publishedsmbs",
    "invoice",
    "duplicateinvoicerf",
    "note",
    "activity",
    "nextstep",
    "nextstepsmb",
    "completion",
    "message",
    "conversation",
    "chat-message",
    "email",
    "notifications",
    "usagemetrics",
    "sectionengagementtrack",
    "visit",
]

# JSON-type columns (should be stored as jsonb, not text)
JSONB_COLUMNS = {
    "authentication", "org_address_geo", "address_geo", "job_address",
    "smb_compl_pcts", "smb_distances",
}

# Array-type columns (should be stored as text[])
ARRAY_COLUMNS = {
    "user_markets", "org_markets", "smb_services", "associated_users",
    "job_services_list", "associated_quotes", "associated_activities",
    "associated_markets", "messages", "job_services", "job_notes",
    "related_invoice_numbers", "onsite_photos", "unique_visits",
    "eligible_smbs", "super_services",
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def bubble_fetch(type_name, cursor=0, limit=BUBBLE_PAGE_SIZE):
    """Fetch records from Bubble Data API with pagination."""
    url = f"{BUBBLE_API_BASE}/{urllib.parse.quote(type_name)}?cursor={cursor}&limit={limit}"

    max_retries = 5
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url)
            req.add_header("Authorization", f"Bearer {BUBBLE_API_KEY}")
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("response", {})
        except urllib.error.HTTPError as e:
            if e.code == 429:  # Rate limited
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


def fetch_all_records(type_name):
    """Fetch ALL records from a Bubble type with pagination."""
    all_records = []
    seen_ids = set()
    cursor = 0

    # First fetch to get total count (use limit=1 since limit=0 can return 0 for some types)
    resp = bubble_fetch(type_name, cursor=0, limit=1)
    total = resp.get("remaining", 0) + len(resp.get("results", []))
    print(f"  Total records: {total}")

    # Include results from the count query
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
            resp = bubble_fetch(type_name, cursor=cursor)
            results = resp.get("results", [])
            remaining = resp.get("remaining", 0)
            consecutive_failures = 0
        except Exception as e:
            print(f"  WARN: Page at cursor {cursor} failed after retries: {e}")
            consecutive_failures += 1
            if consecutive_failures >= 5:
                print(f"  ABORTING: Too many consecutive failures ({consecutive_failures})")
                break
            cursor += BUBBLE_PAGE_SIZE  # skip this page
            time.sleep(5)
            continue

        if not results:
            break

        # Deduplicate by _id
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

        # Small delay to avoid rate limiting
        time.sleep(0.1)

    return all_records


def sanitize_date(value):
    """Sanitize date strings - set to None if year is out of PostgreSQL range."""
    if not isinstance(value, str):
        return value
    # Detect dates with absurd years like +056500-... or years > 9999
    if value.startswith('+') or value.startswith('-'):
        return None
    # Check if it looks like a date and has year > 9999
    try:
        if len(value) >= 10 and value[4] == '-':
            year = int(value[:4])
            if year > 9999 or year < 1:
                return None
    except (ValueError, IndexError):
        pass
    return value


def transform_record(record, field_map):
    """Transform a Bubble record to Supabase format using field mapping."""
    transformed = {}
    for bubble_key, supabase_key in field_map.items():
        if bubble_key in record:
            value = record[bubble_key]

            # Handle jsonb columns
            if supabase_key in JSONB_COLUMNS:
                if isinstance(value, (dict, list)):
                    transformed[supabase_key] = json.dumps(value)
                else:
                    transformed[supabase_key] = value

            # Handle array columns
            elif supabase_key in ARRAY_COLUMNS:
                if isinstance(value, list):
                    transformed[supabase_key] = value
                elif value is None:
                    transformed[supabase_key] = []
                else:
                    transformed[supabase_key] = [str(value)]

            else:
                # Sanitize date fields (any field ending in _date or _time)
                if isinstance(value, str) and ('date' in supabase_key or 'time' in supabase_key or supabase_key in ('created_date', 'modified_date')):
                    value = sanitize_date(value)
                transformed[supabase_key] = value

    return transformed


def normalize_batch(records):
    """Ensure all records in a batch have the same keys (PostgREST requirement)."""
    if not records:
        return records
    # Collect all keys across all records
    all_keys = set()
    for r in records:
        all_keys.update(r.keys())
    # Normalize: fill missing keys with None
    normalized = []
    for r in records:
        row = {k: r.get(k) for k in all_keys}
        normalized.append(row)
    return normalized


def supabase_upsert(table_name, records, batch_size=50):
    """Insert records into Supabase via REST API in batches."""
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
                    wait = 2 ** (attempt + 1)
                    print(f"    Rate limited, waiting {wait}s...")
                    time.sleep(wait)
                elif attempt == max_retries - 1:
                    print(f"    Error batch {i//batch_size + 1}: {e.code} - {error_body[:300]}")
                    # Try inserting one by one as fallback
                    for single in batch:
                        try:
                            sdata = json.dumps([single]).encode("utf-8")
                            sreq = urllib.request.Request(url, data=sdata, method="POST")
                            sreq.add_header("apikey", SUPABASE_SERVICE_KEY)
                            sreq.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
                            sreq.add_header("Content-Type", "application/json")
                            sreq.add_header("Prefer", "resolution=merge-duplicates")
                            with urllib.request.urlopen(sreq, timeout=30) as sr:
                                total_inserted += 1
                        except Exception as se:
                            errors += 1
                    break
                else:
                    time.sleep(0.5)
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"    Error: {e}")
                    errors += len(batch)
                    break
                time.sleep(0.5)

        if (i // batch_size + 1) % 20 == 0:
            print(f"    Progress: {min(i + batch_size, len(records))}/{len(records)}...")

    return total_inserted, errors


# ============================================================
# MAIN MIGRATION
# ============================================================

def migrate_type(bubble_type):
    """Migrate a single Bubble type to Supabase."""
    config = TABLE_MAP[bubble_type]
    table = config["table"]
    field_map = config["fields"]

    print(f"\n{'='*60}")
    print(f"Migrating: {bubble_type} → {table}")
    print(f"{'='*60}")

    # 1. Fetch all records from Bubble
    print("  Fetching from Bubble...")
    records = fetch_all_records(bubble_type)

    if not records:
        print("  No records to migrate, skipping.")
        return 0, 0

    # 2. Transform records
    print(f"  Transforming {len(records)} records...")
    transformed = []
    for r in records:
        try:
            t = transform_record(r, field_map)
            if t.get("bubble_id"):
                transformed.append(t)
        except Exception as e:
            print(f"    Transform error: {e}")

    # 3. Insert into Supabase
    print(f"  Inserting {len(transformed)} records into Supabase ({table})...")
    inserted, errors = supabase_upsert(table, transformed)
    print(f"  Done: {inserted} inserted, {errors} errors")

    return inserted, errors


def main():
    print("=" * 60)
    print("  BUBBLE.IO → SUPABASE MIGRATION")
    print("=" * 60)
    print(f"  Bubble API: {BUBBLE_API_BASE}")
    print(f"  Supabase:   {SUPABASE_URL}")
    print(f"  Tables:     {len(MIGRATION_ORDER)}")
    print("=" * 60)

    # Check if a specific type is requested
    if len(sys.argv) > 1:
        types_to_migrate = sys.argv[1:]
        print(f"\n  Migrating specific types: {types_to_migrate}")
    else:
        types_to_migrate = MIGRATION_ORDER

    total_inserted = 0
    total_errors = 0
    results = {}

    start_time = time.time()

    for bubble_type in types_to_migrate:
        if bubble_type not in TABLE_MAP:
            print(f"\n  WARNING: Unknown type '{bubble_type}', skipping.")
            continue

        try:
            inserted, errors = migrate_type(bubble_type)
            results[bubble_type] = {"inserted": inserted, "errors": errors}
            total_inserted += inserted
            total_errors += errors
        except Exception as e:
            print(f"\n  FATAL ERROR migrating {bubble_type}: {e}")
            results[bubble_type] = {"inserted": 0, "errors": -1, "error": str(e)}

    elapsed = time.time() - start_time

    # Summary
    print("\n" + "=" * 60)
    print("  MIGRATION SUMMARY")
    print("=" * 60)
    for t, r in results.items():
        status = "OK" if r.get("errors", 0) == 0 else f"ERRORS: {r.get('errors')}"
        print(f"  {t:30s} → {r.get('inserted', 0):>6} records  [{status}]")
    print(f"\n  Total inserted: {total_inserted}")
    print(f"  Total errors:   {total_errors}")
    print(f"  Time elapsed:   {elapsed:.1f}s")
    print("=" * 60)


if __name__ == "__main__":
    main()
