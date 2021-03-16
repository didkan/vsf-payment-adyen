<template>
  <div class="adyen-block">
    <div ref="adyen-payments-dropin"></div>
  </div>
</template>

<script>
import { currentStoreView } from "@vue-storefront/core/lib/multistore"
import collectBrowserInfo from "../adyen-utils/browser"
import i18n from "@vue-storefront/i18n"
import Shared from './Shared'
import config from 'config'
import { mapGetters } from 'vuex'

export default {
  name: "AdyenPayments",
  mixins: [Shared],
  data() {
    return {
      payment: this.$store.state.checkout.paymentDetails,
      adyenCheckoutInstance: null,
      dropin: null,
      cardMaps: {
        amex: "AE",
        discover: "DI",
        jcb: "JCB",
        mc: "MC",
        visa: "VI",
        maestro: "MI",
        diners: "DN",
        unionpay: "CUP",
      },
    }
  },
  computed: {
    ...mapGetters({
      checkoutShippingDetails: 'checkout/getShippingDetails',
      paymentMethods: 'payment-adyen/methods',
      isLoggedIn: 'user/isLoggedIn'
    }),
    storeView () {
      return currentStoreView()
    },
    showStored () {
      return this.isLoggedIn && config.adyen.saveCards
    }
  },
  methods: {
    async createForm() {
      if (
        this.payment &&
        this.payment.paymentMethodAdditional &&
        Object.keys(this.payment.paymentMethodAdditional).length
      ) {
        this.payment.paymentMethodAdditional = {}
      }

      const { originKeys, originKey: singleOriginKey, clientKey, environment } = config.adyen
      const origin = window.location.origin
      const originKey = originKeys && originKeys.hasOwnProperty(origin) ? originKeys[origin] : singleOriginKey
      if (!originKey && !clientKey) {
        console.error("[Adyen] Set origin or client key in the config!")
      }

      if (this.showStored) {
        await Promise.all([
          this.$store.dispatch("payment-adyen/loadVault"),
          this.$store.dispatch("payment-adyen/loadPaymentMethods", { country: this.checkoutShippingDetails.country }),
        ])
      } else {
        await this.$store.dispatch("payment-adyen/loadPaymentMethods", { country: this.checkoutShippingDetails.country })
      }

      const translations = {
        "en-US": {
          payButton: "Continue",
        },
        "es-ES": {
          payButton: "Continuar",
        },
        "es-MX": {
          payButton: "Continuar",
        },
        "fr-FR": {
          payButton: "Continuer",
        },
        "de-DE": {
          payButton: "Weitergehen",
        },
        "it-IT": {
          payButton: "Continuare",
        },
      }
      const configuration = {
        locale: this.storeView.i18n.defaultLocale,
        translations,
        environment,
        ...(clientKey ? { clientKey: clientKey } : { originKey: originKey }),
        paymentMethodsResponse: {
          // There I am setting payment methods
          // For now only scheme === adyen_cc
          paymentMethods: this.paymentMethods,
          ...(
            this.hasStoredCards()
            ? { storedPaymentMethods: this.$store.getters['payment-adyen/cards'] }
            : {}
          )
        },
        allowPaymentMethods: config.adyen.paymentMethods[this.storeView.storeCode],
        paymentMethodsConfiguration: {
          card: {
            hasHolderName: true,
            holderNameRequired: true,
            enableStoreDetails: this.showStored,
            showStoredPaymentMethods: this.showStored,
            name: "Credit or debit card",
            brands: Object.keys(this.cardMaps),
          }
        },
        /*
        onSelect(state, dropin) {
          state.props.hasCVC = !state.props.storedPaymentMethodId
        },

        onSubmit: async (state, dropin) => {
          try {

            if (!!state.data.paymentMethod.storedPaymentMethodId) {
              const cards = self.$store.getters["payment-adyen/cards"]
              const card = cards.find(
                (card) =>
                  card.id === state.data.paymentMethod.storedPaymentMethodId
              )
              if (card) {
                self.$store.dispatch(
                  "payment-adyen/setPublicHash",
                  card.public_hash
                )
                this.$emit("providedAdyenData")
              } else {
                self.$store.dispatch(
                  "payment-adyen/setPublicHash",
                  null
                )
                self.$store.dispatch("notification/spawnNotification", {
                  type: "error",
                  message: i18n.t("Bad data provided for the card"),
                  action1: { label: i18n.t("OK") },
                })
              }
              return
            } else {
              self.$store.dispatch(
                "payment-adyen/setPublicHash",
                null
              )
            }

            this.$store.dispatch("payment-adyen/setCardData", {
              method: state.data.paymentMethod.type,
              additional_data: {
                ...state.data.paymentMethod,
                ...(state.data.storePaymentMethod
                ? { storePaymentMethod: state.data.storePaymentMethod }
                : {})
              },
              browserInfo: {
                ...collectBrowserInfo(),
                language: this.storeView.i18n.defaultLocale,
                origin: window.location.origin,
              }
            })

            this.$emit("providedAdyenData")
          } catch (err) {
            console.error(err, "Adyen")
          }
        }
        */
      }
      this.adyenCheckoutInstance = new AdyenCheckout(configuration)
      this.dropin = this.adyenCheckoutInstance
        .create('dropin')
        .mount(this.$refs['adyen-payments-dropin'])
    }
  }
}
</script>
<style lang="scss" src="./AdyenPayments.scss" />
