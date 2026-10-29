import { unlink, readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import formidable from 'formidable'

const STORE_EMAIL = 'abeastmode803@gmail.com'
const MAX_RECEIPT_SIZE = 4 * 1024 * 1024

export const config = { api: { bodyParser: false } }

const field = (fields: formidable.Fields<string>, name: string) => {
  const value = fields[name]
  return (Array.isArray(value) ? value[0] : value)?.trim() || ''
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character] || character)

const firstFile = (value: formidable.File | formidable.File[] | undefined) => Array.isArray(value) ? value[0] : value

const reply = (res: ServerResponse, status: number, body: { success: boolean; error?: string }) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return reply(res, 405, { success: false, error: 'Use POST to send a receipt.' })

  const originHeader = req.headers.origin
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) {
        return reply(res, 403, { success: false, error: 'This receipt form can only be submitted from the store.' })
      }
    } catch {
      return reply(res, 403, { success: false, error: 'This receipt form can only be submitted from the store.' })
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RECEIPT_FROM_EMAIL || 'Beastmode Merch <onboarding@resend.dev>'
  if (!apiKey) {
    return reply(res, 503, { success: false, error: 'Receipt email is not configured yet. Please contact the store.' })
  }

  let uploadedFile: formidable.File | undefined
  try {
    const form = formidable({
      multiples: false,
      maxFields: 20,
      maxFieldsSize: 64 * 1024,
      maxFileSize: MAX_RECEIPT_SIZE,
      maxTotalFileSize: MAX_RECEIPT_SIZE,
      allowEmptyFiles: false,
      minFileSize: 1,
    })
    const [fields, files] = await form.parse(req)
    uploadedFile = firstFile(files.attachment)

    // Quietly drop bot-filled forms so they cannot use this endpoint to send mail.
    if (field(fields, '_honeypot')) return reply(res, 200, { success: true })

    const orderNumber = field(fields, 'Order number')
    const customerName = field(fields, 'Customer name')
    const customerEmail = field(fields, 'Customer email') || field(fields, '_replyto')
    const shippingAddress = field(fields, 'Shipping address')
    const orderItems = field(fields, 'Order items')
    const orderTotal = field(fields, 'Order total')

    if (!orderNumber || !customerName || !customerEmail || !orderItems || !orderTotal || !uploadedFile) {
      return reply(res, 400, { success: false, error: 'Order details and a receipt image are required.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return reply(res, 400, { success: false, error: 'The customer email address is invalid.' })
    }
    if (!uploadedFile.mimetype?.startsWith('image/') || uploadedFile.size > MAX_RECEIPT_SIZE) {
      return reply(res, 400, { success: false, error: 'Choose an image receipt that is 4 MB or smaller.' })
    }

    const attachment = await readFile(uploadedFile.filepath)
    const html = [
      `<h2>Cash App payment receipt: ${escapeHtml(orderNumber)}</h2>`,
      `<p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>`,
      `<p><strong>Customer email:</strong> ${escapeHtml(customerEmail)}</p>`,
      `<p><strong>Shipping address:</strong> ${escapeHtml(shippingAddress)}</p>`,
      `<p><strong>Items:</strong> ${escapeHtml(orderItems)}</p>`,
      `<p><strong>Order total:</strong> ${escapeHtml(orderTotal)}</p>`,
      `<p><strong>Cash App recipient:</strong> ${escapeHtml(field(fields, 'Cash App recipient'))}</p>`,
      '<p>The payment receipt image is attached.</p>',
    ].join('\n')
    const text = [
      `Cash App payment receipt: ${orderNumber}`,
      `Customer: ${customerName}`,
      `Customer email: ${customerEmail}`,
      `Shipping address: ${shippingAddress}`,
      `Items: ${orderItems}`,
      `Order total: ${orderTotal}`,
      `Cash App recipient: ${field(fields, 'Cash App recipient')}`,
      'The payment receipt image is attached.',
    ].join('\n')

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [STORE_EMAIL],
        subject: `Payment receipt for ${orderNumber}`,
        reply_to: customerEmail,
        html,
        text,
        attachments: [{
          filename: uploadedFile.originalFilename || 'payment-receipt',
          content: attachment.toString('base64'),
          content_type: uploadedFile.mimetype,
        }],
      }),
    })

    if (!emailResponse.ok) {
      console.error('Resend rejected the payment receipt:', emailResponse.status, await emailResponse.text())
      return reply(res, 502, { success: false, error: 'The email service could not send the receipt. Please try again shortly.' })
    }

    return reply(res, 200, { success: true })
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'httpCode' in error
      ? Number(error.httpCode)
      : 0
    if (status === 413) return reply(res, 413, { success: false, error: 'The receipt image must be 4 MB or smaller.' })
    console.error('Payment receipt submission failed:', error)
    return reply(res, 500, { success: false, error: 'The receipt could not be sent. Please try again.' })
  } finally {
    if (uploadedFile) await unlink(uploadedFile.filepath).catch(() => undefined)
  }
}
