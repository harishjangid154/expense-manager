import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { upsertBatch } from '@/lib/transactions';
import { transactionBulkImportSchema } from '@/lib/schemas/transaction';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const validatedData = transactionBulkImportSchema.parse(body);
    const result = await upsertBatch(user.id, validatedData);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
