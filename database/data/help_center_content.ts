import type { HelpSeedCategory } from '#constants/help'

/**
 * The starter help center guides. `help_center_seeder` inserts the ones
 * whose slugs are missing; staff edit the database copies, never this file.
 * Article slugs are unique across categories so `related` can list them.
 */
export const HELP_CENTER_CONTENT: HelpSeedCategory[] = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    description: 'How Akinai works, shopping as a guest, and setting up your account.',
    icon: 'rocket',
    popular: true,
    order: 1,
    groups: [
      { slug: 'basics', title: 'The basics', order: 1 },
      { slug: 'account', title: 'Your account', order: 2 },
    ],
    articles: [
      {
        slug: 'create-an-account',
        title: 'Create an account',
        description:
          'Sign up with your email, Google, or Outlook to save addresses and track your orders.',
        keywords: [
          'sign up',
          'register',
          'account',
          'google',
          'outlook',
          'microsoft',
          'verification code',
        ],
        group: 'account',
        order: 1,
        popular: true,
        related: [
          'sign-in-and-reset-password',
          'guest-orders-and-your-account',
          'manage-addresses',
        ],
        cta: { label: 'Create an account', href: '/signup' },
        markdown: `An account keeps your orders, saved addresses, and returns in one place.

## Sign up with email

1. Choose **Sign in** (the person icon at the top of the page), then choose to create an account. You can also go straight to the sign-up page.
2. Choose **Continue with email**.
3. Enter your full name, email address, and phone number (optional).
4. Choose a password with at least 12 characters, and confirm it.
5. We email you a 6-digit code. Enter it and choose **Create account**.

The code expires after 10 minutes. If it doesn't arrive, check your spam folder, then use **Resend code** (you can ask for a new one every 60 seconds). After 5 wrong attempts the code stops working, so request a new one.

## Sign up with Google or Outlook

Choose **Continue with Google** or **Continue with Outlook** and follow the steps. We use the email address from that account.

## One last step

The first time you sign in, we ask where you're from. Choose your country and timezone, then choose **Continue**. Your country sets the currency you shop in. See **Choose your country and currency**.`,
      },
      {
        slug: 'how-akinai-works',
        title: 'How Akinai works',
        description:
          'Order groceries and essentials online and we deliver them to your family in the Philippines.',
        keywords: ['how it works', 'padala', 'delivery', 'philippines', 'family', 'abroad'],
        group: 'basics',
        order: 1,
        popular: true,
        related: ['shop-as-a-guest', 'choose-your-country-and-currency', 'delivery-areas-and-fees'],
        cta: { label: 'Start shopping', href: '/' },
        markdown: `Akinai lets you send groceries and everyday essentials to the people you care about in the Philippines. You can shop from anywhere, including New Zealand and Australia, and pay in your own currency.

## How an order works

1. **Pick your products.** Browse collections or search for what you need, then add items to your cart.
2. **Enter the delivery address.** Type the address of the person receiving the order in the Philippines, with their name and phone number so our rider can reach them.
3. **Choose a shipping method.** We show the delivery options and fees for that address.
4. **Pay.** Pay by card or by bank transfer.
5. **We deliver.** We pack your order and deliver it. You can follow its progress from your account or your confirmation emails.

## Who receives the order

The person you enter under **Recipient details** at checkout receives the delivery. They don't need an account. We send the order emails to you, the person who placed the order.

## Do I need an account?

No. You can check out as a guest. With an account you can save addresses for your family, see all your orders in one place, and request returns. See **Create an account**.`,
      },
      {
        slug: 'shop-as-a-guest',
        title: 'Shop as a guest',
        description: 'Place an order with just your email address, no account needed.',
        keywords: ['guest', 'guest checkout', 'no account', 'email'],
        group: 'basics',
        order: 2,
        popular: false,
        related: ['check-out', 'create-an-account', 'guest-orders-and-your-account'],
        cta: { label: 'Go to checkout', href: '/checkout' },
        markdown: `You don't need an account to order. At checkout, enter your email address under **Contact** and fill in the delivery details.

## What you get as a guest

- An order confirmation email with your order number.
- A **Thank you** page with your order summary and, if you paid by bank transfer, our bank details.
- Emails when your payment is received, when your order ships, and if anything changes.

The thank-you page link only works for 30 minutes after you place the order. After that, use your confirmation email for your order details.

## If your email already has an account

If the email you enter already belongs to an account, you'll see **Sign in to place an order with this email**. Sign in and continue. Your cart stays as it is.

## Want to track orders later?

Create an account with the same email address you used as a guest. Your earlier guest orders then show up under **Orders** in your account. See **Guest orders and your account**.`,
      },
      {
        slug: 'sign-in-and-reset-password',
        title: 'Sign in and reset your password',
        description: 'Sign in to your account, or set a new password if you forgot it.',
        keywords: [
          'sign in',
          'log in',
          'login',
          'forgot password',
          'reset password',
          'change password',
        ],
        group: 'account',
        order: 2,
        popular: false,
        related: ['create-an-account', 'update-your-details'],
        cta: { label: 'Sign in', href: '/login' },
        markdown: `## Sign in

1. Choose the person icon at the top of the page.
2. Sign in with your email and password, or choose **Continue with Google** or **Continue with Outlook** if you signed up that way.

If you see **No account uses that email yet**, you haven't created an account with that email. Create one first, then sign in.

## Forgot your password

1. On the sign-in page, choose **Forgot password**.
2. Enter your email address and choose **Send reset code**.
3. Check your email for the reset code.
4. Enter the code, choose a new password (at least 12 characters), confirm it, and choose **Reset password**.

## Change your password

To change your password while signed in, sign out and follow the **Forgot password** steps above.

## Account disabled

If you see **This account has been disabled**, contact us using the details at the bottom of this page.`,
      },
      {
        slug: 'choose-your-country-and-currency',
        title: 'Choose your country and currency',
        description:
          'Shop in your own currency, such as NZD or AUD, while sending to the Philippines.',
        keywords: ['country', 'currency', 'nzd', 'aud', 'market', 'shopping from', 'exchange'],
        group: 'basics',
        order: 3,
        popular: false,
        related: ['prices-and-tax', 'delivery-areas-and-fees', 'how-akinai-works'],
        cta: null,
        markdown: `The country you shop from sets the currency and prices you see. It doesn't change where we deliver. Deliveries always go to the address you enter at checkout.

## Change your country

If we sell in more than one country, a **Shopping from** switcher appears at the top of the page. Choose your country and the prices update straight away.

- As a guest, we remember your choice on this device.
- When you're signed in, we also save it to your account, so it follows you to other devices. You can change it later under **Account details**.

## Why can't I buy an item?

Some products aren't sold in every country. If a product shows **Not available in** your country, it can't be ordered while you're shopping from there.

## Paying in your currency

You pay the total shown at checkout, in the currency of the country you're shopping from. Your bank may charge its own fees if your card is in a different currency.`,
      },
    ],
  },
  {
    slug: 'shopping-and-checkout',
    title: 'Shopping and checkout',
    description: 'Find products, use your cart, and place your order.',
    icon: 'shopping-bag',
    popular: true,
    order: 2,
    groups: [
      { slug: 'shopping', title: 'Shopping', order: 1 },
      { slug: 'checkout', title: 'Checkout', order: 2 },
    ],
    articles: [
      {
        slug: 'check-out',
        title: 'Check out',
        description: "Enter the recipient's details, choose a shipping method, and pay.",
        keywords: [
          'checkout',
          'place order',
          'recipient',
          'address',
          'shipping method',
          'complete order',
          'pay now',
          'discount code',
          'promo code',
        ],
        group: 'checkout',
        order: 1,
        popular: true,
        related: [
          'delivery-areas-and-fees',
          'pay-by-card',
          'pay-by-bank-transfer',
          'shop-as-a-guest',
        ],
        cta: { label: 'Go to checkout', href: '/checkout' },
        markdown: `Checkout is a single page. Work through it from top to bottom.

## 1. Contact

- **Guests:** enter your email address. We send your order updates there.
- **Signed in:** we show the email on your account.

## 2. Delivery

Enter the details of the person receiving the order in the Philippines.

- **Recipient details:** first name, last name, and a phone number. Add a phone number so our rider can reach them on the day.
- **Delivery address:** start typing the address and pick it from the suggestions, or type it in full. Add the unit, building, or barangay under **Apartment, suite, etc.**, then the city, region (province), and postal code.

If you're signed in, choose one of your saved addresses under **Ship to**, or choose **Use a new address**. Turn on **Save this address for next time** to keep a new address in your account.

## 3. Shipping method

Once the address is complete, we show the delivery options for it, with their prices. Choose one.

If you see **We don't ship to this address yet**, we don't deliver to that area. See **Delivery areas and fees**.

## 4. Payment

Choose **Credit or debit card** or **Bank transfer**, then choose **Pay now** or **Complete order**. See **Pay by card** and **Pay by bank transfer**.

Check the **Order summary** before you pay. On your phone, tap it to open it.

## Discount codes

There's no box for discount codes at checkout. Any sale prices are already shown on the product.

## After you order

We email your order confirmation. Guests see a **Thank you** page, and signed-in customers go to their account with the order at the top.`,
      },
      {
        slug: 'find-products',
        title: 'Find products',
        description: 'Search the store, browse collections, and filter or sort what you see.',
        keywords: ['search', 'browse', 'collections', 'filter', 'sort', 'in stock', 'price'],
        group: 'shopping',
        order: 1,
        popular: false,
        related: ['use-your-cart', 'prices-and-tax'],
        cta: { label: 'Browse the store', href: '/' },
        markdown: `## Search

Type in **Search for products…** at the top of any page. Matching products appear as you type, and you can choose **Add** to put one straight into your cart.

## Browse collections

Use the menu at the top of the page (or the menu button on your phone) to open a collection, such as rice, canned goods, or toiletries. On the home page, choose **View all** next to a row to see the whole collection.

## Filter and sort

On a collection page:

- Choose **Filters** to show only items that are **In stock**, or to set a price range. Choose **Clear all** to remove your filters.
- Use the sort menu to order products by **Featured**, price, name, or date added.
- Switch between the grid and list views.

## Product details

Open a product to see its photos, options (such as size or pack), price, and reviews. If a product is on sale, you'll see how much you save. Choose a quantity, then **Add to Bag**.

If a product shows **Unavailable**, it's out of stock or no longer sold.`,
      },
      {
        slug: 'delivery-areas-and-fees',
        title: 'Delivery areas and fees',
        description: 'Where we deliver in the Philippines and how the shipping fee is worked out.',
        keywords: [
          'delivery',
          'shipping',
          'fee',
          'manila',
          'metro manila',
          'philippines',
          'area',
          'province',
          'free shipping',
        ],
        group: 'checkout',
        order: 2,
        popular: true,
        related: ['check-out', 'track-your-order', 'choose-your-country-and-currency'],
        cta: null,
        markdown: `We deliver to addresses in the Philippines. The areas we cover can grow over time, so the quickest way to check an address is to enter it at checkout.

## How to check an address

1. Add something to your cart and go to checkout.
2. Enter the recipient's delivery address.
3. The **Shipping method** section shows the options for that address, or **We don't ship to this address yet** if we can't deliver there.

## Shipping fees

The fee depends on the delivery area and the option you choose. It's shown next to each shipping method, in the currency you're shopping in. Options marked **Free** cost nothing.

The shipping fee is added to your order summary before you pay. If your country's prices include tax, tax may also apply to shipping.

## Tips for a smooth delivery

- Add the recipient's mobile number so the rider can call or text them.
- Include landmarks, the building name, or the barangay under **Apartment, suite, etc.**
- Let the recipient know an order is on its way.

To follow a delivery after it ships, see **Track your order**.`,
      },
      {
        slug: 'use-your-cart',
        title: 'Use your cart',
        description: 'Change quantities, remove items, and see your subtotal before checkout.',
        keywords: ['cart', 'bag', 'basket', 'quantity', 'remove', 'subtotal', 'empty cart'],
        group: 'shopping',
        order: 2,
        popular: false,
        related: ['find-products', 'check-out', 'prices-and-tax'],
        cta: null,
        markdown: `Choose the cart icon at the top of any page to open your cart.

## Change your cart

- Use **+** and **−** to change the quantity of an item.
- Use the remove button to take an item out.
- Choose **Clear cart** to start again.

Your cart is saved on this device, so you can come back to it later.

## Subtotal and fees

The cart shows your **Subtotal**. Shipping is calculated at checkout once you enter the delivery address. If your country's prices include tax (for example GST), the cart says so under the subtotal.

## Items you can't check out

If a product stops being available, or isn't sold in the country you're shopping from, checkout shows **Some items in your cart can't be checked out**. Remove those items to continue.

When you're ready, choose **Checkout**.`,
      },
      {
        slug: 'prices-and-tax',
        title: 'Prices and tax',
        description: "What's included in the prices you see and how tax shows on your order.",
        keywords: ['price', 'tax', 'gst', 'vat', 'included', 'excluded', 'total', 'sale'],
        group: 'checkout',
        order: 3,
        popular: false,
        related: ['choose-your-country-and-currency', 'use-your-cart', 'delivery-areas-and-fees'],
        cta: null,
        markdown: `Prices and tax depend on the country you're shopping from.

## Tax included or added

- When prices **include tax**, you'll see a note such as **Incl. GST** next to prices. The amount you see is what you pay for the item.
- When prices **exclude tax**, you'll see **Excl. tax**, and tax is added at checkout.

The **Order summary** at checkout shows the subtotal, shipping, tax, and total before you pay. Your order page and confirmation email show the same breakdown.

## Sale prices

When a product is on sale, its page shows the original price and how much you save. The sale price is the one you pay.

## Totals are checked before you pay

We work out the final total on our side when you place the order. If a price changed while your cart was open, the order uses the current price shown at checkout.`,
      },
    ],
  },
  {
    slug: 'payments',
    title: 'Payments',
    description: 'Paying by card or bank transfer, sending proof of payment, and payment statuses.',
    icon: 'credit-card',
    popular: true,
    order: 3,
    groups: [
      { slug: 'ways-to-pay', title: 'Ways to pay', order: 1 },
      { slug: 'after-paying', title: 'After you pay', order: 2 },
    ],
    articles: [
      {
        slug: 'pay-by-card',
        title: 'Pay by card',
        description:
          'Pay securely with a credit or debit card, Apple Pay, or Google Pay through Stripe.',
        keywords: [
          'card',
          'credit card',
          'debit card',
          'visa',
          'mastercard',
          'apple pay',
          'google pay',
          'stripe',
          'pay now',
          'payment failed',
        ],
        group: 'ways-to-pay',
        order: 1,
        popular: true,
        related: ['pay-by-bank-transfer', 'payment-statuses', 'check-out'],
        cta: null,
        markdown: `Card payments are handled by Stripe, a secure payment provider. We never see or store your full card number.

## How to pay by card

1. At checkout, choose **Credit or debit card**.
2. Choose **Pay now**. We take you to Stripe's secure payment page.
3. Pay with your card, Apple Pay, or Google Pay.
4. Stripe brings you back to our store, where you'll see your order confirmation.

## If the payment page doesn't open

If you see **Your order is saved, but we couldn't open the card payment page**, your order is waiting for payment. Choose **Pay now** to try again.

## If the payment didn't go through

Your order is kept as **Awaiting payment**. To try again:

- **Signed in:** open **Orders** in your account, open the order, and choose **Pay now**.
- **Guest:** check your confirmation email, or contact us and we'll help you finish the payment.

If your bank declines the card, try another card or pay by bank transfer instead.

## Is there cash on delivery?

No. Orders are paid online by card or by bank transfer before we deliver.`,
      },
      {
        slug: 'send-proof-of-payment',
        title: 'Send proof of payment',
        description:
          'Upload a screenshot or receipt of your bank transfer so we can confirm it faster.',
        keywords: [
          'proof of payment',
          'receipt',
          'screenshot',
          'upload',
          'bank transfer',
          'payment rejected',
        ],
        group: 'after-paying',
        order: 1,
        popular: false,
        related: ['pay-by-bank-transfer', 'payment-statuses'],
        cta: { label: 'Open your orders', href: '/account/orders' },
        markdown: `If you paid by bank transfer, you can send us proof of payment from your order page. You need to be signed in to do this. Guests can reply to their confirmation email or contact us instead.

## Send your proof

1. Open **Orders** in your account and choose the order.
2. Under **Already paid? Send us your proof**, add a screenshot or photo of your transfer receipt (JPG, PNG, or WebP, up to 5 MB).
3. You can also type the payment details, such as the date, amount, and reference.
4. Choose **Send proof of payment**.

The order then shows **Proof of payment sent**, and its payment status changes to **Payment submitted**. Choose **Replace proof** if you sent the wrong file.

## If we couldn't confirm your payment

If your order shows **We couldn't confirm your payment**, we've added the reason below it. This usually means we couldn't find the transfer or the amount didn't match. Check the reason, then send a new proof or contact us.`,
      },
      {
        slug: 'pay-by-bank-transfer',
        title: 'Pay by bank transfer',
        description: 'Transfer the total to our bank account using your order reference.',
        keywords: [
          'bank transfer',
          'bank deposit',
          'account number',
          'bsb',
          'reference',
          'hpdl',
          'internet banking',
        ],
        group: 'ways-to-pay',
        order: 2,
        popular: false,
        related: ['send-proof-of-payment', 'payment-statuses', 'pay-by-card'],
        cta: null,
        markdown: `You can pay by transferring the order total from your bank account.

## How to pay by bank transfer

1. At checkout, choose **Bank transfer**, then **Complete order**.
2. We show our bank details: account name, bank, account number, and (for Australian accounts) the BSB. They're also in your confirmation email and on your order page.
3. Transfer the exact order total from your internet banking.
4. Use **HPDL followed by your order number** as the payment reference, so we can match your payment to your order.

## When we send your order

We hold your order until the payment reaches our account. How long that takes depends on your bank. When it arrives, we mark the order **Paid** and email you.

To speed things up, send us your proof of payment. See **Send proof of payment**.

## Common mistakes

- **Wrong amount:** transfer the exact total, including shipping.
- **Missing reference:** if you forgot the reference, send your proof of payment so we can find your transfer.`,
      },
      {
        slug: 'payment-statuses',
        title: 'Payment statuses',
        description: 'What each payment status on your order means.',
        keywords: [
          'payment status',
          'awaiting payment',
          'payment submitted',
          'paid',
          'refunded',
          'not charged',
        ],
        group: 'after-paying',
        order: 2,
        popular: false,
        related: ['order-statuses', 'refunds', 'send-proof-of-payment'],
        cta: null,
        markdown: `Each order shows a payment status on your order page and in your account.

| Status | What it means |
| --- | --- |
| **Awaiting payment** | We haven't received your payment yet. Pay by card from the order page, or complete your bank transfer. |
| **Payment submitted** | You've sent proof of a bank transfer. We're checking it. |
| **Paid** | We've received your payment. Your order is being prepared. |
| **Partially refunded** | We've refunded part of your payment, for example for an item we couldn't deliver. |
| **Refunded** | We've refunded the full amount. |
| **Not charged** | The order was cancelled before you paid, so you weren't charged. |

For shipping progress, see **Order statuses**.`,
      },
    ],
  },
  {
    slug: 'orders-and-delivery',
    title: 'Orders and delivery',
    description: 'Track your order, understand its status, and get in touch about it.',
    icon: 'truck',
    popular: true,
    order: 4,
    groups: [
      { slug: 'tracking', title: 'Tracking', order: 1 },
      { slug: 'changes', title: 'Changes and questions', order: 2 },
    ],
    articles: [
      {
        slug: 'messages-about-your-order',
        title: 'Messages about your order',
        description: 'Read updates from our team and reply to them from your order page.',
        keywords: ['message', 'update', 'reply', 'contact', 'question', 'note'],
        group: 'changes',
        order: 1,
        popular: false,
        related: ['change-or-cancel-an-order', 'track-your-order'],
        cta: { label: 'Open your orders', href: '/account/orders' },
        markdown: `Sometimes we need to tell you something about an order, such as a substitute item or a delivery delay. We post these updates on the order and email you.

## Read and reply

1. Open **Orders** in your account and choose the order.
2. Scroll to **Updates from us**.
3. Choose **Reply** under an update, type your message, and send it.

Your reply is added to the same order, and we respond there.

## Guests

We send order updates to the email you used at checkout. To answer one, contact us using the email or phone number at the bottom of the page, and include your order number.`,
      },
      {
        slug: 'track-your-order',
        title: 'Track your order',
        description: 'Follow your order from payment to delivery in the Philippines.',
        keywords: [
          'track',
          'tracking number',
          'where is my order',
          'shipment',
          'courier',
          'delivery status',
        ],
        group: 'tracking',
        order: 1,
        popular: true,
        related: ['order-statuses', 'messages-about-your-order', 'delivery-areas-and-fees'],
        cta: { label: 'Open your orders', href: '/account/orders' },
        markdown: `## Signed-in customers

1. Choose the person icon at the top of the page, then **Orders**.
2. Open the order you want to check.

The order page shows the payment and shipping status, the delivery address, and the items. When your order ships, a **Shipments** section lists the carrier and tracking number. Choose the tracking link to follow the delivery on the carrier's website.

## Guests

We email you when your order ships, with tracking details when they're available. Keep your confirmation email, as it has your order number.

To see all your orders in one place, create an account with the same email address. See **Guest orders and your account**.

## Emails we send

- **Order confirmed** when you place your order.
- **Payment received** when we confirm your payment.
- **On the way** when your order ships, and **Shipping update** if the tracking changes.
- An email whenever we post an update about your order.`,
      },
      {
        slug: 'change-or-cancel-an-order',
        title: 'Change or cancel an order',
        description: 'How to ask us to change the address or items, or to cancel an order.',
        keywords: [
          'cancel',
          'change order',
          'edit order',
          'wrong address',
          'change address',
          'add item',
        ],
        group: 'changes',
        order: 2,
        popular: false,
        related: ['messages-about-your-order', 'refunds', 'order-statuses'],
        cta: null,
        markdown: `You can't change or cancel an order yourself once it's placed, but we can usually help if it hasn't shipped yet.

## Ask us to change or cancel

Contact us as soon as possible with your order number and what you'd like to change. Use the email or phone number at the bottom of this page, or reply to an update on your order page.

- **Before it ships:** we can usually change the delivery address or items, or cancel the order.
- **After it ships:** we can't cancel it. Once it's delivered, you may be able to request a return. See **Request a return**.

## What happens when we cancel

We email you to confirm. If you hadn't paid, you aren't charged. If you had paid, we refund you. See **Refunds**.

## Forgot something?

Place a new order for the extra items. We can't add items to an order that's already placed.`,
      },
      {
        slug: 'order-statuses',
        title: 'Order statuses',
        description: 'What Processing, Partially shipped, Shipped, and Cancelled mean.',
        keywords: [
          'order status',
          'processing',
          'shipped',
          'partially shipped',
          'cancelled',
          'fulfilment',
        ],
        group: 'tracking',
        order: 2,
        popular: false,
        related: ['payment-statuses', 'track-your-order', 'change-or-cancel-an-order'],
        cta: null,
        markdown: `Your order page shows a shipping status next to the payment status.

| Status | What it means |
| --- | --- |
| *(no shipping status)* | We've received your order and haven't started packing it yet. Unpaid orders stay here until payment arrives. |
| **Processing** | We're preparing your order, or it's briefly on hold while we sort something out. |
| **Partially shipped** | Some items are on their way. The rest will follow in another shipment. |
| **Shipped** | Everything is on its way. Check **Shipments** on the order page for tracking. |
| **Cancelled** | The order was cancelled. The order page shows the date. If you hadn't paid, it says **You have not been charged**. If you had paid, we refund you. See **Refunds**. |

For payment statuses such as **Awaiting payment** or **Paid**, see **Payment statuses**.`,
      },
    ],
  },
  {
    slug: 'returns-and-refunds',
    title: 'Returns and refunds',
    description: "Request a return, follow its progress, and find out when you'll be refunded.",
    icon: 'rotate-ccw',
    popular: true,
    order: 5,
    groups: [
      { slug: 'returns', title: 'Returns', order: 1 },
      { slug: 'refunds', title: 'Refunds', order: 2 },
    ],
    articles: [
      {
        slug: 'refunds',
        title: 'Refunds',
        description: 'How and when you get your money back for cancelled orders and returns.',
        keywords: [
          'refund',
          'money back',
          'card refund',
          'bank refund',
          'partial refund',
          'net paid',
        ],
        group: 'refunds',
        order: 1,
        popular: false,
        related: ['return-statuses', 'payment-statuses', 'change-or-cancel-an-order'],
        cta: null,
        markdown: `We refund you when we cancel a paid order, when we can't supply an item, or after we receive a returned item.

## How you're refunded

- **Paid by card:** the refund goes back to the same card. It can take 5 to 10 business days to appear on your statement, depending on your bank.
- **Paid by bank transfer:** we send the money back to you directly. We'll contact you if we need your bank details.

We email you when a refund is issued.

## See your refunds

Open the order in your account. The **Refunds** section lists each refund, the items it covers, and the amount. The order summary shows the total **Refunded** and the **Net paid**.

The payment status changes to **Partially refunded** or **Refunded**. See **Payment statuses**.

## Haven't received your refund?

Card refunds can take up to 10 business days. If it's been longer, contact us with your order number.`,
      },
      {
        slug: 'request-a-return',
        title: 'Request a return',
        description: 'Ask to return items from a delivered order within the return window.',
        keywords: [
          'return',
          'request return',
          'damaged',
          'defective',
          'wrong item',
          'not as described',
          'return window',
          'exchange',
        ],
        group: 'returns',
        order: 1,
        popular: true,
        related: ['return-statuses', 'refunds', 'guest-orders-and-your-account'],
        cta: { label: 'Open your orders', href: '/account/orders' },
        markdown: `You can request a return from your account for items that have shipped, usually within 30 days of the latest shipment. Your order page shows the exact last day.

## Request a return

1. Sign in, open **Orders**, and choose the order.
2. Under **Returns**, check the date in **You can request a return until**.
3. Choose **Request a return**.
4. Choose how many of each item you want to return, and pick a reason:
   - Size too small or Size too large
   - Not as described
   - Damaged or defective
   - Wrong item sent
   - Changed my mind
   - Other
5. Add a note if it helps, such as a description of the damage, and choose **Request return**.

**Don't send anything back yet.** We review your request first and email you with the next steps.

## Ordered as a guest?

Returns are requested from your account. Create an account with the email you used at checkout, and the order will appear under **Orders**. See **Guest orders and your account**. You can also contact us directly.

## When returns aren't available

- Items that haven't shipped yet can't be returned. If you no longer want them, see **Change or cancel an order**.
- After the return window ends, the **Request a return** button no longer appears. Contact us if there's a problem with your order.
- If the order page says **This store doesn't accept return requests online**, contact us instead.`,
      },
      {
        slug: 'return-statuses',
        title: 'Return statuses',
        description: 'What happens at each step after you request a return.',
        keywords: [
          'return status',
          'requested',
          'approved',
          'declined',
          'received',
          'refunded',
          'cancelled',
        ],
        group: 'returns',
        order: 2,
        popular: false,
        related: ['request-a-return', 'refunds'],
        cta: null,
        markdown: `Each return request on your order page shows a status.

| Status | What it means |
| --- | --- |
| **Requested** | We're reviewing your request. Don't send anything back yet. |
| **Approved** | We've accepted your return. Check your email for how to send the items back. |
| **Declined** | We can't accept this return. The reason is shown with the request. |
| **Received** | The items are back with us. We'll refund you shortly. |
| **Refunded** | We've refunded you for the returned items. See **Refunds**. |
| **Cancelled** | The return request was cancelled. |

We email you each time a return changes status.`,
      },
    ],
  },
  {
    slug: 'your-account',
    title: 'Your account',
    description: 'Manage your saved addresses, personal details, activity, and reviews.',
    icon: 'user',
    popular: false,
    order: 6,
    groups: [
      { slug: 'details', title: 'Details and addresses', order: 1 },
      { slug: 'more', title: 'More from your account', order: 2 },
    ],
    articles: [
      {
        slug: 'account-activity',
        title: 'Account activity',
        description: 'See the changes and deletions made in your account.',
        keywords: ['activity', 'history', 'changes', 'log', 'security'],
        group: 'more',
        order: 1,
        popular: false,
        related: ['update-your-details', 'manage-addresses'],
        cta: { label: 'Open activity', href: '/account/activity' },
        markdown: `**Activity** in your account lists the changes and deletions you've made, newest first. For example, it shows when you changed your phone number or deleted a saved address.

Each entry shows what changed, with the old value and the new value. Choose **Show more** to see older entries.

## Something you don't recognise?

If you see a change you didn't make, reset your password straight away (see **Sign in and reset your password**) and contact us.`,
      },
      {
        slug: 'manage-addresses',
        title: 'Manage addresses',
        description: "Save your family's addresses in the Philippines so checkout is faster.",
        keywords: [
          'address',
          'saved address',
          'address book',
          'default address',
          'recipient',
          'edit address',
          'delete address',
        ],
        group: 'details',
        order: 1,
        popular: true,
        related: ['check-out', 'update-your-details', 'delivery-areas-and-fees'],
        cta: { label: 'Open your addresses', href: '/account/addresses' },
        markdown: `Save the addresses you send to most, such as your parents' home or a sibling's apartment. At checkout you can then pick one under **Ship to**.

## Add an address

1. Choose the person icon at the top of the page, then **Addresses**.
2. Choose **Add address**.
3. Enter the recipient's name, the country, the address (with the unit, building, or barangay under **Apartment, suite, etc.**), city, province, postal code, and phone number.
4. Turn on **Use as my default address** if you send here most often.
5. Save.

You can also save an address while checking out by turning on **Save this address for next time**.

## Edit, set as default, or delete

Each saved address has **Edit**, **Set as default**, and **Delete** buttons. If you delete your default address, your most recently added address becomes the new default.

Changing a saved address doesn't change orders you've already placed. To change the address on an existing order, see **Change or cancel an order**.`,
      },
      {
        slug: 'update-your-details',
        title: 'Update your details',
        description: 'Change your name, email, phone number, country, or timezone.',
        keywords: [
          'account details',
          'profile',
          'name',
          'email',
          'phone',
          'country',
          'timezone',
          'change email',
        ],
        group: 'details',
        order: 2,
        popular: false,
        related: [
          'sign-in-and-reset-password',
          'choose-your-country-and-currency',
          'account-activity',
        ],
        cta: { label: 'Open account details', href: '/account/details' },
        markdown: `1. Choose the person icon at the top of the page, then **Account details**.
2. Update your full name, email, phone number, country, or timezone.
3. Choose **Save changes**.

## Changing your email

To change your email address, enter your current password as well. This keeps your account safe if someone else gets hold of your device. We send order emails to your new address from then on.

## Changing your country

Your country sets the currency and prices you shop with. See **Choose your country and currency**.

## Changing your password

See **Sign in and reset your password**.`,
      },
      {
        slug: 'write-a-review',
        title: 'Write a review',
        description: 'Rate a product and share what you think to help other shoppers.',
        keywords: ['review', 'rating', 'stars', 'feedback', 'product review'],
        group: 'more',
        order: 2,
        popular: false,
        related: ['find-products', 'create-an-account'],
        cta: null,
        markdown: `You need to be signed in to write a review. You can leave one review per product.

## Write a review

1. Open the product page.
2. Scroll to the reviews and choose **Write a review**.
3. Choose a star rating, add a title if you like, and write your review.
4. Choose **Post review**.

Your review appears on the product straight away. We may hide reviews that break our rules, such as reviews with offensive language or personal information.`,
      },
      {
        slug: 'guest-orders-and-your-account',
        title: 'Guest orders and your account',
        description: 'See orders you placed as a guest by creating an account with the same email.',
        keywords: ['guest order', 'link order', 'missing order', 'claim order', 'same email'],
        group: 'details',
        order: 3,
        popular: false,
        related: ['shop-as-a-guest', 'create-an-account', 'track-your-order'],
        cta: { label: 'Create an account', href: '/signup' },
        markdown: `If you ordered as a guest, you can still see those orders in an account later.

## Link your guest orders

Create an account using **the same email address** you entered at checkout. Your earlier guest orders then appear under **Orders** in your account, where you can track them, send proof of payment, and request returns.

## Order missing from your account?

- Check you're signed in with the same email you used at checkout. Orders placed with a different email won't appear.
- If you signed up with Google or Outlook, the email on that account must match too.

Still can't find it? Contact us with your order number.`,
      },
    ],
  },
]
