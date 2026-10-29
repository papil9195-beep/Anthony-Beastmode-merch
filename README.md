# Anthony Beastmode Merch

A responsive merch storefront built with React, TypeScript, and Vite. Product information is kept in `src/products.ts`, and all product images are imported from the supplied `Image/` folder and bundled with the site. No product API or remote product photography is used.

## Start the storefront

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.

The storefront includes product search and filters, product details, saved items, a persistent bag, size selection, shipping progress, and a newsletter preview. Checkout offers an email option or Cash App. The Cash App option expands inline with the payment tag, order total, and receipt image upload. Customers can submit the receipt image and order details to `abeastmode803@gmail.com` through FormSubmit. FormSubmit requires the store owner to confirm the email address on the first submission. Cart and saved items are stored in local storage. Newsletter sign-up remains a preview and does not submit data.

Replace the local catalog in `src/products.ts` to change product names, descriptions, categories, and prices. Add new image files to `Image/`, then import and assign them in the product list.
