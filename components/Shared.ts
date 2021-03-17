import config from 'config'
import AdyenCheckout from '@adyen/adyen-web'

export default {
    async mounted() {
      /*
      if (!document.getElementById('adyen-secured-fields')) {
        if (typeof window !== 'undefined') {
          try {
            const sdkVersion = config.adyen.sdkVersion || (config.adyen.clientKey ? '4.1.0' : '3.23.0')
            const scriptUrl = `https://checkoutshopper-${config.adyen.environment}.adyen.com/checkoutshopper/sdk/${sdkVersion}/adyen.js`
            await this.loadScript(scriptUrl);

            this.createForm()

          } catch (err) {
            console.info(err, "Couldnt fetch adyen's library");
          }
        }
      } else {
        this.createForm();
      }
      */
      this.createForm()
    },
    methods: {
        /**
         * @description - Dynamicly fetches AdyenCheckout SDK
         */
        /*
        loadScript(src) {
            return new Promise((resolve, reject) => {
                let script = document.createElement("script");
                script.setAttribute("id", "adyen-secured-fields");
                script.src = src;
                script.onload = () => resolve(script);
                script.onerror = () => reject(new Error("Script load error: " + src));
                document.head.append(script);
            });
        },
        */

        hasStoredCards() {
          const storedPaymentMethods = this.$store.getters["payment-adyen/cards"];
          return this.$store.getters["user/isLoggedIn"] &&
            storedPaymentMethods &&
            !!storedPaymentMethods.length
        }
    }
}
