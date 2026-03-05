import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Fetch the OpenAPI spec from Supabase PostgREST — it contains all table definitions
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch schema' }, { status: 500 });
  }

  const spec = await res.json();

  const tables = Object.entries(spec.definitions || {})
    .map(([name, def]: [string, unknown]) => {
      const d = def as { properties?: Record<string, { type?: string; format?: string; description?: string }> };
      const columns = Object.entries(d.properties || {}).map(([col, info]) => ({
        name: col,
        type: info.format || info.type || 'unknown',
        description: info.description || '',
      }));
      return { name, columns };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ tables });
}
