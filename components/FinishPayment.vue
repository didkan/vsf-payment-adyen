<template>
  <div>
    <div id="redirectTo3ds1"></div>
    <div id="threeDS2Container"></div>
    <transition name="fade">
      <div class="threeds-challenge" v-show="threedsChallenge">
        <div class="threeds-challenge__inner" id="threeDS2Challenge"></div>
      </div>
    </transition>
  </div>
</template>

<script>
import config from 'config'
import i18n from '@vue-storefront/i18n';
import { currentStoreView } from '@vue-storefront/core/lib/multistore';
import Shared from './Shared'
import AdyenCheckout from '@adyen/adyen-web'

export default {
  name: 'FinishPayment',

  mixins: [Shared],

  props: {
    callback: {
      type: Function,
      default: () => {}
    }
  },

  data () {
    return {
      adyenCheckoutInstance: null,
      threeDS2IdentifyComponent: null,
      threeDS2ChallengeComponent: null,
      threedsChallenge: false
    }
  },

  computed: {
    adyenCard () {
      return this.$store.state['payment-adyen'].adyenCard
    }
  },

  methods: {
    async createForm () {
      const { originKeys, environment } = this.$store.state.config.adyen;
      const origin = window.location.origin;
      if (!originKeys[origin]) {
        console.error('[Adyen] Set origin key in the config!');
      }

      const configuration = {
        locale: 'en-US',
        environment: environment,
        originKey: originKeys[origin],
        paymentMethodsResponse: {
          // There I am setting payment methods
          // For now only scheme === adyen_cc
          paymentMethods: this.$store.getters['payment-adyen/methods'].filter(
            method => method.type === 'scheme'
          ),
          ...(
            this.hasStoredCards()
            ? { storedPaymentMethods: this.$store.getters['payment-adyen/cards'] }
            : {}
          )
        }
      };
      this.adyenCheckoutInstance = new AdyenCheckout(configuration);
      this.initPayment()
    },

    async initPayment () {
      try {
        const result = this.$store.state['payment-adyen'].three3ds2Details

        // If it requires 3DS Auth
        if (result.type) {
          const { type } = result;

          switch (type) {
            case 'IdentifyShopper':
              this.renderThreeDS2DeviceFingerprint(result.token);
              break;
            case 'ChallengeShopper':
              this.renderThreeDS2Challenge(result.token);
              break;
            // case 'RedirectShopper':
            //   const self = this
            //   const { storeCode } = currentStoreView()
            //   const testsmth = this.adyenCheckoutInstance.createFromAction({
            //     ...result.action,
            //     data: {
            //       ...result.action.data,
            //       'TermUrl': `${config.server.baseUrl.endsWith('/') ? config.server.baseUrl : (config.server.baseUrl + '/')}${storeCode}/finalize-3ds1`
            //     }
            //   }).mount('#redirectTo3ds1')
            //   break;
            default:
              this.$store.dispatch('notification/spawnNotification', {
                type: 'error',
                message: i18n.t(
                  'Unsupported authentication method: ' + type
                ),
                action1: { label: i18n.t('OK') }
              });
              break;
          }
        } else if (result.errorMessage) {
          this.$store.dispatch('notification/spawnNotification', {
            type: 'error',
            message: result.errorMessage,
            action1: { label: i18n.t('OK') }
          });
        }
      } catch (err) {
        console.error(err, 'Adyen');
      }
    },

    renderThreeDS2DeviceFingerprint(token) {
      const self = this

      this.threeDS2IdentifyComponent = this.adyenCheckoutInstance.create(
        'threeDS2DeviceFingerprint',
        {
          fingerprintToken: token,
          async onComplete({ data }) {
            // It sends request to /adyen/threeDS2Process
            if (!data || !data.details || !data.details['threeds2.fingerprint']) {
              self.$store.dispatch('notification/spawnNotification', {
                type: 'error',
                message: i18n.t('Could not verify card data, sorry...'),
                action1: { label: i18n.t('OK') }
              });
              return;
            }
            let response = await self.$store.dispatch(
              'payment-adyen/fingerprint3ds',
              {
                fingerprint: data && data.details && data.details['threeds2.fingerprint'],
                orderId: self.$store.state['payment-adyen'].three3ds2Details.orderId
              }
            );

            if (response.threeDS2) {
              // ChallengeShopper
              self.renderThreeDS2Challenge(response.token)
            } else if (response.errorMessage) {
              self.$store.dispatch('notification/spawnNotification', {
                type: 'error',
                message: response.errorMessage,
                action1: { label: i18n.t('OK') }
              });
            } else {
              // self.$emit('payed', self.payloadToSend);
              self.callback()
            }
          },
          onError(error) {
            console.log('Error', error);
          }
        }
      );
      this.threeDS2IdentifyComponent.mount('#threeDS2Container');
    },

    renderThreeDS2Challenge(token) {
      // Open fullscreen modal
      this.threedsChallenge = true;

      // Create Challenge component
      const self = this
      this.threeDS2ChallengeComponent = this.adyenCheckoutInstance.create(
        'threeDS2Challenge',
        {
          challengeToken: token,
          // We have a few sizes, 05 is full 100% width 100% height
          // Other ones have certain sizes
          size: '05',
          async onComplete({ data }) {
            if (
              data &&
              data.details &&
              data.details['threeds2.challengeResult']
            ) {
              let challengeResponse = await self.$store.dispatch(
                'payment-adyen/fingerprint3ds',
                {
                  fingerprint: data.details['threeds2.challengeResult'],
                  orderId: self.$store.state['payment-adyen'].three3ds2Details.orderId,
                  challenge: true,
                  noPaymentData: true
                }
              );

              self.threedsChallenge = false;
              self.callback()
              self.$store.dispatch('payment-adyen/setShowFinishPayment', false)
            } else {
              self.$store.dispatch('notification/spawnNotification', {
                type: 'error',
                message: i18n.t('Challenge authentication failed'),
                action1: { label: i18n.t('OK') }
              });
            }
          },
          onError(error) {
            console.log('error', error);
            self.$store.dispatch('payment-adyen/setShowFinishPayment', false)
          }
        }
      );
      self.threeDS2ChallengeComponent.mount('#threeDS2Challenge');
    }

  }
}
</script>

<style lang="scss" scoped>
  #threeDS2Container {
    padding: 12px 0;
  }
</style>
