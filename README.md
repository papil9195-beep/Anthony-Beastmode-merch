# Anthony Beastmode Merch

A responsive merch storefront built with React, TypeScript, and Vite. Product information is kept in `src/products.ts`, and all product images are imported from the supplied `Image/` folder and bundled with the site. No product API or remote product photography is used.

## Start the storefront

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.

The storefront includes product search and filters, product details, saved items, a persistent bag, size selection, shipping progress, and a newsletter preview. Checkout offers an email option or Cash App. The Cash App option expands inline with the payment tag, order total, and receipt image upload. On Vercel, the receipt image and order details are sent to `abeastmode803@gmail.com` by the server-side `/api/receipt` function using Resend. A success message appears only after Resend accepts the email. Receipt images must be 4 MB or smaller because Vercel Functions limit request bodies to 4.5 MB.

To enable receipt email delivery, create a Resend API key and set `RESEND_API_KEY` in the Vercel project’s Environment Variables, then redeploy. The default sender works for testing if the Resend account is registered to `abeastmode803@gmail.com`; otherwise, verify a domain in Resend and set `RECEIPT_FROM_EMAIL` to an address on that domain. For local development, copy `.env.example` to `.env.local`, fill in the values, and run `npx vercel dev` after linking this repository to the Vercel project so `/api/receipt` is available. Never expose the Resend API key in client-side code or commit it to Git.

Cart and saved items are stored in local storage. Newsletter sign-up remains a preview and does not submit data.

Replace the local catalog in `src/products.ts` to change product names, descriptions, categories, and prices. Add new image files to `Image/`, then import and assign them in the product list.
