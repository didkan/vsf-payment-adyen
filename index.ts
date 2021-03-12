import { StorefrontModule } from '@vue-storefront/core/lib/modules'
import { StorageManager } from '@vue-storefront/core/lib/storage-manager'
import { module } from './store'
import { afterRegistration } from './hooks/afterRegistration'

export const KEY = 'payment-adyen'

export const PaymentAdyenModule: StorefrontModule = function ({ store }) {
  StorageManager.init(KEY)
  store.registerModule(KEY, module)
  afterRegistration(store)
}
