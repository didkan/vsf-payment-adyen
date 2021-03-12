# Vue Storefront Adyen Payment Module

This module allows payments through Adyen Payments from Vue Storefront using Magento as backend.  
The module follows [Adyen's recomendations](https://docs.adyen.com/plugins/magento-2/magento-pwa-storefront) for integrating a PWA using their magento extension.

## Requirements
- Magento >= 2.3.5 (may work in earlier version but it has not been tested)
- Adyen Magento2 extension version >= 6.5.0
- Vue Storefront >= 1.10.0
- Have latest version of [magento2-rest-client](magento2-rest-client). At least you need [this PR](https://github.com/DivanteLtd/magento2-rest-client/pull/35)

## Before you begin

Before starting to integrate this module in your VueStorefront project, you will have to set-up the following:
- [Create a Adyen test account if you do not have one.](https://www.adyen.com/)
- [Set up the Adyen Customer Area.](https://docs.adyen.com/plugins/magento-2/set-up-adyen-customer-area)
- [Set up the plugin in Magento.](https://docs.adyen.com/plugins/magento-2/set-up-the-plugin-in-magento)
- [Set up the payment methods in Magento.](https://docs.adyen.com/plugins/magento-2/set-up-the-payment-methods-in-magento)

#### Features:
- [x] Adyen CreditCard payment
- [x] Adyen field validation and encryption.
- [x] 3DS2 authentification

#### To be done:
- [ ] Retry 3DS2 Authentification after entering wrong code.
- [ ] Adyen PayPal payment.
- [ ] Add other payments methods.
- [ ] 3DS1 authentification.
- [ ] Store credit carts with Adyen Vault.

## Installation:

```shell
$ git clone https://github.com/jimmylion/vsf-payment-adyen.git ./vue-storefront/src/modules/adyen
```

## Configuration
`config/local.json`
Add API Key and paypal endpoint to hendle PayPal result from adyen.
```json
  "adyen": {
    "originKey": "origin_key",
    "paypalResultHandler": "https://your-backend/adyen-end-points/paypal",
    "environment": "test",
    "saveCards": true/false,
    "allow3DS2": true/false,
    "originKeys": {
      "http://localhost:3000": "your localhost origin_key",
      "https://staging.your-vsf.com": "your staging origin_key",
      "https://your-vsf.com": "your production origin key"
    }
  },
```

set Driver for adyen

```
  "localForage": {
    "defaultDrivers": {
      ...
      "payment-adyen": "LOCALSTORAGE"
    }
  }

```

## Register the Adyen module

In `./src/modules/index.ts`

```js
...
import { PaymentAdyen } from './payment-adyen';

export const registerModules: VueStorefrontModule[] = [
  ...,
  PaymentAdyen
]
```

## Checkout/Payment
Under your theme `components/core/blocks/Checkout/Payment.vue`.

```js
export default {
  components: {
    ...
    AdyenPayments: () =>
      import("src/modules/payment-adyen/components/AdyenPayments.vue")
  },
```

@todo - explain where and how to include the FinishPayment component.  In our case it is in:
src/themes/jimmylion-theme/pages/Checkout.vue
src/themes/jimmylion-theme/components/ui/Checkout/OrderReview.vue

Also add form component to your template:

```html
<AdyenPayments
  v-show="payment.paymentMethod === 'adyen_cc' && adyenVisible"
  @providedAdyenData="providedAdyenData"
/>
```

## API Installation
[How to get the API key](https://docs.adyen.com/developers/user-management/how-to-get-the-api-key)


## References
[Styling Secured Fields](https://docs.adyen.com/developers/checkout/api-integration/configure-secured-fields/styling-secured-fields)

```js
export default {
  name: 'CardForm',
  data () {
    return {
      ...
      csfSetupObj: {
```
