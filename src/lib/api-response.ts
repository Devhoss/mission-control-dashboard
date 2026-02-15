import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(
  error: string,
  status = 500,
  data: unknown = undefined
) {
  return NextResponse.json(
    { ok: false, error, ...(data !== undefined && { data }) },
    { status }
  );
}
