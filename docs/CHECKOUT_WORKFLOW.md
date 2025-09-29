# Complete Checkout Workflow Implementation

## Overview
This document outlines the complete checkout workflow from cart to payment completion, including Stripe integration and order creation.

## Workflow Architecture

### Phase 1: Cart to Checkout Transition
**Location:** `src/pages/Cart.tsx`

1. User clicks "Proceed to Checkout" button
2. System validates cart has items
3. Navigates to `/checkout`

**Key Validation:**
```typescript
if (!cart?.items || cart.items.length === 0) {
  toast.error("Your cart is empty. Please add items to continue.");
  navigate('/cart');
  return;
}
```

### Phase 2: Checkout Initialization
**Location:** `src/pages/Checkout.tsx`

1. Page loads and waits for cart data
2. Once cart is loaded, calls `startCheckout(cart.id)`
3. Creates checkout session in database
4. Stores checkout ID for tracking

**Database Table:** `checkouts`
- Links to cart_id
- Tracks user_id (if authenticated) or session_id (guest)
- Stores customer information as it's collected
- Status: 'open', 'abandoned', 'converted'

### Phase 3: Customer Identification (Step 1)
**Location:** `src/components/checkout/CustomerIdentify.tsx`

Three modes available:
1. **Guest Checkout** - Email + phone required
2. **Login** - Existing customer credentials
3. **Register** - Create new account

**Data Collected:**
- Email (required)
- Phone (required)
- First Name, Last Name
- Company, ABN (optional)
- Terms & Privacy consents
- Marketing opt-in

**Hook Used:** `useCheckout().identifyCustomer()`

### Phase 4: Shipping & Delivery (Step 2)
**Location:** `src/components/checkout/ShippingDelivery.tsx`

1. Collect shipping address
2. Calculate shipping costs based on postcode
3. Check assembly service eligibility
4. Select delivery options
5. Choose preferred delivery date

**Updates Order Summary:**
```typescript
{
  subtotal: number,
  deliveryTotal: number,
  taxAmount: number (10% GST),
  finalTotal: number
}
```

### Phase 5: Payment Processing (Step 3)
**Location:** `src/components/checkout/PaymentStep.tsx`

**Payment Methods Supported:**
1. **Stripe (Credit Card)** - Immediate processing
2. **PayPal** - For orders under $5,000
3. **Bank Transfer** - Invoice sent after order
4. **Quote Request** - Custom pricing

#### Stripe Payment Flow:

**Component:** `src/components/checkout/StripePaymentForm.tsx`

1. User selects "Credit Card" payment method
2. Clicks "Pay Now" button
3. Calls edge function: `create-stripe-checkout`
4. Edge function creates Stripe checkout session
5. User redirected to Stripe hosted checkout
6. User completes payment on Stripe
7. Stripe redirects to success/cancel URLs

**Edge Function:** `supabase/functions/create-stripe-checkout/index.ts`

**Request:**
```typescript
{
  checkoutId: string,
  totalAmount: number,
  customerInfo: {
    email: string,
    firstName: string,
    lastName: string,
    phone: string
  }
}
```

**Process:**
1. Validates Stripe API key exists
2. Checks if customer exists in Stripe by email
3. Creates customer if doesn't exist
4. Creates checkout session with line items
5. Updates checkout record with stripe_session_id
6. Returns session URL

**Response:**
```typescript
{
  sessionId: string,
  url: string
}
```

**Success URL:**
```
/checkout/success?session_id={CHECKOUT_SESSION_ID}&checkout_id={checkout_id}
```

**Cancel URL:**
```
/checkout?checkout_id={checkout_id}
```

### Phase 6: Payment Verification
**Location:** `src/pages/CheckoutSuccess.tsx`

**Edge Function:** `supabase/functions/verify-stripe-payment/index.ts`

1. User lands on success page with session_id and checkout_id
2. Calls `verify-stripe-payment` edge function
3. Edge function:
   - Retrieves Stripe session by ID
   - Verifies payment_status === 'paid'
   - Updates checkout status to 'converted'
   - Stores payment reference
4. Success page displays confirmation

**Database Updates:**
```sql
UPDATE checkouts SET
  status = 'converted',
  payment_method = 'stripe',
  payment_reference = session_id,
  stripe_customer_id = customer_id,
  updated_at = NOW()
WHERE id = checkout_id;
```

### Phase 7: Order Creation (To Be Implemented)

**Location:** After payment verification

1. Create order record from checkout data
2. Copy cart items to order_items
3. Create initial payment record
4. Generate payment schedule (20% deposit, 80% on delivery)
5. Send confirmation email
6. Clear user's cart
7. Update checkout status

**Database Tables:**
- `orders` - Main order record
- `order_items` - Individual line items
- `payments` - Payment records
- `payment_schedules` - Milestone payments

## Database Schema

### checkouts Table
```sql
- id: uuid (PK)
- cart_id: uuid (FK to carts)
- user_id: uuid (nullable)
- session_id: text (nullable)
- status: text ('open', 'abandoned', 'converted')
- customer_email: text
- customer_phone: text
- customer_first_name: text
- customer_last_name: text
- customer_company: text
- customer_abn: text
- accept_terms: boolean
- accept_privacy: boolean
- marketing_opt_in: boolean
- payment_method: text
- payment_reference: text
- stripe_session_id: text
- stripe_customer_id: text
- started_at: timestamp
- updated_at: timestamp
- expires_at: timestamp (2 hours from start)
```

### payments Table
```sql
- id: uuid (PK)
- order_id: uuid (FK)
- checkout_id: uuid (FK)
- amount: numeric
- currency: text ('AUD')
- payment_method: text
- payment_status: text ('pending', 'completed', 'failed')
- external_payment_id: text (Stripe session/payment ID)
- payment_data: jsonb (full Stripe response)
- processed_at: timestamp
```

## Security & Error Handling

### RLS Policies
- Users can only access their own checkouts (by user_id)
- Anonymous users can access by session_id
- Admins have full access

### Validation
- Client-side validation for all form inputs
- Server-side validation in edge functions
- Email format verification
- Phone format verification (Australian)
- Postcode validation (4 digits)

### Error Scenarios

**Cart Empty:**
- Redirect to cart page
- Display toast message

**Checkout Session Expired:**
- Redirect to cart
- Create new checkout session

**Payment Failed:**
- Redirect to checkout/cancelled
- Cart items preserved
- User can retry

**Payment Verification Failed:**
- Display error message
- Provide support contact
- Log error for admin review

## Key Files Reference

### Frontend Components
- `src/pages/Cart.tsx` - Shopping cart
- `src/pages/Checkout.tsx` - Main checkout page
- `src/pages/CheckoutSuccess.tsx` - Success confirmation
- `src/pages/CheckoutCancelled.tsx` - Cancelled payment
- `src/components/checkout/CustomerIdentify.tsx` - Step 1
- `src/components/checkout/ShippingDelivery.tsx` - Step 2
- `src/components/checkout/PaymentStep.tsx` - Step 3
- `src/components/checkout/StripePaymentForm.tsx` - Stripe integration
- `src/components/checkout/CheckoutSequence.tsx` - Progress indicator

### Hooks
- `src/hooks/useCheckout.ts` - Checkout state management
- `src/hooks/useOptimizedCart.ts` - Cart data fetching
- `src/hooks/useAuth.ts` - Authentication

### Edge Functions
- `supabase/functions/create-stripe-checkout/index.ts` - Create payment session
- `supabase/functions/verify-stripe-payment/index.ts` - Verify payment

## Testing Checklist

### Cart to Checkout
- [ ] Empty cart shows error
- [ ] Valid cart navigates to checkout
- [ ] Cart data persists during checkout

### Customer Identification
- [ ] Guest checkout works
- [ ] Login with existing account works
- [ ] Registration creates new user
- [ ] Email validation works
- [ ] Phone validation works

### Shipping
- [ ] Address validation works
- [ ] Postcode calculates shipping
- [ ] Assembly service calculation
- [ ] Delivery date selection

### Payment
- [ ] Stripe payment completes
- [ ] Redirect to Stripe works
- [ ] Success page loads correctly
- [ ] Payment verification succeeds
- [ ] Cancel returns to checkout

### Error Handling
- [ ] Invalid session shows error
- [ ] Expired checkout handled
- [ ] Network errors handled gracefully
- [ ] Missing Stripe key detected

## Future Enhancements

1. **Order Creation**
   - Auto-create order from successful checkout
   - Generate invoices
   - Send confirmation emails

2. **Payment Schedule**
   - Create 20% deposit payment
   - Schedule 80% balance payment
   - Link to order fulfilment

3. **Abandoned Checkout Recovery**
   - Email reminders
   - Save progress
   - Resume from any step

4. **Multi-Currency Support**
   - Support USD, EUR
   - Dynamic currency conversion

5. **Additional Payment Methods**
   - Afterpay/Zip integration
   - Split payments
   - Store credit

## Support & Debugging

### Console Logs
All key functions include detailed logging:
- `[CREATE-STRIPE-CHECKOUT]` - Stripe session creation
- `[VERIFY-STRIPE-PAYMENT]` - Payment verification

### Edge Function Logs
View in Supabase Dashboard:
- Functions > create-stripe-checkout > Logs
- Functions > verify-stripe-payment > Logs

### Common Issues

**"Your cart is empty" on checkout:**
- Check cart loading state
- Verify cart.items array populated
- Ensure cart query succeeded

**Stripe redirect fails:**
- Verify STRIPE_SECRET_KEY set in Supabase
- Check edge function logs
- Validate customer email format

**Payment verification fails:**
- Check session_id in URL
- Verify checkout_id exists
- Review edge function logs
- Ensure Stripe webhook (if used) configured

## Contact
For implementation questions or issues, refer to:
- Stripe documentation: https://stripe.com/docs
- Supabase edge functions: https://supabase.com/docs/guides/functions
