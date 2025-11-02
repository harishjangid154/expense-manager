import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseEmailToTransaction,
  detectCreditCardPayment,
  detectLoanNotice,
} from '@/lib/emailParser';
import { sendEmail, sendSMS } from '@/lib/notifications';

interface ParsedEmail {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Normalize various email provider webhook payloads
 */
function normalizeEmailPayload(body: any): ParsedEmail | null {
  // SendGrid Inbound Parse format
  if (body.to && body.from && body.subject && body.text) {
    return {
      to: body.to,
      from: body.from,
      subject: body.subject,
      text: body.text,
      html: body.html,
    };
  }

  // Mailgun format
  if (body.recipient && body.sender && body.subject && body['body-plain']) {
    return {
      to: body.recipient,
      from: body.sender,
      subject: body.subject,
      text: body['body-plain'],
      html: body['body-html'],
    };
  }

  // Generic JSON format
  if (body.email) {
    const email = body.email;
    if (email.to && email.from && email.subject && email.text) {
      return {
        to: email.to,
        from: email.from,
        subject: email.subject,
        text: email.text,
        html: email.html,
      };
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify inbound secret if configured
    const inboundSecret = process.env.SENDGRID_INBOUND_ENDPOINT_SECRET;
    if (inboundSecret) {
      const providedSecret = request.headers.get('x-inbound-secret');
      if (providedSecret !== inboundSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Parse request body
    const body = await request.json();
    const email = normalizeEmailPayload(body);

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid email payload format' },
        { status: 400 }
      );
    }

    // Extract recipient email (handle multiple recipients)
    const recipientEmail = Array.isArray(email.to) ? email.to[0] : email.to;
    const cleanEmail = recipientEmail.replace(/<(.+)>/, '$1').trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      console.log(`[Webhook] User not found for email: ${cleanEmail}`);
      return NextResponse.json(
        { ok: false, reason: 'user_not_found' },
        { status: 202 }
      );
    }

    let createdCount = 0;
    let parsed = false;

    // Parse email to transaction
    const parsedTx = parseEmailToTransaction(email.subject, email.text);

    if (parsedTx) {
      parsed = true;

      // TODO: Adjust accountId selection based on your business logic
      // Currently using first available account as fallback
      const account = await prisma.account.findFirst({
        where: { userId: user.id, isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!account) {
        console.warn(`[Webhook] No active account found for user ${user.id}`);
        return NextResponse.json(
          { ok: false, reason: 'no_account_found' },
          { status: 202 }
        );
      }

      // Prepare transaction data
      const transactionData = {
        userId: user.id,
        accountId: account.id,
        clientId: parsedTx.clientId,
        amountMinor: parsedTx.type === 'debit' ? -Math.abs(parsedTx.amountMinor) : Math.abs(parsedTx.amountMinor),
        currency: parsedTx.currency,
        category: parsedTx.type === 'debit' ? 'Expense' : 'Income',
        merchant: parsedTx.merchant,
        note: parsedTx.note,
        metadata: JSON.stringify({
          parsed: true,
          raw: parsedTx.raw,
          source: 'email',
          from: email.from,
        }),
        createdAt: parsedTx.occurredAt ? new Date(parsedTx.occurredAt) : new Date(),
        syncedAt: new Date(),
        isDeleted: false,
      };

      try {
        // TODO: This assumes your Prisma schema has @@unique([userId, clientId])
        // If the unique constraint name is different, adjust accordingly
        // Attempt upsert using composite unique constraint
        await prisma.transaction.upsert({
          where: {
            userId_clientId: {
              userId: user.id,
              clientId: parsedTx.clientId!,
            },
          },
          update: transactionData,
          create: transactionData,
        });

        createdCount = 1;
        console.log(`[Webhook] Transaction created/updated for user ${user.id}`);
      } catch (error) {
        // Fallback: check for duplicate by raw content and amount within 24h window
        console.error('[Webhook] Upsert failed, attempting fallback:', error);
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existing = await prisma.transaction.findFirst({
          where: {
            userId: user.id,
            amountMinor: transactionData.amountMinor,
            createdAt: { gte: oneDayAgo },
            metadata: { contains: parsedTx.raw?.substring(0, 100) },
          },
        });

        if (!existing) {
          await prisma.transaction.create({ data: transactionData });
          createdCount = 1;
          console.log(`[Webhook] Transaction created (fallback) for user ${user.id}`);
        } else {
          console.log(`[Webhook] Duplicate transaction detected, skipping`);
        }
      }
    }

    // Detect credit card payment
    const ccPayment = detectCreditCardPayment(email.subject, email.text);
    if (ccPayment && ccPayment.amountMinor) {
      console.log(`[Webhook] Credit card payment detected for user ${user.id}`);

      // Send email alert
      await sendEmail({
        to: user.email,
        subject: 'Alert: Credit card payment detected',
        text: `A credit card payment of ${ccPayment.currency} ${(ccPayment.amountMinor / 100).toFixed(2)} was detected${ccPayment.cardLast4 ? ` on card ending ${ccPayment.cardLast4}` : ''}.`,
        html: `<p>A credit card payment of <strong>${ccPayment.currency} ${(ccPayment.amountMinor / 100).toFixed(2)}</strong> was detected${ccPayment.cardLast4 ? ` on card ending <strong>${ccPayment.cardLast4}</strong>` : ''}.</p>`,
      });

      // Send SMS if user has phone (TODO: add phone field to User model if needed)
      // Uncomment when User model has phone field:
      // if (user.phone) {
      //   await sendSMS({
      //     to: user.phone,
      //     body: `Credit card payment alert: ${ccPayment.currency} ${(ccPayment.amountMinor / 100).toFixed(2)}${ccPayment.cardLast4 ? ` on card ending ${ccPayment.cardLast4}` : ''}`,
      //   });
      // }
    }

    // Detect loan notice
    const loanNotice = detectLoanNotice(email.subject, email.text);
    if (loanNotice) {
      console.log(`[Webhook] Loan notice detected for user ${user.id}:`, loanNotice);

      // TODO: Store recurring prompt
      // Option 1: If User model has metadata Json? field:
      // const currentMetadata = user.metadata ? JSON.parse(user.metadata as string) : {};
      // const recurringPrompts = currentMetadata.recurringPrompts || [];
      // recurringPrompts.push({
      //   type: 'loan',
      //   lender: loanNotice.lender,
      //   hint: loanNotice.hint,
      //   detectedAt: new Date().toISOString(),
      // });
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: { metadata: JSON.stringify({ ...currentMetadata, recurringPrompts }) },
      // });

      // Option 2: If you have a separate RecurringPrompt model, create a record there
      // See prisma/README-WINDSURF-NOTIFICATIONS.md for suggested schema

      // For now, just log it
      console.log('[Webhook] Recurring prompt storage not implemented. See TODO in code.');
    }

    return NextResponse.json({
      ok: true,
      parsed,
      createdCount,
      ccPaymentDetected: !!ccPayment,
      loanNoticeDetected: !!loanNotice,
    });
  } catch (error) {
    console.error('[Webhook] Error processing email:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
