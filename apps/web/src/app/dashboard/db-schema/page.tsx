'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, RotateCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ── Types ──────────────────────────

type Group = 'core' | 'jobs' | 'quotes' | 'invoices' | 'comms' | 'tasks' | 'analytics' | 'crm' | 'marketing' | 'automation' | 'system' | 'other';

type TableDef = {
  id: string;
  label: string;
  group: Group;
  x: number;
  y: number;
  fields: string[];
};

type Relationship = {
  from: string;
  fromField: string;
  to: string;
  toField: string;
  type: '1:1' | '1:N' | 'N:1' | 'ref';
  label?: string;
};

type ApiTable = {
  name: string;
  columns: { name: string; type: string; description: string }[];
};

// ── Colors ──────────────────────────

const GROUP_COLORS: Record<Group, { bg: string; border: string; header: string; text: string }> = {
  core:       { bg: '#EFF6FF', border: '#3B82F6', header: '#2563EB', text: '#1E40AF' },
  jobs:       { bg: '#FFF7ED', border: '#F97316', header: '#EA580C', text: '#9A3412' },
  quotes:     { bg: '#ECFDF5', border: '#10B981', header: '#059669', text: '#065F46' },
  invoices:   { bg: '#FDF2F8', border: '#EC4899', header: '#DB2777', text: '#9D174D' },
  comms:      { bg: '#F5F3FF', border: '#8B5CF6', header: '#7C3AED', text: '#5B21B6' },
  tasks:      { bg: '#FEF3C7', border: '#F59E0B', header: '#D97706', text: '#92400E' },
  analytics:  { bg: '#F0FDF4', border: '#22C55E', header: '#16A34A', text: '#166534' },
  crm:        { bg: '#EFF6FF', border: '#6366F1', header: '#4F46E5', text: '#3730A3' },
  marketing:  { bg: '#FFF1F2', border: '#F43F5E', header: '#E11D48', text: '#9F1239' },
  automation: { bg: '#F0FDFA', border: '#14B8A6', header: '#0D9488', text: '#115E59' },
  system:     { bg: '#F1F5F9', border: '#64748B', header: '#475569', text: '#1E293B' },
  other:      { bg: '#F8FAFC', border: '#94A3B8', header: '#64748B', text: '#334155' },
};

const GROUP_LABELS: Record<Group, string> = {
  core: 'Core Entities',
  jobs: 'Job Workflow',
  quotes: 'Quotes & Assignments',
  invoices: 'Invoices & Payments',
  comms: 'Communication',
  tasks: 'Activities & Tasks',
  analytics: 'Analytics & Metrics',
  crm: 'CRM',
  marketing: 'Marketing',
  automation: 'Automation',
  system: 'System',
  other: 'Other',
};

// ── Constants ──────────────────────────

const NODE_W = 210;
const NODE_HEADER = 28;
const NODE_ROW = 18;
const MAX_VISIBLE_FIELDS = 10;

// ── Known positions & groups for b_ tables ──────────────────────────

const KNOWN_LAYOUT: Record<string, { group: Group; x: number; y: number }> = {
  b_user:                        { group: 'core',      x: 560,  y: 30 },
  b_organization:                { group: 'core',      x: 560,  y: 230 },
  b_job:                         { group: 'jobs',      x: 30,   y: 80 },
  b_job_service:                 { group: 'jobs',      x: 30,   y: 410 },
  b_job_request:                 { group: 'jobs',      x: 30,   y: 580 },
  b_job_request_quality_metrics: { group: 'jobs',      x: 30,   y: 680 },
  b_smb_quote:                   { group: 'quotes',    x: 280,  y: 470 },
  b_quote_line_item:             { group: 'quotes',    x: 280,  y: 650 },
  b_published_smbs:              { group: 'quotes',    x: 280,  y: 810 },
  b_invoice:                     { group: 'invoices',  x: 30,   y: 840 },
  b_conversation:                { group: 'comms',     x: 1020, y: 30 },
  b_message:                     { group: 'comms',     x: 1020, y: 260 },
  b_chat_message:                { group: 'comms',     x: 1270, y: 100 },
  b_email:                       { group: 'comms',     x: 1270, y: 300 },
  b_notification:                { group: 'comms',     x: 1020, y: 450 },
  b_activity:                    { group: 'tasks',     x: 560,  y: 500 },
  b_next_step:                   { group: 'tasks',     x: 560,  y: 680 },
  b_next_step_smb:               { group: 'tasks',     x: 800,  y: 620 },
  b_note:                        { group: 'tasks',     x: 560,  y: 860 },
  b_completion:                  { group: 'tasks',     x: 800,  y: 810 },
  b_calendar_event:              { group: 'tasks',     x: 800,  y: 960 },
  b_app_usage:                   { group: 'analytics', x: 1270, y: 520 },
  b_section_engagement_track:    { group: 'analytics', x: 1270, y: 640 },
  b_usage_metrics:               { group: 'analytics', x: 1270, y: 780 },
  b_snapshot_mm:                 { group: 'analytics', x: 1520, y: 520 },
  b_snapshot_pmc:                { group: 'analytics', x: 1520, y: 660 },
  b_snapshot_market:             { group: 'analytics', x: 1520, y: 800 },
  b_utm_views:                   { group: 'other',     x: 1520, y: 940 },
  b_visit:                       { group: 'other',     x: 1520, y: 1060 },
  b_leads:                       { group: 'other',     x: 1270, y: 940 },
  b_smb_onboard_intent:          { group: 'other',     x: 1270, y: 1050 },
  b_blogpost:                    { group: 'other',     x: 1050, y: 1050 },
};

// ── Known relationships for b_ tables ──────────────────────────

const KNOWN_RELATIONSHIPS: Relationship[] = [
  { from: 'b_user', fromField: 'user_associated_org', to: 'b_organization', toField: 'bubble_id', type: 'N:1', label: 'belongs to' },
  { from: 'b_job', fromField: 'assigned_cust_org', to: 'b_organization', toField: 'bubble_id', type: 'N:1', label: 'customer org' },
  { from: 'b_job', fromField: 'assigned_cust_user', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'customer user' },
  { from: 'b_job', fromField: 'assigned_smb_user', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'SMB user' },
  { from: 'b_job', fromField: 'accepted_quote', to: 'b_smb_quote', toField: 'bubble_id', type: '1:1', label: 'accepted quote' },
  { from: 'b_job', fromField: 'associated_activities', to: 'b_activity', toField: 'bubble_id', type: '1:N', label: 'activities' },
  { from: 'b_job_service', fromField: 'job_work_order', to: 'b_job', toField: 'job_work_order', type: 'N:1', label: 'for job' },
  { from: 'b_smb_quote', fromField: 'associated_job', to: 'b_job', toField: 'bubble_id', type: 'N:1', label: 'for job' },
  { from: 'b_smb_quote', fromField: 'associated_smb_user', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'from SMB' },
  { from: 'b_quote_line_item', fromField: 'associated_job', to: 'b_job', toField: 'bubble_id', type: 'N:1', label: 'for job' },
  { from: 'b_published_smbs', fromField: 'job', to: 'b_job', toField: 'bubble_id', type: 'N:1', label: 'for job' },
  { from: 'b_invoice', fromField: 'job_work_order', to: 'b_job', toField: 'job_work_order', type: 'N:1', label: 'for job' },
  { from: 'b_invoice', fromField: 'associated_cust_org', to: 'b_organization', toField: 'bubble_id', type: 'N:1', label: 'billed to' },
  { from: 'b_conversation', fromField: 'associated_external_user', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'external user' },
  { from: 'b_conversation', fromField: 'associated_internal_user', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'internal user' },
  { from: 'b_conversation', fromField: 'job_work_order', to: 'b_job', toField: 'job_work_order', type: 'N:1', label: 'about job' },
  { from: 'b_chat_message', fromField: 'owner', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'owner' },
  { from: 'b_notification', fromField: 'sender', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'from' },
  { from: 'b_notification', fromField: 'related_message', to: 'b_message', toField: 'bubble_id', type: 'N:1', label: 'message' },
  { from: 'b_activity', fromField: 'associated_job', to: 'b_job', toField: 'bubble_id', type: 'N:1', label: 'for job' },
  { from: 'b_activity', fromField: 'associated_fulfillment_owner', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'owner' },
  { from: 'b_next_step_smb', fromField: 'associated_fulfillment_user', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'assigned to' },
  { from: 'b_message', fromField: 'related_note', to: 'b_note', toField: 'bubble_id', type: 'N:1', label: 'note' },
  { from: 'b_app_usage', fromField: 'user', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'user' },
  { from: 'b_section_engagement_track', fromField: 'related_user', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'user' },
  { from: 'b_snapshot_mm', fromField: 'market_manager', to: 'b_user', toField: 'bubble_id', type: 'N:1', label: 'manager' },
  { from: 'b_snapshot_pmc', fromField: 'pmc', to: 'b_organization', toField: 'bubble_id', type: 'N:1', label: 'PMC org' },
];

// ── Auto-detect group for non-b_ tables ──────────────────────────

function detectGroup(name: string): Group {
  if (/^(contacts?|companies|deals|deal_stage|activities|tags|duplicate_groups|pipeline|red_flags|objection)/.test(name)) return 'crm';
  if (/^(campaigns?|ad_|content_|utm_|post_metrics|lead_finder)/.test(name)) return 'marketing';
  if (/^(call_|messages?|conversations?|twilio_|email_|vapi_)/.test(name)) return 'comms';
  if (/^(sequences?|sequence_|playbooks?|step_|goal)/.test(name)) return 'automation';
  if (/^(sync_|system_|webhook_|import_|enrichment_|market_manager)/.test(name)) return 'system';
  if (/^(users?|contact_)/.test(name)) return 'crm';
  return 'other';
}

// ── Auto-detect relationships from column names ──────────────────────────

function autoDetectRelationships(tables: TableDef[]): Relationship[] {
  const tableNames = new Set(tables.map(t => t.id));
  const rels: Relationship[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    // Skip b_ tables — they use KNOWN_RELATIONSHIPS
    if (table.id.startsWith('b_')) continue;

    for (const field of table.fields) {
      if (!field.endsWith('_id')) continue;
      const base = field.slice(0, -3); // strip _id

      // Try: "user_id" -> "users", "company_id" -> "companies"
      let target = '';
      if (tableNames.has(base + 's')) target = base + 's';
      else if (tableNames.has(base + 'es')) target = base + 'es';
      else if (tableNames.has(base.replace(/y$/, 'ies'))) target = base.replace(/y$/, 'ies');
      else if (tableNames.has(base)) target = base;

      if (target && target !== table.id) {
        const key = `${table.id}:${field}:${target}`;
        if (!seen.has(key)) {
          seen.add(key);
          rels.push({ from: table.id, fromField: field, to: target, toField: 'id', type: 'N:1' });
        }
      }
    }
  }
  return rels;
}

// ── Helpers ──────────────────────────

function nodeHeight(fields: string[], hasMore: boolean) {
  const rows = Math.min(fields.length, MAX_VISIBLE_FIELDS) + (hasMore ? 1 : 0);
  return NODE_HEADER + rows * NODE_ROW + 8;
}

function getAnchor(
  fx: number, fy: number, fFieldCount: number,
  tx: number, ty: number, tFieldCount: number,
) {
  const fh = NODE_HEADER + fFieldCount * NODE_ROW + 8;
  const th = NODE_HEADER + tFieldCount * NODE_ROW + 8;
  const fcx = fx + NODE_W / 2;
  const fcy = fy + fh / 2;
  const tcx = tx + NODE_W / 2;
  const tcy = ty + th / 2;

  const dx = tcx - fcx;
  const dy = tcy - fcy;

  let x1: number, y1: number, x2: number, y2: number;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) { x1 = fx + NODE_W; x2 = tx; }
    else { x1 = fx; x2 = tx + NODE_W; }
    y1 = fcy;
    y2 = tcy;
  } else {
    if (dy > 0) { y1 = fy + fh; y2 = ty; }
    else { y1 = fy; y2 = ty + th; }
    x1 = fcx;
    x2 = tcx;
  }

  return { x1, y1, x2, y2 };
}

// ── Main component ──────────────────────────

export default function DbSchemaPage() {
  const [allTables, setAllTables] = useState<TableDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'b_' | 'other' | 'all'>('all');

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.55);
  const [pan, setPan] = useState({ x: 20, y: 20 });

  const [dragMode, setDragMode] = useState<'none' | 'pan' | 'node'>('none');
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragNodeStart, setDragNodeStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Fetch schema from API ──────────────────────────

  useEffect(() => {
    fetch('/api/db-schema')
      .then(r => r.json())
      .then((data: { tables: ApiTable[] }) => {
        // Non-b_ tables index for auto-layout grid
        let otherIdx = 0;
        const GRID_COLS = 7;
        const GRID_X = 30;
        const GRID_Y = 1300; // below b_ tables area
        const COL_W = 260;
        const ROW_H = 280;

        const tables: TableDef[] = data.tables.map((t) => {
          const known = KNOWN_LAYOUT[t.name];
          let x: number, y: number, group: Group;

          if (known) {
            x = known.x;
            y = known.y;
            group = known.group;
          } else {
            group = detectGroup(t.name);
            const col = otherIdx % GRID_COLS;
            const row = Math.floor(otherIdx / GRID_COLS);
            x = GRID_X + col * COL_W;
            y = GRID_Y + row * ROW_H;
            otherIdx++;
          }

          return {
            id: t.name,
            label: t.name,
            group,
            x,
            y,
            fields: t.columns.map(c => c.name),
          };
        });

        setAllTables(tables);

        // Initialize positions
        const pos: Record<string, { x: number; y: number }> = {};
        for (const t of tables) {
          pos[t.id] = { x: t.x, y: t.y };
        }
        setPositions(pos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Filtered tables & relationships ──────────────────────────

  const visibleTables = useMemo(() => {
    if (filter === 'b_') return allTables.filter(t => t.id.startsWith('b_'));
    if (filter === 'other') return allTables.filter(t => !t.id.startsWith('b_'));
    return allTables;
  }, [allTables, filter]);

  const autoRels = useMemo(() => autoDetectRelationships(allTables), [allTables]);

  const relationships = useMemo(() => {
    const visibleIds = new Set(visibleTables.map(t => t.id));
    return [...KNOWN_RELATIONSHIPS, ...autoRels].filter(
      r => visibleIds.has(r.from) && visibleIds.has(r.to)
    );
  }, [visibleTables, autoRels]);

  const activeTable = selectedTable ?? hoveredTable;

  const connectedRels = activeTable
    ? relationships.filter(r => r.from === activeTable || r.to === activeTable)
    : [];
  const connectedTables = new Set(connectedRels.flatMap(r => [r.from, r.to]));

  // ── Active groups for legend ──────────────────────────

  const activeGroups = useMemo(() => {
    const groups = new Set(visibleTables.map(t => t.group));
    return (Object.entries(GROUP_LABELS) as [Group, string][]).filter(([key]) => groups.has(key));
  }, [visibleTables]);

  // ── Mouse handlers ──────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const target = e.target as SVGElement;
    const tableEl = target.closest('[data-table-id]') as SVGElement | null;
    if (tableEl) {
      const tableId = tableEl.getAttribute('data-table-id')!;
      const pos = positions[tableId];
      if (pos) {
        setDragMode('node');
        setDragNodeId(tableId);
        setDragStart({ x: e.clientX, y: e.clientY });
        setDragNodeStart({ x: pos.x, y: pos.y });
      }
      return;
    }
    setDragMode('pan');
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan, positions]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragMode === 'pan') {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (dragMode === 'node' && dragNodeId) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      setPositions(prev => ({
        ...prev,
        [dragNodeId]: { x: dragNodeStart.x + dx, y: dragNodeStart.y + dy },
      }));
    }
  }, [dragMode, dragStart, dragNodeId, dragNodeStart, zoom]);

  const handleMouseUp = useCallback(() => {
    if (dragMode === 'node' && dragNodeId) {
      const pos = positions[dragNodeId];
      const moved = Math.abs(pos.x - dragNodeStart.x) + Math.abs(pos.y - dragNodeStart.y);
      if (moved < 3) {
        setSelectedTable(prev => prev === dragNodeId ? null : dragNodeId);
      }
    }
    setDragMode('none');
    setDragNodeId(null);
  }, [dragMode, dragNodeId, positions, dragNodeStart]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(z => Math.max(0.15, Math.min(2, z + delta)));
  }, []);

  const resetPositions = useCallback(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    for (const t of allTables) {
      pos[t.id] = { x: t.x, y: t.y };
    }
    setPositions(pos);
    setZoom(0.55);
    setPan({ x: 20, y: 20 });
    setSelectedTable(null);
  }, [allTables]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(2, z + 0.1));
      if (e.key === '-') setZoom(z => Math.max(0.15, z - 0.1));
      if (e.key === '0') resetPositions();
      if (e.key === 'Escape') setSelectedTable(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resetPositions]);

  // ── Loading state ──────────────────────────

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          Loading schema from Supabase...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/db-explorer"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronLeft size={14} />
            DB Explorer
          </Link>
          <h1 className="text-sm font-semibold text-gray-800">Table Relationships</h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {visibleTables.length} tables &middot; {relationships.length} relationships
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <div className="flex rounded-md border border-gray-200 bg-gray-50 text-[10px]">
            {([['all', 'All'], ['b_', 'Bubble (b_)'], ['other', 'CRM & Other']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 transition-colors ${
                  filter === key
                    ? 'bg-blue-500 text-white rounded-md shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">
            Drag &middot; Scroll to zoom &middot; 0 reset
          </span>
          <button
            onClick={resetPositions}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-100"
          >
            <RotateCcw size={10} /> Reset
          </button>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm border border-gray-100">
        {activeGroups.map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: GROUP_COLORS[key].border }} />
            <span className="text-[10px] text-gray-600">{label}</span>
          </div>
        ))}
        <div className="ml-4 flex items-center gap-3 border-l border-gray-200 pl-4">
          <div className="flex items-center gap-1">
            <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#94A3B8" strokeWidth="1.5" /></svg>
            <span className="text-[10px] text-gray-500">N:1</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
            <span className="text-[10px] text-gray-500">1:N / 1:1</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 bg-[#FAFBFC] shadow-sm"
        style={{ cursor: dragMode === 'node' ? 'grabbing' : dragMode === 'pan' ? 'grabbing' : 'default' }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="select-none"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"
              patternTransform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              <circle cx="20" cy="20" r="0.5" fill="#D1D5DB" />
            </pattern>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94A3B8" />
            </marker>
            <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
            </marker>
          </defs>
          <style>{`
            @keyframes flowDash {
              to { stroke-dashoffset: -40; }
            }
            .flow-line {
              animation: flowDash 1.2s linear infinite;
            }
          `}</style>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Relationship lines */}
            {relationships.map((rel, i) => {
              const fromDef = visibleTables.find(t => t.id === rel.from);
              const toDef = visibleTables.find(t => t.id === rel.to);
              if (!fromDef || !toDef) return null;

              const fp = positions[rel.from];
              const tp = positions[rel.to];
              if (!fp || !tp) return null;

              const fVisCount = Math.min(fromDef.fields.length, MAX_VISIBLE_FIELDS) + (fromDef.fields.length > MAX_VISIBLE_FIELDS ? 1 : 0);
              const tVisCount = Math.min(toDef.fields.length, MAX_VISIBLE_FIELDS) + (toDef.fields.length > MAX_VISIBLE_FIELDS ? 1 : 0);

              const isActive = activeTable && (rel.from === activeTable || rel.to === activeTable);
              const isDimmed = activeTable && !isActive;
              const { x1, y1, x2, y2 } = getAnchor(fp.x, fp.y, fVisCount, tp.x, tp.y, tVisCount);

              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              const ddx = Math.abs(x2 - x1);
              const ddy = Math.abs(y2 - y1);
              const path = ddx > ddy
                ? `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
                : `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;

              const fieldLabel = rel.fromField;
              const showLabel = !isDimmed;

              return (
                <g key={i} opacity={isDimmed ? 0.08 : 1}>
                  <path
                    d={path}
                    fill="none"
                    stroke={isActive ? '#3B82F6' : '#CBD5E1'}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={rel.type === '1:1' || rel.type === '1:N' ? '6 3' : undefined}
                    markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                  />
                  {isActive && (
                    <path
                      d={path}
                      fill="none"
                      stroke="#60A5FA"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray="8 32"
                      className="flow-line"
                      opacity={0.7}
                    />
                  )}
                  {showLabel && (
                    <>
                      <rect
                        x={mx - fieldLabel.length * 2.8 - 4}
                        y={my - 12}
                        width={fieldLabel.length * 5.6 + 8}
                        height={14}
                        rx={3}
                        fill={isActive ? '#EFF6FF' : '#F8FAFC'}
                        stroke={isActive ? '#BFDBFE' : '#E2E8F0'}
                        strokeWidth={0.5}
                      />
                      <text
                        x={mx} y={my - 2}
                        textAnchor="middle"
                        fill={isActive ? '#2563EB' : '#94A3B8'}
                        fontSize="8"
                        fontWeight={isActive ? '600' : '400'}
                        fontFamily="ui-monospace, monospace"
                        className="pointer-events-none"
                      >
                        {fieldLabel}
                      </text>
                    </>
                  )}
                  {isActive && rel.label && (
                    <text
                      x={mx} y={my - 16}
                      textAnchor="middle"
                      fill="#3B82F6"
                      fontSize="8"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {rel.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Table nodes */}
            {visibleTables.map(table => {
              const pos = positions[table.id];
              if (!pos) return null;
              const colors = GROUP_COLORS[table.group];
              const visibleFields = table.fields.slice(0, MAX_VISIBLE_FIELDS);
              const hasMore = table.fields.length > MAX_VISIBLE_FIELDS;
              const h = nodeHeight(table.fields, hasMore);
              const isActive = activeTable === table.id;
              const isConnected = activeTable ? connectedTables.has(table.id) : false;
              const isDimmed = activeTable && !isActive && !isConnected;
              const isDragging = dragNodeId === table.id;

              return (
                <g
                  key={table.id}
                  data-table-id={table.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  onMouseEnter={() => { if (dragMode === 'none' && !selectedTable) setHoveredTable(table.id); }}
                  onMouseLeave={() => { if (dragMode === 'none' && !selectedTable) setHoveredTable(null); }}
                  style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    opacity: isDimmed ? 0.15 : 1,
                  }}
                >
                  <rect x={2} y={2} width={NODE_W} height={h} rx={6} fill="rgba(0,0,0,0.06)" />
                  <rect
                    width={NODE_W} height={h} rx={6}
                    fill={colors.bg}
                    stroke={isActive ? colors.border : isConnected ? colors.border : '#E2E8F0'}
                    strokeWidth={isActive ? 2.5 : isConnected ? 1.5 : 1}
                  />
                  <rect width={NODE_W} height={NODE_HEADER} rx={6} fill={colors.header} />
                  <rect y={NODE_HEADER - 6} width={NODE_W} height={6} fill={colors.header} />
                  <text x={10} y={18} fill="white" fontSize="10" fontWeight="600" fontFamily="ui-monospace, monospace">
                    {table.label}
                  </text>
                  <text x={NODE_W - 8} y={18} fill="rgba(255,255,255,0.6)" fontSize="8" textAnchor="end" fontFamily="ui-monospace, monospace">
                    {table.fields.length}
                  </text>

                  {visibleFields.map((field, fi) => (
                    <text
                      key={fi}
                      x={10}
                      y={NODE_HEADER + 14 + fi * NODE_ROW}
                      fill={field.endsWith('_id') || field === 'bubble_id' ? colors.text : '#64748B'}
                      fontSize="9.5"
                      fontFamily="ui-monospace, monospace"
                      fontWeight={field.endsWith('_id') ? '500' : '400'}
                    >
                      {field.endsWith('_id') && '\u2192 '}{field}
                    </text>
                  ))}
                  {hasMore && (
                    <text
                      x={10}
                      y={NODE_HEADER + 14 + visibleFields.length * NODE_ROW}
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="ui-monospace, monospace"
                      fontStyle="italic"
                    >
                      +{table.fields.length - MAX_VISIBLE_FIELDS} more columns...
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Info panel */}
        {selectedTable && (() => {
          const table = visibleTables.find(t => t.id === selectedTable);
          if (!table) return null;
          const outgoing = relationships.filter(r => r.from === selectedTable);
          const incoming = relationships.filter(r => r.to === selectedTable);
          const colors = GROUP_COLORS[table.group];
          return (
            <div className="absolute bottom-3 left-3 max-h-[60%] w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: colors.border }} />
                <span className="text-xs font-semibold text-gray-800">{table.label}</span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
                  {GROUP_LABELS[table.group]}
                </span>
              </div>
              <p className="mb-1.5 text-[9px] text-gray-400">{table.fields.length} columns</p>
              <div className="mb-2 max-h-32 overflow-y-auto rounded bg-gray-50 px-2 py-1">
                {table.fields.map((f, i) => (
                  <p key={i} className="text-[10px] text-gray-600 font-mono">{f}</p>
                ))}
              </div>
              {outgoing.length > 0 && (
                <div className="mb-1.5">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">References</p>
                  {outgoing.map((r, i) => (
                    <p key={i} className="text-[10px] text-gray-600">
                      <span className="text-gray-400">{r.fromField}</span> → <span className="font-medium text-gray-800">{r.to}</span>
                      {r.label && <span className="text-gray-400"> ({r.label})</span>}
                    </p>
                  ))}
                </div>
              )}
              {incoming.length > 0 && (
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Referenced by</p>
                  {incoming.map((r, i) => (
                    <p key={i} className="text-[10px] text-gray-600">
                      <span className="font-medium text-gray-800">{r.from}</span> <span className="text-gray-400">via {r.fromField}</span>
                      {r.label && <span className="text-gray-400"> ({r.label})</span>}
                    </p>
                  ))}
                </div>
              )}
              {outgoing.length === 0 && incoming.length === 0 && (
                <p className="text-[10px] text-gray-400">No direct relationships</p>
              )}
              <button
                onClick={() => setSelectedTable(null)}
                className="mt-2 text-[10px] text-blue-500 hover:text-blue-700"
              >
                Clear selection (Esc)
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
