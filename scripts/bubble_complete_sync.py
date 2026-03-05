#!/usr/bin/env python3
"""
COMPLETE BUBBLE → SUPABASE SYNC
==================================================
Auto-generated on 2026-02-24 22:22:09
Data types: 97
Total fields: 1307

Fetches ALL records from ALL Bubble data types and upserts
into corresponding Supabase tables.
"""

import json
import urllib.request
import urllib.parse
import time
import sys
import re

# ============================================================
# CONFIGURATION
# ============================================================

BUBBLE_API_BASE = "https://app.joinbreasy.com/api/1.1/obj"
BUBBLE_API_KEY = "7d258f5f7c1d32d2f4003721719b68bb"

SUPABASE_URL = "https://caursmdeoghqixudiscb.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXJzbWRlb2docWl4dWRpc2NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM2MzE2MywiZXhwIjoyMDg2OTM5MTYzfQ.-7XA8EMwqZonb8SSR5EjALWmMOdjCM4wOnHcjss8lHQ"

PAGE_SIZE = 100
BATCH_SIZE = 50


# ============================================================
# COMPLETE TABLE DEFINITIONS
# 97 data types, auto-discovered from Bubble API
# ============================================================

TABLES = {
    # 1099 → b_1099 (7 fields)
    "1099": {
        "table": "b_1099",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "file": ("file", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "user": ("user_val", "text"),
            "year": ("year", "text"),
        },
    },
    # activity → b_activity (12 fields)
    "activity": {
        "table": "b_activity",
        "fields": {
            "_id": ("bubble_id", "text"),
            "activityType": ("activity_type", "text"),
            "associatedFulfillmentOwner": ("associated_fulfillment_owner", "text"),
            "associatedJob": ("associated_job", "text"),
            "body": ("body", "text"),
            "complete": ("complete", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateCompleted": ("date_completed", "timestamptz"),
            "jobStage": ("job_stage", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "Title": ("title", "text"),
        },
    },
    # appsetting → b_appsetting (6 fields)
    "appsetting": {
        "table": "b_appsetting",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "custCSVTemplate": ("cust_csvtemplate", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "smbCsvTemplate": ("smb_csv_template", "text"),
        },
    },
    # appusage → b_appusage (7 fields)
    "appusage": {
        "table": "b_appusage",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "page name": ("page_name", "text"),
            "type": ("type_val", "text"),
            "user": ("user_val", "text"),
        },
    },
    # backendworkflowlog → b_backendworkflowlog (0 fields)
    "backendworkflowlog": {
        "table": "b_backendworkflowlog",
        "fields": {
        },
    },
    # blogpost → b_blogpost (15 fields)
    "blogpost": {
        "table": "b_blogpost",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Body text": ("body_text", "text"),
            "category": ("category", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Description": ("description", "text"),
            "likes": ("likes", "integer"),
            "Main Image": ("main_image", "text"),
            "market": ("market", "text"),
            "markets": ("markets", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "saved": ("saved", "boolean"),
            "status": ("status", "text"),
            "timeToRead": ("time_to_read", "integer"),
            "Title": ("title", "text"),
        },
    },
    # calendarevent → b_calendarevent (12 fields)
    "calendarevent": {
        "table": "b_calendarevent",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Completed": ("completed", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "EndDateTime": ("end_date_time", "timestamptz"),
            "Event": ("event", "text"),
            "fulfillment owner": ("fulfillment_owner", "text"),
            "Job": ("job", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "owner": ("owner", "text"),
            "quote": ("quote", "text"),
            "StartDateTime": ("start_date_time", "timestamptz"),
        },
    },
    # call → b_call (0 fields)
    "call": {
        "table": "b_call",
        "fields": {
        },
    },
    # chat → b_chat (8 fields)
    "chat": {
        "table": "b_chat",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "last message": ("last_message", "text"),
            "messages": ("messages", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "participants": ("participants", "text[]"),
            "smb phone": ("smb_phone", "text"),
        },
    },
    # chat-message → b_chat_message (11 fields)
    "chat-message": {
        "table": "b_chat_message",
        "fields": {
            "_id": ("bubble_id", "text"),
            "attachements": ("attachements", "text[]"),
            "chat": ("chat", "text"),
            "content": ("content", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "inbound": ("inbound", "boolean"),
            "IsRead": ("is_read", "boolean"),
            "Modified Date": ("modified_date", "timestamptz"),
            "owner": ("owner", "text"),
            "source": ("source", "text"),
        },
    },
    # chatapp → b_chatapp (8 fields)
    "chatapp": {
        "table": "b_chatapp",
        "fields": {
            "_id": ("bubble_id", "text"),
            "active": ("active", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "job": ("job", "text"),
            "messages": ("messages", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "users": ("users", "text[]"),
        },
    },
    # chatmessages → b_chatmessages (13 fields)
    "chatmessages": {
        "table": "b_chatmessages",
        "fields": {
            "_id": ("bubble_id", "text"),
            "audio": ("audio", "text"),
            "chat": ("chat", "text"),
            "completion button": ("completion_button", "boolean"),
            "content": ("content", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "file": ("file", "text"),
            "image": ("image", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "quote button": ("quote_button", "boolean"),
            "read": ("read", "boolean"),
            "type": ("type_val", "text"),
        },
    },
    # clicks → b_clicks (0 fields)
    "clicks": {
        "table": "b_clicks",
        "fields": {
        },
    },
    # completion → b_completion (23 fields)
    "completion": {
        "table": "b_completion",
        "fields": {
            "[old] completionNextService": ("[old]_completion_next_service", "text"),
            "[old] fulfillmentApproved": ("[old]_fulfillment_approved", "boolean"),
            "[old] fulfillmentApprovedBy": ("[old]_fulfillment_approved_by", "text"),
            "_id": ("bubble_id", "text"),
            "added by": ("added_by", "text"),
            "assignedfulfillmentuser": ("assignedfulfillmentuser", "text"),
            "associatedJob": ("associated_job", "text"),
            "associatedSmbUser": ("associated_smb_user", "text"),
            "completionAfterPhotos": ("completion_after_photos", "text[]"),
            "completionBeforePhotos": ("completion_before_photos", "text[]"),
            "completionDuration": ("completion_duration", "text"),
            "completionRecommendation": ("completion_recommendation", "text"),
            "completionSmbName": ("completion_smb_name", "text"),
            "completionSmbPhone": ("completion_smb_phone", "text"),
            "completionSummary": ("completion_summary", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateCompleted": ("date_completed", "timestamptz"),
            "dateFulfillmentApproved": ("date_fulfillment_approved", "timestamptz"),
            "isAccepted": ("is_accepted", "boolean"),
            "markup": ("markup", "numeric"),
            "Modified Date": ("modified_date", "timestamptz"),
            "source": ("source", "text"),
        },
    },
    # conversation → b_conversation (16 fields)
    "conversation": {
        "table": "b_conversation",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedExternalUser": ("associated_external_user", "text"),
            "associatedInternalUser": ("associated_internal_user", "text"),
            "associatedMarkets": ("associated_markets", "text[]"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "externalPhoneNo": ("external_phone_no", "text"),
            "job": ("job", "text"),
            "jobAddress": ("job_address", "jsonb"),
            "jobWorkOrder": ("job_work_order", "text"),
            "messages": ("messages", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "relatedConversationJob": ("related_conversation_job", "text[]"),
            "relatedMessagesAssignedWOs": ("related_messages_assigned_wos", "text[]"),
            "smb": ("smb", "text"),
            "unread": ("unread", "boolean"),
        },
    },
    # custcontactintent → b_custcontactintent (13 fields)
    "custcontactintent": {
        "table": "b_custcontactintent",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedContact": ("associated_contact", "text"),
            "contactCreated": ("contact_created", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "email": ("email", "text"),
            "erroroncreate": ("erroroncreate", "boolean"),
            "firstName": ("first_name", "text"),
            "jobTitle": ("job_title", "text"),
            "lastName": ("last_name", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "org": ("org", "text"),
            "phone": ("phone", "text"),
        },
    },
    # customercontact → b_customercontact (7 fields)
    "customercontact": {
        "table": "b_customercontact",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "email": ("email", "text"),
            "full name": ("full_name", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "phone number": ("phone_number", "integer"),
        },
    },
    # customerscorecard → b_customerscorecard (8 fields)
    "customerscorecard": {
        "table": "b_customerscorecard",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "customerOrg": ("customer_org", "text"),
            "Job": ("job", "text"),
            "jobCreatedDate": ("job_created_date", "timestamptz"),
            "jobstage": ("jobstage", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
        },
    },
    # duplicatedinvoices → b_duplicatedinvoices (12 fields)
    "duplicatedinvoices": {
        "table": "b_duplicatedinvoices",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "invoiceCreatedDate": ("invoice_created_date", "timestamptz"),
            "invoiceNumber": ("invoice_number", "text"),
            "invoiceStatus": ("invoice_status", "text"),
            "invoiceType": ("invoice_type", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "relatedJob": ("related_job", "text"),
            "totalAmountCustomer": ("total_amount_customer", "integer"),
            "totalAmountSMB": ("total_amount_smb", "integer"),
            "workOrder": ("work_order", "text"),
        },
    },
    # duplicateinvoicerf → b_duplicateinvoicerf (23 fields)
    "duplicateinvoicerf": {
        "table": "b_duplicateinvoicerf",
        "fields": {
            "_id": ("bubble_id", "text"),
            "amountCustPrice": ("amount_cust_price", "integer"),
            "amountSmbPayout": ("amount_smb_payout", "integer"),
            "associatedCustOrg": ("associated_cust_org", "text"),
            "associatedSmb": ("associated_smb", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateCustInvoiceDue": ("date_cust_invoice_due", "timestamptz"),
            "dateJobCompleted": ("date_job_completed", "timestamptz"),
            "dateJobCompletionConfirmed": ("date_job_completion_confirmed", "timestamptz"),
            "dateSentToAP": ("date_sent_to_ap", "timestamptz"),
            "invoiceJob": ("invoice_job", "text"),
            "invoiceNumber": ("invoice_number", "text"),
            "invoiceQuote": ("invoice_quote", "text"),
            "invoiceStatus": ("invoice_status", "text"),
            "invoiceType": ("invoice_type", "text"),
            "jobWorkOrder": ("job_work_order", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "smbAddressCity": ("smb_address_city", "text"),
            "smbAddressState": ("smb_address_state", "text"),
            "smbAddressStreet": ("smb_address_street", "text"),
            "smbAddressZipcode": ("smb_address_zipcode", "integer"),
            "smbName": ("smb_name", "text"),
            "smbPhone": ("smb_phone", "text"),
        },
    },
    # duplicatejob → b_duplicatejob (0 fields)
    "duplicatejob": {
        "table": "b_duplicatejob",
        "fields": {
        },
    },
    # duplicatejobservice → b_duplicatejobservice (14 fields)
    "duplicatejobservice": {
        "table": "b_duplicatejobservice",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "customerPrice": ("customer_price", "integer"),
            "markup": ("markup", "numeric"),
            "Modified Date": ("modified_date", "timestamptz"),
            "serviceJob": ("service_job", "text"),
            "serviceMarket": ("service_market", "text"),
            "serviceSmbHours": ("service_smb_hours", "integer"),
            "serviceSmbRate": ("service_smb_rate", "integer"),
            "serviceSuggestedHours": ("service_suggested_hours", "integer"),
            "serviceSuggestedRate": ("service_suggested_rate", "integer"),
            "serviceType": ("service_type", "text"),
            "smbTotalCost": ("smb_total_cost", "integer"),
        },
    },
    # duplicatenextstep → b_duplicatenextstep (14 fields)
    "duplicatenextstep": {
        "table": "b_duplicatenextstep",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedFulfillmentUser": ("associated_fulfillment_user", "text"),
            "associatedJob": ("associated_job", "text"),
            "blocked": ("blocked", "boolean"),
            "Created Date": ("created_date", "timestamptz"),
            "dateCompleted": ("date_completed", "timestamptz"),
            "dateDue": ("date_due", "timestamptz"),
            "dueDateText": ("due_date_text", "text"),
            "jobWorkorder": ("job_workorder", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "nextStepDetails": ("next_step_details", "text"),
            "nextStepType": ("next_step_type", "text"),
            "taskJobStage": ("task_job_stage", "text"),
            "taskStatus": ("task_status", "text"),
        },
    },
    # duplicatequote → b_duplicatequote (20 fields)
    "duplicatequote": {
        "table": "b_duplicatequote",
        "fields": {
            "_id": ("bubble_id", "text"),
            "amountCostOfMaterials": ("amount_cost_of_materials", "integer"),
            "amountCustomerCalculation": ("amount_customer_calculation", "numeric"),
            "amountCustomerMarkup": ("amount_customer_markup", "numeric"),
            "amountCustomerTotal": ("amount_customer_total", "integer"),
            "amountSmbLabor": ("amount_smb_labor", "integer"),
            "amountSmbTotal": ("amount_smb_total", "integer"),
            "associatedSmbOrg": ("associated_smb_org", "text"),
            "associatedSmbUser": ("associated_smb_user", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateSmbSubmitted": ("date_smb_submitted", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "onsiteNote": ("onsite_note", "text"),
            "onsitePhotos": ("onsite_photos", "text[]"),
            "quoteAdditionalRecommendations": ("quote_additional_recommendations", "text"),
            "quoteExpectedTimeToCompletion": ("quote_expected_time_to_completion", "text"),
            "quoteScopeOfWork": ("quote_scope_of_work", "text"),
            "quoteSmbName": ("quote_smb_name", "text"),
            "quoteSmbPhone": ("quote_smb_phone", "text"),
            "status": ("status", "text"),
        },
    },
    # dynamicsmbtablecache → b_dynamicsmbtablecache (6 fields)
    "dynamicsmbtablecache": {
        "table": "b_dynamicsmbtablecache",
        "fields": {
            "_id": ("bubble_id", "text"),
            "cache": ("cache", "jsonb"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "n8n_query_count": ("n8n_query_count", "integer"),
        },
    },
    # email → b_email (21 fields)
    "email": {
        "table": "b_email",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "emailBody": ("email_body", "text"),
            "emailFileAttachments": ("email_file_attachments", "text[]"),
            "emailSubject": ("email_subject", "text"),
            "emailType": ("email_type", "text"),
            "isRead": ("is_read", "boolean"),
            "isStarred": ("is_starred", "boolean"),
            "jobWorkOrder": ("job_work_order", "text"),
            "messageID": ("message_id", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "readBy": ("read_by", "text"),
            "Receiver": ("receiver", "text"),
            "receiverEmail": ("receiver_email", "text"),
            "receiverName": ("receiver_name", "text"),
            "relatedFulfillmentOwner": ("related_fulfillment_owner", "text"),
            "Sender": ("sender", "text"),
            "senderEmail": ("sender_email", "text"),
            "senderName": ("sender_name", "text"),
            "slackNotificationSent": ("slack_notification_sent", "boolean"),
        },
    },
    # feedback → b_feedback (7 fields)
    "feedback": {
        "table": "b_feedback",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "description": ("description", "text"),
            "job-workorder": ("job_workorder", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "type": ("type_val", "text"),
        },
    },
    # feedback-fa → b_feedback_fa (13 fields)
    "feedback-fa": {
        "table": "b_feedback_fa",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Description": ("description", "text"),
            "Expected behavior ": ("expected_behavior", "text"),
            "id": ("id", "text"),
            "Issue type": ("issue_type", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "Platform area": ("platform_area", "text"),
            "Priority": ("priority", "text"),
            "Title": ("title", "text"),
            "user": ("user_val", "text"),
            "what caused the issue": ("what_caused_the_issue", "text"),
        },
    },
    # foactivitystats → b_foactivitystats (16 fields)
    "foactivitystats": {
        "table": "b_foactivitystats",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "custCall": ("cust_call", "integer"),
            "custEmail": ("cust_email", "integer"),
            "custSMS": ("cust_sms", "integer"),
            "fulfillmentName": ("fulfillment_name", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "Others": ("others", "integer"),
            "portalUpdate": ("portal_update", "integer"),
            "relatedUser": ("related_user", "text"),
            "smbCall": ("smb_call", "integer"),
            "smbEmail": ("smb_email", "integer"),
            "smbSMS": ("smb_sms", "integer"),
            "tenantCall": ("tenant_call", "integer"),
            "tenantSMS": ("tenant_sms", "integer"),
        },
    },
    # formsviewmorejobscount → b_formsviewmorejobscount (6 fields)
    "formsviewmorejobscount": {
        "table": "b_formsviewmorejobscount",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "job": ("job", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "user": ("user_val", "text"),
        },
    },
    # fulfillmentanalytics → b_fulfillmentanalytics (14 fields)
    "fulfillmentanalytics": {
        "table": "b_fulfillmentanalytics",
        "fields": {
            "_id": ("bubble_id", "text"),
            "breasyProfit": ("breasy_profit", "integer"),
            "closedLost": ("closed_lost", "integer"),
            "closedWon": ("closed_won", "integer"),
            "closedWonRevenue%": ("closed_won_revenue%", "integer"),
            "Completion%": ("completion%", "integer"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Date": ("date_val", "timestamptz"),
            "fulfillmentOwner": ("fulfillment_owner", "text"),
            "lostRevenue": ("lost_revenue", "numeric"),
            "Modified Date": ("modified_date", "timestamptz"),
            "smbQuoteAmount": ("smb_quote_amount", "numeric"),
            "wonRevenue": ("won_revenue", "numeric"),
        },
    },
    # holdsmbcsv → b_holdsmbcsv (15 fields)
    "holdsmbcsv": {
        "table": "b_holdsmbcsv",
        "fields": {
            "_id": ("bubble_id", "text"),
            "City": ("city", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "EIN": ("ein", "text"),
            "Hubspot ID": ("hubspot_id", "text"),
            "Hubspot URL": ("hubspot_url", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "Organization Bio": ("organization_bio", "text"),
            "Organization Name": ("organization_name", "text"),
            "State": ("state", "text"),
            "Street": ("street", "text"),
            "Vendor Portal URL": ("vendor_portal_url", "text"),
            "Website": ("website", "text"),
            "Zip": ("zip", "integer"),
        },
    },
    # invoice → b_invoice (17 fields)
    "invoice": {
        "table": "b_invoice",
        "fields": {
            "_id": ("bubble_id", "text"),
            "amountCustPrice": ("amount_cust_price", "integer"),
            "amountSmbPrice": ("amount_smb_price", "integer"),
            "associatedCustOrg": ("associated_cust_org", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateDue": ("date_due", "timestamptz"),
            "dateJobCompleted": ("date_job_completed", "timestamptz"),
            "dateJobCompletionConfirmed": ("date_job_completion_confirmed", "timestamptz"),
            "invoiceJob": ("invoice_job", "text"),
            "invoiceNumber": ("invoice_number", "text"),
            "invoiceStatus": ("invoice_status", "text"),
            "invoiceType": ("invoice_type", "text"),
            "jobWorkOrder": ("job_work_order", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "smbName": ("smb_name", "text"),
            "smbPhone": ("smb_phone", "text"),
        },
    },
    # job → b_job (65 fields)
    "job": {
        "table": "b_job",
        "fields": {
            "_id": ("bubble_id", "text"),
            "acceptedCompletion": ("accepted_completion", "text"),
            "acceptedQuote": ("accepted_quote", "text"),
            "activeactivity(updated)": ("activeactivityupdated", "text[]"),
            "activeNextStep": ("active_next_step", "text"),
            "addressGeo": ("address_geo", "jsonb"),
            "amountCostOfMaterials": ("amount_cost_of_materials", "integer"),
            "amountCustPrice": ("amount_cust_price", "integer"),
            "amountMarkup": ("amount_markup", "numeric"),
            "amountSmbPrice": ("amount_smb_price", "integer"),
            "assignedCustOrg": ("assigned_cust_org", "text"),
            "assignedCustUser": ("assigned_cust_user", "text"),
            "assignedFulfillmentUser": ("assigned_fulfillment_user", "text"),
            "assignedSmbUser": ("assigned_smb_user", "text"),
            "associatedActivities(updated)": ("associated_activitiesupdated", "text[]"),
            "associatedCustInvoice": ("associated_cust_invoice", "text"),
            "associatedNextSteps": ("associated_next_steps", "text[]"),
            "associatedQuotes": ("associated_quotes", "text[]"),
            "associatedSmbPayment": ("associated_smb_payment", "text"),
            "blocked": ("blocked", "boolean"),
            "closedDetails": ("closed_details", "text"),
            "closedReason": ("closed_reason", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateClosed": ("date_closed", "timestamptz"),
            "dateClosedTxt": ("date_closed_txt", "text"),
            "dateCustInvoiceDue": ("date_cust_invoice_due", "timestamptz"),
            "dateCustInvoiceSent": ("date_cust_invoice_sent", "timestamptz"),
            "dateCustQuoteSent": ("date_cust_quote_sent", "timestamptz"),
            "dateFulfillmentConfirmedCompletion": ("date_fulfillment_confirmed_completion", "timestamptz"),
            "dateQuoteScheduled": ("date_quote_scheduled", "timestamptz"),
            "dateQuoteScheduledTxt": ("date_quote_scheduled_txt", "text"),
            "dateSmbConfirmedPaid": ("date_smb_confirmed_paid", "timestamptz"),
            "dateSmbQuoteRecieved": ("date_smb_quote_recieved", "timestamptz"),
            "dateSmbSentToAP": ("date_smb_sent_to_ap", "timestamptz"),
            "dateWorkCompleted": ("date_work_completed", "timestamptz"),
            "dateWorkScheduled": ("date_work_scheduled", "timestamptz"),
            "dateWorkScheduledTxt": ("date_work_scheduled_txt", "text"),
            "hubspotDealClosed": ("hubspot_deal_closed", "boolean"),
            "hubspotDealId": ("hubspot_deal_id", "text"),
            "hubspotDealIdInserted": ("hubspot_deal_id_inserted", "boolean"),
            "invoiceSmbInvoice": ("invoice_smb_invoice", "text"),
            "jobCustPhotos": ("job_cust_photos", "text[]"),
            "jobDescription": ("job_description", "text"),
            "jobID": ("job_id", "integer"),
            "jobInvoiceNo": ("job_invoice_no", "text"),
            "jobMarket": ("job_market", "text"),
            "jobServicesList": ("job_services_list", "text[]"),
            "jobWorkOrder": ("job_work_order", "text"),
            "lastActivity": ("last_activity", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "occupiedFirst": ("occupied_first", "text"),
            "occupiedLast": ("occupied_last", "text"),
            "occupiedNote": ("occupied_note", "text"),
            "occupiedPhone": ("occupied_phone", "text"),
            "published SMBs": ("published_smbs", "text[]"),
            "quoteCustScopeOfWork": ("quote_cust_scope_of_work", "text"),
            "quoteSmbScopeOfWork": ("quote_smb_scope_of_work", "text"),
            "smbPaymentStatusZapier": ("smb_payment_status_zapier", "text"),
            "statusCustInvoice": ("status_cust_invoice", "text"),
            "statusCustQuote": ("status_cust_quote", "text"),
            "statusJobCompletion": ("status_job_completion", "text"),
            "statusJobStage": ("status_job_stage", "text"),
            "statusSmbQuote": ("status_smb_quote", "text"),
            "timeToQuote": ("time_to_quote", "numeric"),
        },
    },
    # jobrequest → b_jobrequest (22 fields)
    "jobrequest": {
        "table": "b_jobrequest",
        "fields": {
            "_id": ("bubble_id", "text"),
            "additionalDetails": ("additional_details", "text"),
            "address": ("address", "jsonb"),
            "budget": ("budget", "integer"),
            "contactName": ("contact_name", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "email": ("email", "text"),
            "endPage": ("end_page", "text"),
            "highEstimatePrice": ("high_estimate_price", "integer"),
            "highEstimateReason": ("high_estimate_reason", "text"),
            "lowEstimatePrice": ("low_estimate_price", "integer"),
            "lowEstimateReason": ("low_estimate_reason", "text"),
            "market": ("market", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "optIn": ("opt_in", "boolean"),
            "phone": ("phone", "text"),
            "recurring": ("recurring", "text"),
            "role": ("role", "text"),
            "services": ("services", "text[]"),
            "superServices": ("super_services", "text[]"),
            "urgency": ("urgency", "text"),
        },
    },
    # jobrequestqualitymetrics → b_jobrequestqualitymetrics (15 fields)
    "jobrequestqualitymetrics": {
        "table": "b_jobrequestqualitymetrics",
        "fields": {
            "_id": ("bubble_id", "text"),
            "budget_missing": ("budget_missing", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "eligible_smbs": ("eligible_smbs", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "n8n_description_rating": ("n8n_description_rating", "integer"),
            "pmc_compl_%": ("pmc_compl_%", "integer"),
            "pmc_jobs_to_date": ("pmc_jobs_to_date", "integer"),
            "site_images_missing": ("site_images_missing", "boolean"),
            "smb_compl_%s": ("smb_compl_%s", "text[]"),
            "smb_distances": ("smb_distances", "text[]"),
            "warning_no_smbs_in_range_30mi": ("warning_no_smbs_in_range_30mi", "boolean"),
            "warning_no_smbs_with_80%": ("warning_no_smbs_with_80%", "boolean"),
            "warning_pmc_compl_below_50": ("warning_pmc_compl_below_50", "boolean"),
        },
    },
    # jobservice → b_jobservice (15 fields)
    "jobservice": {
        "table": "b_jobservice",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "customerPrice": ("customer_price", "integer"),
            "jobWorkOrder": ("job_work_order", "text"),
            "markup": ("markup", "numeric"),
            "Modified Date": ("modified_date", "timestamptz"),
            "serviceJob": ("service_job", "text"),
            "serviceMarket": ("service_market", "text"),
            "serviceSmbHours": ("service_smb_hours", "integer"),
            "serviceSmbRate": ("service_smb_rate", "integer"),
            "serviceSuggestedHours": ("service_suggested_hours", "integer"),
            "serviceSuggestedRate": ("service_suggested_rate", "integer"),
            "serviceType": ("service_type", "text"),
            "smbTotalCost": ("smb_total_cost", "integer"),
        },
    },
    # landingpagereview → b_landingpagereview (7 fields)
    "landingpagereview": {
        "table": "b_landingpagereview",
        "fields": {
            "_id": ("bubble_id", "text"),
            "content": ("content", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "job": ("job", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "user": ("user_val", "text"),
        },
    },
    # landingpageteam → b_landingpageteam (0 fields)
    "landingpageteam": {
        "table": "b_landingpageteam",
        "fields": {
        },
    },
    # leads → b_leads (8 fields)
    "leads": {
        "table": "b_leads",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "email": ("email", "text"),
            "message": ("message", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "name": ("name", "text"),
            "phone": ("phone", "text"),
        },
    },
    # managertask → b_managertask (11 fields)
    "managertask": {
        "table": "b_managertask",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedjob": ("associatedjob", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Description ": ("description", "text"),
            "issue": ("issue", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "notify": ("notify", "text[]"),
            "reviewed": ("reviewed", "boolean"),
            "stage": ("stage", "text"),
            "workorder": ("workorder", "text"),
        },
    },
    # mapboxdynamicsmbtablecache → b_mapboxdynamicsmbtablecache (6 fields)
    "mapboxdynamicsmbtablecache": {
        "table": "b_mapboxdynamicsmbtablecache",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "mbcache": ("mbcache", "jsonb"),
            "Modified Date": ("modified_date", "timestamptz"),
            "n8n_query_count": ("n8n_query_count", "integer"),
        },
    },
    # marketingfaq → b_marketingfaq (8 fields)
    "marketingfaq": {
        "table": "b_marketingfaq",
        "fields": {
            "_id": ("bubble_id", "text"),
            "active": ("active", "boolean"),
            "Answer": ("answer", "text"),
            "audience": ("audience", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "Question": ("question", "text"),
        },
    },
    # marketingtestimonial → b_marketingtestimonial (9 fields)
    "marketingtestimonial": {
        "table": "b_marketingtestimonial",
        "fields": {
            "_id": ("bubble_id", "text"),
            "active": ("active", "boolean"),
            "audience": ("audience", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "display name": ("display_name", "text"),
            "market": ("market", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "text": ("text", "text"),
        },
    },
    # markettwins(lut) → b_markettwinslut (6 fields)
    "markettwins(lut)": {
        "table": "b_markettwinslut",
        "fields": {
            "_id": ("bubble_id", "text"),
            "address": ("address", "jsonb"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "linked_option": ("linked_option", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
        },
    },
    # message → b_message (11 fields)
    "message": {
        "table": "b_message",
        "fields": {
            "_id": ("bubble_id", "text"),
            "content": ("content", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "direction": ("direction", "text"),
            "fromPhone": ("from_phone", "text"),
            "messageDate": ("message_date", "timestamptz"),
            "messageNote": ("message_note", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "relatedNote": ("related_note", "text"),
            "sender": ("sender", "text"),
        },
    },
    # monthgoalsbreasy → b_monthgoalsbreasy (6 fields)
    "monthgoalsbreasy": {
        "table": "b_monthgoalsbreasy",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associated_date--roundToMonthUSMountainPlus12Hours": ("associated_date_round_to_month_usmountain_plus12_hours", "timestamptz"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "gp_goal": ("gp_goal", "integer"),
            "Modified Date": ("modified_date", "timestamptz"),
        },
    },
    # monthgoalsmarket → b_monthgoalsmarket (8 fields)
    "monthgoalsmarket": {
        "table": "b_monthgoalsmarket",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associated_date--roundToMonthUSMountainPlus12Hours": ("associated_date_round_to_month_usmountain_plus12_hours", "timestamptz"),
            "associated_market": ("associated_market", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "gp_goal": ("gp_goal", "integer"),
            "market_name--forSorting": ("market_name_for_sorting", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
        },
    },
    # monthgoalsmm → b_monthgoalsmm (8 fields)
    "monthgoalsmm": {
        "table": "b_monthgoalsmm",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associated_date--roundToMonthUSMountainPlus12Hours": ("associated_date_round_to_month_usmountain_plus12_hours", "timestamptz"),
            "associated_mm": ("associated_mm", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "gp_goal": ("gp_goal", "integer"),
            "mm_first_name--forSorting": ("mm_first_name_for_sorting", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
        },
    },
    # nextstep → b_nextstep (14 fields)
    "nextstep": {
        "table": "b_nextstep",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedFulfillmentUser": ("associated_fulfillment_user", "text"),
            "associatedJob": ("associated_job", "text"),
            "blocked": ("blocked", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateCompleted": ("date_completed", "timestamptz"),
            "dateDue": ("date_due", "timestamptz"),
            "dueDateText": ("due_date_text", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "nextStepDetails": ("next_step_details", "text"),
            "nextStepType": ("next_step_type", "text"),
            "taskJobStage": ("task_job_stage", "text"),
            "taskStatus": ("task_status", "text"),
        },
    },
    # nextstepsmb → b_nextstepsmb (14 fields)
    "nextstepsmb": {
        "table": "b_nextstepsmb",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedFulfillmentUser": ("associated_fulfillment_user", "text"),
            "blocked": ("blocked", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateCompleted": ("date_completed", "timestamptz"),
            "dateDue": ("date_due", "timestamptz"),
            "dueDateText": ("due_date_text", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "nextStepDetails": ("next_step_details", "text"),
            "nextStepType": ("next_step_type", "text"),
            "relatedOrganization": ("related_organization", "text"),
            "taskManager": ("task_manager", "text"),
            "taskStatus": ("task_status", "text"),
        },
    },
    # note → b_note (9 fields)
    "note": {
        "table": "b_note",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedjob": ("associatedjob", "text"),
            "associatedOrg": ("associated_org", "text"),
            "body": ("body", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "file": ("file", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "noteType": ("note_type", "text"),
        },
    },
    # notification-joy → b_notification_joy (10 fields)
    "notification-joy": {
        "table": "b_notification_joy",
        "fields": {
            "_id": ("bubble_id", "text"),
            "completed": ("completed", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "job": ("job", "text"),
            "message": ("message", "text"),
            "MM": ("mm", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "type": ("type_val", "text"),
            "users": ("users", "text[]"),
        },
    },
    # notifications → b_notifications (12 fields)
    "notifications": {
        "table": "b_notifications",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Content": ("content", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "Read": ("read", "boolean"),
            "Receiver": ("receiver", "text"),
            "relatedEmail": ("related_email", "text"),
            "relatedJob": ("related_job", "text"),
            "relatedMessage": ("related_message", "text"),
            "Sender": ("sender", "text"),
            "Type": ("type_val", "text"),
        },
    },
    # organization → b_organization (93 fields)
    "organization": {
        "table": "b_organization",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedActivities": ("associated_activities", "text[]"),
            "associatedJobs": ("associated_jobs", "text[]"),
            "associatedPrimaryContact": ("associated_primary_contact", "text"),
            "associatedUsers": ("associated_users", "text[]"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "custApEmail": ("cust_ap_email", "text"),
            "custApPaymentDiscount": ("cust_ap_payment_discount", "numeric"),
            "custApPaymentMethod": ("cust_ap_payment_method", "text"),
            "custApPaymentTerms": ("cust_ap_payment_terms", "text"),
            "custApSource": ("cust_ap_source", "text"),
            "custAssociatedApContact": ("cust_associated_ap_contact", "text"),
            "custAssociatedApprovalContact": ("cust_associated_approval_contact", "text"),
            "custAssociatedCoordinatorContact": ("cust_associated_coordinator_contact", "text"),
            "custBillToAddress": ("cust_bill_to_address", "jsonb"),
            "custFactoringApproved": ("cust_factoring_approved", "boolean"),
            "custFactoringSetUp": ("cust_factoring_set_up", "boolean"),
            "custInvoicedAllClosed": ("cust_invoiced_all_closed", "numeric"),
            "custInvoicedClosedLost": ("cust_invoiced_closed_lost", "numeric"),
            "custInvoicedClosedWon": ("cust_invoiced_closed_won", "numeric"),
            "custPropertyTypes": ("cust_property_types", "text[]"),
            "custTier": ("cust_tier", "text"),
            "custVendorPortalURL": ("cust_vendor_portal_url", "text"),
            "dateAgreedToCommunications": ("date_agreed_to_communications", "timestamptz"),
            "dateLastComplete": ("date_last_complete", "timestamptz"),
            "dateLastCW": ("date_last_cw", "timestamptz"),
            "dateLastPublished": ("date_last_published", "timestamptz"),
            "dateLastSentOrAssigned": ("date_last_sent_or_assigned", "timestamptz"),
            "lifecycleActiveComplete": ("lifecycle_active_complete", "boolean"),
            "lifecycleActiveSent": ("lifecycle_active_sent", "boolean"),
            "lifecycleCompletedWO": ("lifecycle_completed_wo", "boolean"),
            "lifecycleSentWorkorder": ("lifecycle_sent_workorder", "boolean"),
            "lifecycleStage": ("lifecycle_stage", "text"),
            "lifecycleStagePrev": ("lifecycle_stage_prev", "text"),
            "mercuryStatus": ("mercury_status", "text"),
            "metricComplPerc": ("metric_compl_perc", "numeric"),
            "metricCwRevPerc": ("metric_cw_rev_perc", "numeric"),
            "metricGoalWeeklyJobVolume": ("metric_goal_weekly_job_volume", "text"),
            "metricPaymentCount": ("metric_payment_count", "integer"),
            "metricSmbRevCurrentPerWeek": ("metric_smb_rev_current_per_week", "integer"),
            "metricSmbRevGoalPerWeek": ("metric_smb_rev_goal_per_week", "integer"),
            "metricTotalWoMatched": ("metric_total_wo_matched", "integer"),
            "metricWoCountAllClosed": ("metric_wo_count_all_closed", "integer"),
            "metricWoCountClosedLost": ("metric_wo_count_closed_lost", "integer"),
            "metricWoCountClosedWon": ("metric_wo_count_closed_won", "integer"),
            "metricWoCreatedAllTime": ("metric_wo_created_all_time", "integer"),
            "Modified Date": ("modified_date", "timestamptz"),
            "noteCust": ("note_cust", "text"),
            "noteFulfillment": ("note_fulfillment", "text"),
            "noteOrgBio": ("note_org_bio", "text"),
            "noteSmbPreferences": ("note_smb_preferences", "text"),
            "orgAddedVia": ("org_added_via", "text"),
            "orgAddressGeo": ("org_address_geo", "jsonb"),
            "orgAgreedToCommunications": ("org_agreed_to_communications", "text"),
            "orgFunction": ("org_function", "text"),
            "orgHubspotID": ("org_hubspot_id", "text"),
            "orgMarkets": ("org_markets", "text[]"),
            "orgName": ("org_name", "text"),
            "orgTier": ("org_tier", "text"),
            "orgWebsite": ("org_website", "text"),
            "READONLY_daysSinceComplete": ("readonly_days_since_complete", "integer"),
            "READONLY_daysSinceCW": ("readonly_days_since_cw", "integer"),
            "READONLY_daysSincePublished": ("readonly_days_since_published", "integer"),
            "READONLY_daysSinceSentOrAssigned": ("readonly_days_since_sent_or_assigned", "integer"),
            "smbAgreedToPaymentMethod": ("smb_agreed_to_payment_method", "text"),
            "smbAgreedToSmbSLA": ("smb_agreed_to_smb_sla", "text"),
            "smbAgreedToSubcontracting": ("smb_agreed_to_subcontracting", "text"),
            "smbApprovedForWork": ("smb_approved_for_work", "boolean"),
            "smbBankAccNum": ("smb_bank_acc_num", "integer"),
            "smbBankRouteNum": ("smb_bank_route_num", "integer"),
            "smbDateAgreedToPaymentMethod": ("smb_date_agreed_to_payment_method", "timestamptz"),
            "smbDateAgreedToSmbSla": ("smb_date_agreed_to_smb_sla", "timestamptz"),
            "smbDateAgreedToSubcontracting": ("smb_date_agreed_to_subcontracting", "timestamptz"),
            "smbDateApprovedForWork": ("smb_date_approved_for_work", "timestamptz"),
            "smbDateOrientationCallCompleted": ("smb_date_orientation_call_completed", "timestamptz"),
            "smbEIN": ("smb_ein", "integer"),
            "smbInsuranceExp": ("smb_insurance_exp", "timestamptz"),
            "smbInsuranceNum": ("smb_insurance_num", "text"),
            "smbLicenseExp": ("smb_license_exp", "timestamptz"),
            "smbLicenseNum": ("smb_license_num", "text"),
            "smbOrientationComplete": ("smb_orientation_complete", "text"),
            "smbPaymentAllClosed": ("smb_payment_all_closed", "numeric"),
            "smbPaymentClosedLost": ("smb_payment_closed_lost", "numeric"),
            "smbPaymentClosedWon": ("smb_payment_closed_won", "numeric"),
            "smbRequestedJob": ("smb_requested_job", "boolean"),
            "smbServices": ("smb_services", "text[]"),
            "smbSource": ("smb_source", "text"),
            "smbTierpointComplCount": ("smb_tierpoint_compl_count", "integer"),
            "smbTierpointComplPerc": ("smb_tierpoint_compl_perc", "integer"),
            "smbTierpointCwRevPerc": ("smb_tierpoint_cw_rev_perc", "integer"),
            "smbTierpointSmbPayment": ("smb_tierpoint_smb_payment", "integer"),
            "smbTierpointTotal": ("smb_tierpoint_total", "integer"),
        },
    },
    # payment → b_payment (15 fields)
    "payment": {
        "table": "b_payment",
        "fields": {
            "_id": ("bubble_id", "text"),
            "amountSmbPrice": ("amount_smb_price", "integer"),
            "associatedJob": ("associated_job", "text"),
            "associatedSmbOrg": ("associated_smb_org", "text"),
            "associatedSmbUser": ("associated_smb_user", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateSentToQuickbooks": ("date_sent_to_quickbooks", "timestamptz"),
            "jobAddress": ("job_address", "jsonb"),
            "jobWorkComplete": ("job_work_complete", "timestamptz"),
            "jobWorkOrder": ("job_work_order", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "paymentStatus": ("payment_status", "text"),
            "smbAddress": ("smb_address", "jsonb"),
            "zapTriggerSuccess": ("zap_trigger_success", "boolean"),
        },
    },
    # pricerecommendations → b_pricerecommendations (8 fields)
    "pricerecommendations": {
        "table": "b_pricerecommendations",
        "fields": {
            "_id": ("bubble_id", "text"),
            "avgClosedWonPrice": ("avg_closed_won_price", "integer"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "parentService": ("parent_service", "text"),
            "recommendedPrice": ("recommended_price", "integer"),
            "Service": ("service", "text"),
        },
    },
    # publishedsmbs → b_publishedsmbs (11 fields)
    "publishedsmbs": {
        "table": "b_publishedsmbs",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Accepted": ("accepted", "boolean"),
            "completed": ("completed", "boolean"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "job": ("job", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "Quotation date": ("quotation_date", "timestamptz"),
            "SMB ID": ("smb_id", "text"),
            "smbName": ("smb_name", "text"),
            "viewed": ("viewed", "boolean"),
        },
    },
    # pushnotification → b_pushnotification (9 fields)
    "pushnotification": {
        "table": "b_pushnotification",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "job": ("job", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "status": ("status", "text"),
            "sub text": ("sub_text", "text"),
            "Title": ("title", "text"),
            "user": ("user_val", "text"),
        },
    },
    # qarecord → b_qarecord (9 fields)
    "qarecord": {
        "table": "b_qarecord",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "success?": ("success", "boolean"),
            "success_futureSuggestion": ("success_future_suggestion", "text"),
            "success_mmScore": ("success_mm_score", "integer"),
            "success_pmcScore": ("success_pmc_score", "integer"),
            "success_smbScore": ("success_smb_score", "integer"),
        },
    },
    # quotelineitem → b_quotelineitem (15 fields)
    "quotelineitem": {
        "table": "b_quotelineitem",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedJob": ("associated_job", "text"),
            "associatedQuote": ("associated_quote", "text"),
            "changePrice?": ("change_price", "boolean"),
            "changePriceReason": ("change_price_reason", "text"),
            "costOfMaterial": ("cost_of_material", "numeric"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "description": ("description", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "n8n": ("n8n", "boolean"),
            "totalPrice": ("total_price", "integer"),
            "unit measurement": ("unit_measurement", "text"),
            "unitPrice": ("unit_price", "integer"),
            "unitQuantity": ("unit_quantity", "integer"),
        },
    },
    # response → b_response (0 fields)
    "response": {
        "table": "b_response",
        "fields": {
        },
    },
    # revenuegoals → b_revenuegoals (0 fields)
    "revenuegoals": {
        "table": "b_revenuegoals",
        "fields": {
        },
    },
    # scopetestdata → b_scopetestdata (0 fields)
    "scopetestdata": {
        "table": "b_scopetestdata",
        "fields": {
        },
    },
    # sectionengagementtrack → b_sectionengagementtrack (10 fields)
    "sectionengagementtrack": {
        "table": "b_sectionengagementtrack",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "createdDateTxt": ("created_date_txt", "text"),
            "Duration": ("duration", "integer"),
            "enterTime": ("enter_time", "timestamptz"),
            "leaveTime": ("leave_time", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "pageName": ("page_name", "text"),
            "relatedUser": ("related_user", "text"),
        },
    },
    # serviceticket → b_serviceticket (14 fields)
    "serviceticket": {
        "table": "b_serviceticket",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedCustCompany": ("associated_cust_company", "text"),
            "associatedJob": ("associated_job", "text"),
            "associatedMM": ("associated_mm", "text"),
            "associatedSmbOrg": ("associated_smb_org", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateResolved": ("date_resolved", "timestamptz"),
            "description": ("description", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "resolution": ("resolution", "text"),
            "serviceTicketCategory": ("service_ticket_category", "text"),
            "serviceTicketStatus": ("service_ticket_status", "text"),
            "ticketNotes": ("ticket_notes", "text"),
        },
    },
    # slackalytics → b_slackalytics (0 fields)
    "slackalytics": {
        "table": "b_slackalytics",
        "fields": {
        },
    },
    # smbav → b_smbav (9 fields)
    "smbav": {
        "table": "b_smbav",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "management tools": ("management_tools", "text"),
            "markets": ("markets", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "open availability": ("open_availability", "text"),
            "services": ("services", "text[]"),
            "user": ("user_val", "text"),
        },
    },
    # smbonboardintent → b_smbonboardintent (24 fields)
    "smbonboardintent": {
        "table": "b_smbonboardintent",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedSmbUser": ("associated_smb_user", "text"),
            "baselineWeeklyRevenue": ("baseline_weekly_revenue", "text"),
            "businessName": ("business_name", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "market": ("market", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "monthlyjobcmpl": ("monthlyjobcmpl", "integer"),
            "nameFirst": ("name_first", "text"),
            "nameLast": ("name_last", "text"),
            "pageExit": ("page_exit", "text"),
            "phone": ("phone", "text"),
            "revenueGoal": ("revenue_goal", "integer"),
            "smbPriority": ("smb_priority", "text"),
            "smbSource": ("smb_source", "text"),
            "sourceURL": ("source_url", "text"),
            "SuperServices": ("super_services", "text[]"),
            "user": ("user_val", "text"),
            "utmCampaign": ("utm_campaign", "text"),
            "utmMedium": ("utm_medium", "text"),
            "utmSource": ("utm_source", "text"),
            "utmTerm": ("utm_term", "text"),
            "website": ("website", "text"),
        },
    },
    # smbquestionnaire → b_smbquestionnaire (0 fields)
    "smbquestionnaire": {
        "table": "b_smbquestionnaire",
        "fields": {
        },
    },
    # smbquote → b_smbquote (20 fields)
    "smbquote": {
        "table": "b_smbquote",
        "fields": {
            "_id": ("bubble_id", "text"),
            "added by": ("added_by", "text"),
            "amountCostOfMaterials": ("amount_cost_of_materials", "integer"),
            "amountCustTotal": ("amount_cust_total", "integer"),
            "amountSmbTotal": ("amount_smb_total", "integer"),
            "associatedSmbUser": ("associated_smb_user", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "dateCompletionExpected": ("date_completion_expected", "timestamptz"),
            "dateQuoteSubmitted": ("date_quote_submitted", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "onsitePhotos": ("onsite_photos", "text[]"),
            "quoteAdditionalRecommendations": ("quote_additional_recommendations", "text"),
            "quoteExpectedMinutesTimeToComplete": ("quote_expected_minutes_time_to_complete", "integer"),
            "quoteExpectedTimeToComplete": ("quote_expected_time_to_complete", "text"),
            "quoteScopeOfWork": ("quote_scope_of_work", "text"),
            "quoteSmbName": ("quote_smb_name", "text"),
            "quoteSmbPhone": ("quote_smb_phone", "text"),
            "source": ("source", "text"),
            "statusQuote": ("status_quote", "text"),
        },
    },
    # smbrequest → b_smbrequest (22 fields)
    "smbrequest": {
        "table": "b_smbrequest",
        "fields": {
            "_id": ("bubble_id", "text"),
            "address": ("address", "jsonb"),
            "associatedJob": ("associated_job", "text"),
            "associatedPMC": ("associated_pmc", "text"),
            "associatedSmbOrg": ("associated_smb_org", "text"),
            "associatedSmbUser": ("associated_smb_user", "text"),
            "closedOppReason": ("closed_opp_reason", "text"),
            "closedWonReason": ("closed_won_reason", "text"),
            "Context": ("context", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "createdBy": ("created_by", "text"),
            "dateDeadline": ("date_deadline", "timestamptz"),
            "Market": ("market", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "Priority": ("priority", "text"),
            "requestOwner": ("request_owner", "text"),
            "Services": ("services", "text[]"),
            "specialRequest": ("special_request", "text"),
            "Stage": ("stage", "text"),
            "Status": ("status", "text"),
            "Type": ("type_val", "text"),
        },
    },
    # smbsmsblast → b_smbsmsblast (9 fields)
    "smbsmsblast": {
        "table": "b_smbsmsblast",
        "fields": {
            "_id": ("bubble_id", "text"),
            "activities": ("activities", "text[]"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "messages": ("messages", "text[]"),
            "messageText": ("message_text", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "orgs": ("orgs", "text[]"),
            "sentCount": ("sent_count", "integer"),
        },
    },
    # smstable → b_smstable (7 fields)
    "smstable": {
        "table": "b_smstable",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "last edited by": ("last_edited_by", "text"),
            "message": ("message", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "stage": ("stage", "text"),
        },
    },
    # snapshot_daily → b_snapshot_daily (10 fields)
    "snapshot_daily": {
        "table": "b_snapshot_daily",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "MarketSnapshotList": ("market_snapshot_list", "text[]"),
            "MMSnapshotList": ("mmsnapshot_list", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "OverallSnapshot": ("overall_snapshot", "text"),
            "PMCSnapshotList": ("pmcsnapshot_list", "text[]"),
            "recordDate": ("record_date", "timestamptz"),
            "SMBOrgSnapshotList": ("smborg_snapshot_list", "text[]"),
        },
    },
    # snapshot_market → b_snapshot_market (15 fields)
    "snapshot_market": {
        "table": "b_snapshot_market",
        "fields": {
            "_id": ("bubble_id", "text"),
            "agg-co_count": ("agg_co_count", "integer"),
            "agg-co_revenue": ("agg_co_revenue", "integer"),
            "agg-cw_count": ("agg_cw_count", "integer"),
            "agg-cw_revenue": ("agg_cw_revenue", "integer"),
            "agg-gross_profit": ("agg_gross_profit", "integer"),
            "agg-op-gross profit": ("agg_op_gross_profit", "integer"),
            "agg-service_types_requested_list": ("agg_service_types_requested_list", "text[]"),
            "closed_jobs": ("closed_jobs", "text[]"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "date": ("date_val", "timestamptz"),
            "market": ("market", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "open_jobs": ("open_jobs", "text[]"),
        },
    },
    # snapshot_mm → b_snapshot_mm (20 fields)
    "snapshot_mm": {
        "table": "b_snapshot_mm",
        "fields": {
            "_id": ("bubble_id", "text"),
            "agg-co_count": ("agg_co_count", "integer"),
            "agg-co_revenue": ("agg_co_revenue", "integer"),
            "agg-cw_count": ("agg_cw_count", "integer"),
            "agg-cw_revenue": ("agg_cw_revenue", "integer"),
            "agg-gross_profit": ("agg_gross_profit", "integer"),
            "agg-op-gross profit": ("agg_op_gross_profit", "integer"),
            "closed_jobs": ("closed_jobs", "text[]"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "date": ("date_val", "timestamptz"),
            "marketmanager": ("marketmanager", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "open_jobs": ("open_jobs", "text[]"),
            "snap-activities_added_count": ("snap_activities_added_count", "integer"),
            "snap-jobs_w_no_2_day_activity": ("snap_jobs_w_no_2_day_activity", "integer"),
            "snap-old_open_WOs_count": ("snap_old_open_wos_count", "integer"),
            "snap-open_WOs_count": ("snap_open_wos_count", "integer"),
            "snap-past_due_next_steps_count": ("snap_past_due_next_steps_count", "integer"),
            "snap-tomorrow_next_steps_count": ("snap_tomorrow_next_steps_count", "integer"),
        },
    },
    # snapshot_overall → b_snapshot_overall (25 fields)
    "snapshot_overall": {
        "table": "b_snapshot_overall",
        "fields": {
            "_id": ("bubble_id", "text"),
            "active_pmcs": ("active_pmcs", "text[]"),
            "active_smbs": ("active_smbs", "text[]"),
            "agg-co_count": ("agg_co_count", "integer"),
            "agg-co_revenue": ("agg_co_revenue", "integer"),
            "agg-cw_count": ("agg_cw_count", "integer"),
            "agg-cw_revenue": ("agg_cw_revenue", "integer"),
            "agg-gross_profit": ("agg_gross_profit", "integer"),
            "agg-MM_accepted_quoted_revenue": ("agg_mm_accepted_quoted_revenue", "integer"),
            "agg-op-gross profit": ("agg_op_gross_profit", "integer"),
            "agg-PMC_approved_revenue": ("agg_pmc_approved_revenue", "integer"),
            "closed_jobs": ("closed_jobs", "text[]"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "CW_pmcs_one_day": ("cw_pmcs_one_day", "text[]"),
            "CW_smbs_one_day": ("cw_smbs_one_day", "text[]"),
            "date": ("date_val", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "open_jobs": ("open_jobs", "text[]"),
            "snap-active_customers_count": ("snap_active_customers_count", "integer"),
            "snap-active_CW_customers_count": ("snap_active_cw_customers_count", "integer"),
            "snap-active_CW_SMBs_count": ("snap_active_cw_smbs_count", "integer"),
            "snap-active_SMBs_count": ("snap_active_smbs_count", "integer"),
            "snap-matched_SMBs_count": ("snap_matched_smbs_count", "integer"),
            "snap-open_wos_count": ("snap_open_wos_count", "integer"),
        },
    },
    # snapshot_pmc → b_snapshot_pmc (18 fields)
    "snapshot_pmc": {
        "table": "b_snapshot_pmc",
        "fields": {
            "_id": ("bubble_id", "text"),
            "agg-co_count": ("agg_co_count", "integer"),
            "agg-co_revenue": ("agg_co_revenue", "integer"),
            "agg-cw_count": ("agg_cw_count", "integer"),
            "agg-cw_revenue": ("agg_cw_revenue", "integer"),
            "agg-gross_profit": ("agg_gross_profit", "integer"),
            "agg-op-gross profit": ("agg_op_gross_profit", "integer"),
            "agg-services_requested": ("agg_services_requested", "text[]"),
            "closed_jobs": ("closed_jobs", "text[]"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "date": ("date_val", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "open_jobs": ("open_jobs", "text[]"),
            "pmc": ("pmc", "text"),
            "snap-old_wos_count": ("snap_old_wos_count", "integer"),
            "snap-open_wos_count": ("snap_open_wos_count", "integer"),
            "snap-past_due_quote_count": ("snap_past_due_quote_count", "integer"),
        },
    },
    # snapshot_smborg → b_snapshot_smborg (20 fields)
    "snapshot_smborg": {
        "table": "b_snapshot_smborg",
        "fields": {
            "_id": ("bubble_id", "text"),
            "agg-co_count": ("agg_co_count", "integer"),
            "agg-co_revenue": ("agg_co_revenue", "integer"),
            "agg-cw-revenue": ("agg_cw_revenue", "integer"),
            "agg-cw_count": ("agg_cw_count", "integer"),
            "agg-gross_profit": ("agg_gross_profit", "integer"),
            "agg-op-gross profit": ("agg_op_gross_profit", "integer"),
            "agg-op_payout_amount": ("agg_op_payout_amount", "integer"),
            "agg-won_payout_amount": ("agg_won_payout_amount", "integer"),
            "closed_jobs": ("closed_jobs", "text[]"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "date": ("date_val", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "open_jobs": ("open_jobs", "text[]"),
            "smbOrg": ("smb_org", "text"),
            "snap-completions_past_due_count": ("snap_completions_past_due_count", "integer"),
            "snap-old-wos_count": ("snap_old_wos_count", "integer"),
            "snap-open_wos_count": ("snap_open_wos_count", "integer"),
            "snap-quotes_past_due_count": ("snap_quotes_past_due_count", "integer"),
        },
    },
    # task → b_task (0 fields)
    "task": {
        "table": "b_task",
        "fields": {
        },
    },
    # tripcharge → b_tripcharge (9 fields)
    "tripcharge": {
        "table": "b_tripcharge",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "custPrice": ("cust_price", "numeric"),
            "job": ("job", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "photos": ("photos", "text[]"),
            "smbPrice": ("smb_price", "integer"),
            "whyTripCharge": ("why_trip_charge", "text"),
        },
    },
    # tripchargev2 → b_tripchargev2 (0 fields)
    "tripchargev2": {
        "table": "b_tripchargev2",
        "fields": {
        },
    },
    # twiliocall → b_twiliocall (0 fields)
    "twiliocall": {
        "table": "b_twiliocall",
        "fields": {
        },
    },
    # twilioconversation → b_twilioconversation (0 fields)
    "twilioconversation": {
        "table": "b_twilioconversation",
        "fields": {
        },
    },
    # twiliomessage → b_twiliomessage (0 fields)
    "twiliomessage": {
        "table": "b_twiliomessage",
        "fields": {
        },
    },
    # usagemetrics → b_usagemetrics (14 fields)
    "usagemetrics": {
        "table": "b_usagemetrics",
        "fields": {
            "_id": ("bubble_id", "text"),
            "allVisits": ("all_visits", "integer"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "elementName": ("element_name", "text"),
            "elementType": ("element_type", "text"),
            "Interaction": ("interaction", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "pageName": ("page_name", "text"),
            "Type": ("type_val", "text"),
            "uniqueVisits": ("unique_visits", "text[]"),
            "visitTimeDate": ("visit_time_date", "timestamptz"),
            "visitTimeDateTxt": ("visit_time_date_txt", "text"),
            "whoInteracted": ("who_interacted", "text"),
        },
    },
    # user → b_user (52 fields)
    "user": {
        "table": "b_user",
        "fields": {
            "_id": ("bubble_id", "text"),
            "authentication": ("authentication", "jsonb"),
            "contactAddedBy": ("contact_added_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "custContactHubspotID": ("cust_contact_hubspot_id", "text"),
            "custJobTitle": ("cust_job_title", "text"),
            "delete account": ("delete_account", "boolean"),
            "mmDialpadId": ("mm_dialpad_id", "text"),
            "mmJobPage": ("mm_job_page", "integer"),
            "mmSlackID": ("mm_slack_id", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "smb1099": ("smb1099", "text"),
            "smb_compl_date_count": ("smb_compl_date_count", "integer"),
            "smb_on_time_compl_count": ("smb_on_time_compl_count", "integer"),
            "smb_on_time_quote_count": ("smb_on_time_quote_count", "integer"),
            "smb_quote_date_count": ("smb_quote_date_count", "integer"),
            "smbApprovedForWork": ("smb_approved_for_work", "boolean"),
            "smbAssociatedSmbOnboardIntent": ("smb_associated_smb_onboard_intent", "text"),
            "smbDailyAvailability": ("smb_daily_availability", "text[]"),
            "smbNumOfHelpers": ("smb_num_of_helpers", "integer"),
            "smbNumOfTrucks": ("smb_num_of_trucks", "integer"),
            "smbServices": ("smb_services", "text[]"),
            "smbSource": ("smb_source", "text"),
            "smbSpecialEquipment&Notes": ("smb_special_equipment&notes", "text"),
            "smbW9": ("smb_w9", "text"),
            "user_signed_up": ("user_signed_up", "boolean"),
            "userAcceptTerms": ("user_accept_terms", "boolean"),
            "userAccountStatus": ("user_account_status", "text"),
            "userAddedBy": ("user_added_by", "text"),
            "userAddedVia": ("user_added_via", "text"),
            "userAlphaTester": ("user_alpha_tester", "boolean"),
            "userAssociatedActivities": ("user_associated_activities", "text[]"),
            "userAssociatedJobs": ("user_associated_jobs", "text[]"),
            "userAssociatedOrg": ("user_associated_org", "text"),
            "userBetaTester": ("user_beta_tester", "boolean"),
            "userContactEmail": ("user_contact_email", "text"),
            "userContactPhone": ("user_contact_phone", "text"),
            "userFirstName": ("user_first_name", "text"),
            "userFullName": ("user_full_name", "text"),
            "userFunction": ("user_function", "text"),
            "userLanguage": ("user_language", "text[]"),
            "userLastName": ("user_last_name", "text"),
            "userLifecycle": ("user_lifecycle", "text"),
            "userLoginCode": ("user_login_code", "integer"),
            "userLoginExpiration": ("user_login_expiration", "timestamptz"),
            "userLoginLastDate": ("user_login_last_date", "timestamptz"),
            "userMarkets": ("user_markets", "text[]"),
            "userProfilePic": ("user_profile_pic", "text"),
            "userRole": ("user_role", "text"),
            "userVerified": ("user_verified", "boolean"),
            "userVerifiedContact": ("user_verified_contact", "boolean"),
            "userVerifiedDetails": ("user_verified_details", "boolean"),
        },
    },
    # utmevent → b_utmevent (0 fields)
    "utmevent": {
        "table": "b_utmevent",
        "fields": {
        },
    },
    # utmviews → b_utmviews (9 fields)
    "utmviews": {
        "table": "b_utmviews",
        "fields": {
            "_id": ("bubble_id", "text"),
            "campaign": ("campaign", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "device": ("device", "text"),
            "medium": ("medium", "text"),
            "Modified Date": ("modified_date", "timestamptz"),
            "source": ("source", "text"),
            "term": ("term", "text"),
        },
    },
    # visit → b_visit (8 fields)
    "visit": {
        "table": "b_visit",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "tenant_last_viewed": ("tenant_last_viewed", "timestamptz"),
            "tenant_response_stage": ("tenant_response_stage", "integer"),
            "visitPermission": ("visit_permission", "text"),
            "visitType": ("visit_type", "text"),
        },
    },
    # weekly_stats_breasy → b_weekly_stats_breasy (57 fields)
    "weekly_stats_breasy": {
        "table": "b_weekly_stats_breasy",
        "fields": {
            "_id": ("bubble_id", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "DailiesMTD": ("dailies_mtd", "text[]"),
            "DailiesT30": ("dailies_t30", "text[]"),
            "DailiesWeek": ("dailies_week", "text[]"),
            "end_date": ("end_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "mtdAverageAmtPerWO": ("mtd_average_amt_per_wo", "numeric"),
            "mtdavgWOsPerCustomer": ("mtdavg_wos_per_customer", "numeric"),
            "mtdCompletionPerc": ("mtd_completion_perc", "numeric"),
            "mtdCWRev%": ("mtd_cwrev%", "numeric"),
            "mtdGpPerc": ("mtd_gp_perc", "numeric"),
            "mtdGrossProfit": ("mtd_gross_profit", "integer"),
            "mtdInvoiced": ("mtd_invoiced", "integer"),
            "mtdnumActiveCustomers": ("mtdnum_active_customers", "integer"),
            "mtdNumActiveCWCustomers": ("mtd_num_active_cwcustomers", "integer"),
            "mtdNumActiveCWSMBs": ("mtd_num_active_cwsmbs", "integer"),
            "mtdNumActiveSMBs": ("mtd_num_active_smbs", "integer"),
            "mtdNumRecurringWOsCompleted": ("mtd_num_recurring_wos_completed", "integer"),
            "mtdNumWOsCompleted": ("mtd_num_wos_completed", "integer"),
            "mtdNumWOsCreated": ("mtd_num_wos_created", "integer"),
            "mtdPercWOsRecurring": ("mtd_perc_wos_recurring", "numeric"),
            "mtdQuotedAmounts": ("mtd_quoted_amounts", "integer"),
            "t30AverageAmtPerWO": ("t30_average_amt_per_wo", "numeric"),
            "t30avgWOsPerCustomer": ("t30avg_wos_per_customer", "numeric"),
            "t30CompletionPerc": ("t30_completion_perc", "numeric"),
            "t30CWRev%": ("t30_cwrev%", "numeric"),
            "t30FollowThroughV1": ("t30_follow_through_v1", "numeric"),
            "t30GpPerc": ("t30_gp_perc", "numeric"),
            "t30GrossProfit": ("t30_gross_profit", "integer"),
            "t30Invoiced": ("t30_invoiced", "integer"),
            "t30numActiveCustomers": ("t30num_active_customers", "integer"),
            "t30NumActiveCWCustomers": ("t30_num_active_cwcustomers", "integer"),
            "t30NumActiveCWSMBs": ("t30_num_active_cwsmbs", "integer"),
            "t30NumActiveSMBs": ("t30_num_active_smbs", "integer"),
            "t30NumRecurringWOsCompleted": ("t30_num_recurring_wos_completed", "integer"),
            "t30NumWOsCompleted": ("t30_num_wos_completed", "integer"),
            "t30NumWOsCreated": ("t30_num_wos_created", "integer"),
            "t30PercWOsRecurring": ("t30_perc_wos_recurring", "numeric"),
            "t30QuotedAmounts": ("t30_quoted_amounts", "integer"),
            "weekAverageAmtPerWO": ("week_average_amt_per_wo", "numeric"),
            "weekavgWOsPerCustomer": ("weekavg_wos_per_customer", "numeric"),
            "weekCompletionPerc": ("week_completion_perc", "numeric"),
            "weekCWRev%": ("week_cwrev%", "numeric"),
            "weekGpPerc": ("week_gp_perc", "numeric"),
            "weekGrossProfit": ("week_gross_profit", "integer"),
            "weekInvoiced": ("week_invoiced", "integer"),
            "weeknumActiveCustomers": ("weeknum_active_customers", "integer"),
            "weekNumActiveCWCustomers": ("week_num_active_cwcustomers", "integer"),
            "weekNumActiveCWSMBs": ("week_num_active_cwsmbs", "integer"),
            "weekNumActiveSMBs": ("week_num_active_smbs", "integer"),
            "weekNumRecurringWOsCompleted": ("week_num_recurring_wos_completed", "integer"),
            "weekNumWOsCompleted": ("week_num_wos_completed", "integer"),
            "weekNumWOsCreated": ("week_num_wos_created", "integer"),
            "weekPercWOsRecurring": ("week_perc_wos_recurring", "numeric"),
            "weekQuotedAmounts": ("week_quoted_amounts", "integer"),
        },
    },
    # weekly_stats_main → b_weekly_stats_main (15 fields)
    "weekly_stats_main": {
        "table": "b_weekly_stats_main",
        "fields": {
            "_id": ("bubble_id", "text"),
            "breasy": ("breasy", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "endDate": ("end_date", "timestamptz"),
            "markets": ("markets", "text[]"),
            "mms": ("mms", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "mtdDailies": ("mtd_dailies", "text[]"),
            "pmcs": ("pmcs", "text[]"),
            "smbs": ("smbs", "text[]"),
            "t30Dailies": ("t30_dailies", "text[]"),
            "week": ("week", "integer"),
            "week_Dailies": ("week_dailies", "text[]"),
            "yrwk": ("yrwk", "integer"),
        },
    },
    # weekly_stats_market → b_weekly_stats_market (33 fields)
    "weekly_stats_market": {
        "table": "b_weekly_stats_market",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedMarket": ("associated_market", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "endDate": ("end_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "monthGPGoal": ("month_gpgoal", "integer"),
            "mtdGpGoal": ("mtd_gp_goal", "numeric"),
            "mtdGPPerc": ("mtd_gpperc", "numeric"),
            "mtdGrossProfit": ("mtd_gross_profit", "integer"),
            "mtdLostGP": ("mtd_lost_gp", "integer"),
            "mtdPercProgressThroughMonth": ("mtd_perc_progress_through_month", "numeric"),
            "mtdPercToGpGoal": ("mtd_perc_to_gp_goal", "numeric"),
            "mtdSnapshots": ("mtd_snapshots", "text[]"),
            "numOldWos": ("num_old_wos", "integer"),
            "numOpenWos": ("num_open_wos", "integer"),
            "t30ComplPerc": ("t30_compl_perc", "numeric"),
            "t30CWRevPerc": ("t30_cwrev_perc", "numeric"),
            "t30DaysToCustQuote": ("t30_days_to_cust_quote", "numeric"),
            "t30numActiveCustomers": ("t30num_active_customers", "integer"),
            "t30numActiveSMBs": ("t30num_active_smbs", "integer"),
            "t30numCustomerActivities": ("t30num_customer_activities", "integer"),
            "t30numCWCustomers": ("t30num_cwcustomers", "integer"),
            "t30numCWSMBs": ("t30num_cwsmbs", "integer"),
            "t30numOpWOs": ("t30num_op_wos", "integer"),
            "t30numSMBActivities": ("t30num_smbactivities", "integer"),
            "t30numWonWOs": ("t30num_won_wos", "integer"),
            "t30OpRev": ("t30_op_rev", "integer"),
            "t30ServiceTypesRequested": ("t30_service_types_requested", "text[]"),
            "t30Snapshots": ("t30_snapshots", "text[]"),
            "t30speedFromCreatedToCustQuote": ("t30speed_from_created_to_cust_quote", "numeric"),
            "t30WonRev": ("t30_won_rev", "integer"),
            "weekSnapshots": ("week_snapshots", "text[]"),
        },
    },
    # weekly_stats_mm → b_weekly_stats_mm (32 fields)
    "weekly_stats_mm": {
        "table": "b_weekly_stats_mm",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedMM": ("associated_mm", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "endDate": ("end_date", "timestamptz"),
            "Modified Date": ("modified_date", "timestamptz"),
            "monthGP goal": ("month_gp_goal", "integer"),
            "mtdGPGoal": ("mtd_gpgoal", "numeric"),
            "mtdGPPerc": ("mtd_gpperc", "numeric"),
            "mtdGrossProfit": ("mtd_gross_profit", "integer"),
            "mtdLostGP": ("mtd_lost_gp", "integer"),
            "mtdpercentProgress through month": ("mtdpercent_progress_through_month", "numeric"),
            "mtdpercentToGPGoal": ("mtdpercent_to_gpgoal", "numeric"),
            "mtdSnapshots": ("mtd_snapshots", "text[]"),
            "numNextStepsPastDue": ("num_next_steps_past_due", "integer"),
            "numOldWos": ("num_old_wos", "integer"),
            "numOpenWos": ("num_open_wos", "integer"),
            "t30CompletionPerc": ("t30_completion_perc", "numeric"),
            "t30CwRevPerc": ("t30_cw_rev_perc", "numeric"),
            "t30daysToCustQuote": ("t30days_to_cust_quote", "numeric"),
            "t30numActiveCustomers": ("t30num_active_customers", "integer"),
            "t30numActiveSMBs": ("t30num_active_smbs", "integer"),
            "t30numCustomerActivities": ("t30num_customer_activities", "integer"),
            "t30numCWCustomers": ("t30num_cwcustomers", "integer"),
            "t30numCWSMBs": ("t30num_cwsmbs", "integer"),
            "t30numOpWOs": ("t30num_op_wos", "integer"),
            "t30numSMBActivities": ("t30num_smbactivities", "integer"),
            "t30numWonWOs": ("t30num_won_wos", "integer"),
            "t30OpRev": ("t30_op_rev", "integer"),
            "t30Snapshots": ("t30_snapshots", "text[]"),
            "t30WonRev": ("t30_won_rev", "integer"),
            "weekSnapshots": ("week_snapshots", "text[]"),
        },
    },
    # weekly_stats_pmc → b_weekly_stats_pmc (21 fields)
    "weekly_stats_pmc": {
        "table": "b_weekly_stats_pmc",
        "fields": {
            "_id": ("bubble_id", "text"),
            "AssociatedMarkets": ("associated_markets", "text[]"),
            "associatedPMC": ("associated_pmc", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "endDate": ("end_date", "timestamptz"),
            "MarketMMs": ("market_mms", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "numOldWos": ("num_old_wos", "integer"),
            "numOpenWos": ("num_open_wos", "integer"),
            "numPastDueApprovals": ("num_past_due_approvals", "integer"),
            "t30ComplPerc": ("t30_compl_perc", "numeric"),
            "t30CWRevPerc": ("t30_cwrev_perc", "numeric"),
            "t30GPP": ("t30_gpp", "numeric"),
            "t30NumLostWos": ("t30_num_lost_wos", "integer"),
            "t30NumWOComplete": ("t30_num_wocomplete", "integer"),
            "t30OpRev": ("t30_op_rev", "integer"),
            "t30PastDueApprovals": ("t30_past_due_approvals", "integer"),
            "t30ServiceTypesRecieved": ("t30_service_types_recieved", "text[]"),
            "t30WonRevenue": ("t30_won_revenue", "integer"),
            "weekPastDueApprovals": ("week_past_due_approvals", "integer"),
        },
    },
    # weekly_stats_smborg → b_weekly_stats_smborg (46 fields)
    "weekly_stats_smborg": {
        "table": "b_weekly_stats_smborg",
        "fields": {
            "_id": ("bubble_id", "text"),
            "associatedMarkets": ("associated_markets", "text[]"),
            "associatedSMBOrg": ("associated_smborg", "text"),
            "Created By": ("created_by", "text"),
            "Created Date": ("created_date", "timestamptz"),
            "endDate": ("end_date", "timestamptz"),
            "MarketMMs": ("market_mms", "text[]"),
            "Modified Date": ("modified_date", "timestamptz"),
            "MonthlyPayoutGoal": ("monthly_payout_goal", "integer"),
            "MTD Won Pay": ("mtd_won_pay", "integer"),
            "mtdGpPerc": ("mtd_gp_perc", "numeric"),
            "mtdLostPay": ("mtd_lost_pay", "integer"),
            "mtdNumPastDueQuotes": ("mtd_num_past_due_quotes", "integer"),
            "mtdNumPastDueScheduled": ("mtd_num_past_due_scheduled", "integer"),
            "mtdOpGP": ("mtd_op_gp", "integer"),
            "mtdPaidOut": ("mtd_paid_out", "integer"),
            "mtdPayoutGoal": ("mtd_payout_goal", "integer"),
            "mtdPayPerc": ("mtd_pay_perc", "numeric"),
            "mtdPercOfMonth": ("mtd_perc_of_month", "numeric"),
            "mtdPercToPayoutGoal": ("mtd_perc_to_payout_goal", "integer"),
            "mtdSnapshots": ("mtd_snapshots", "text[]"),
            "mtdWonGP": ("mtd_won_gp", "integer"),
            "numOldWos": ("num_old_wos", "integer"),
            "numOpenWos": ("num_open_wos", "integer"),
            "numPastDueQuotes": ("num_past_due_quotes", "integer"),
            "numPastDueScheduled": ("num_past_due_scheduled", "integer"),
            "t30ComplPerc": ("t30_compl_perc", "numeric"),
            "t30CWRevPerc": ("t30_cwrev_perc", "numeric"),
            "t30FollowThroughV1": ("t30_follow_through_v1", "numeric"),
            "t30FollowthroughV2": ("t30_followthrough_v2", "numeric"),
            "t30GPPerc": ("t30_gpperc", "numeric"),
            "t30LostGP": ("t30_lost_gp", "integer"),
            "t30numOpWOs": ("t30num_op_wos", "integer"),
            "t30numWonWOs": ("t30num_won_wos", "integer"),
            "t30OpRev": ("t30_op_rev", "integer"),
            "t30PastDueQuotes": ("t30_past_due_quotes", "integer"),
            "t30PastDueScheduled": ("t30_past_due_scheduled", "integer"),
            "t30PercCompletionFormCreation": ("t30_perc_completion_form_creation", "integer"),
            "t30PercQuoteFormCreation": ("t30_perc_quote_form_creation", "integer"),
            "t30PercToPayoutGoal": ("t30_perc_to_payout_goal", "integer"),
            "t30SMBPayout": ("t30_smbpayout", "integer"),
            "t30Snapshots": ("t30_snapshots", "text[]"),
            "t30WonGP": ("t30_won_gp", "integer"),
            "t30WonRev": ("t30_won_rev", "integer"),
            "weekSnapshots": ("week_snapshots", "text[]"),
            "WKPayoutGoalx4": ("wkpayout_goalx4", "integer"),
        },
    },
}



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
