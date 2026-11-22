# BookNest — E-commerce Bookstore Demo

BookNest is a responsive front-end bookstore prototype built with HTML, CSS, and vanilla JavaScript. It demonstrates the main customer journey for an online shop while keeping a soft cream, rose, and literary visual identity.

## Included features

- Responsive storefront and navigation
- Eight sample book products with category labels, descriptions, and prices
- Search by title, author, or category
- Category filters and sorting (featured, title, price)
- Product detail modal
- Shopping cart with quantity controls, remove action, subtotal, and persistent browser storage
- Demo coupon code `READ10` for 10% off
- Wishlist / saved books with persistent browser storage
- Demo checkout form with required customer details
- Demo order confirmation, receipt summary, and local order history
- Demo newsletter sign-up stored locally in the browser
- Custom favicon, keyboard Escape handling, accessible labels, and responsive layouts

## Run locally

1. Open this folder in Visual Studio Code.
2. Open `index.html` in a browser, or use the VS Code Live Server extension.
3. Keep `index.html`, `style.css`, `script.js`, and `booknest_favicon.png` in the same folder.

## Publish with Netlify

1. Open the existing BookNest site in Netlify.
2. In VS Code / File Explorer, locate the `BookNest_Ecommerce` folder — the folder containing `index.html`.
3. Drag that folder into the Netlify manual deploy area, or connect the folder through your chosen deployment workflow.
4. Wait for the deploy to finish, then open the public site URL and test it in a private/incognito window.

## Important project scope

This is a front-end classroom demonstration, not a production commerce system. The checkout does **not** collect money, send emails, contact a seller, calculate real shipping, or save orders to a server. Cart, wishlist, demo newsletter sign-ups, and order history are stored only in the visitor's browser using `localStorage`. A real store requires a secure backend/database, server-side order processing, payment-provider integration, inventory management, shipping/tax rules, and privacy/security controls. Never collect real customer payment details in this demo.

## Suggested final checks

- Search for a book and switch categories.
- Sort by price in both directions.
- Open a product detail and add it to the bag.
- Save a book to the wishlist, close/reopen the page, and confirm it remains saved.
- Change quantities, remove an item, and try `READ10`.
- Place a demo order and check **My orders**.
- Test at desktop and mobile widths.
- Confirm the favicon appears in the browser tab.
