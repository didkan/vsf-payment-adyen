import config from 'config'

export default {
    async mounted() {
        if (!document.getElementById('adyen-secured-fields')) {
          if (typeof window !== 'undefined') {
            try {
              const dropInScriptUrl = 'https://checkoutshopper-%ENV%.adyen.com/checkoutshopper/sdk/3.3.0/adyen.js'
              const scriptUrl = dropInScriptUrl.replace('%ENV%', config.adyen.environment)
              await this.loadScript(scriptUrl);

              this.createForm()

            } catch (err) {
              console.info(err, "Couldnt fetch adyen's library");
            }
          }
        } else {
          this.createForm();
        }
      },

    methods: {
        /**
         * @description - Dynamicly fetches AdyenCheckout SDK
         */
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

        hasStoredCards() {
          const storedPaymentMethods = this.$store.getters["payment-adyen/cards"];
          return this.$store.getters["user/isLoggedIn"] &&
            storedPaymentMethods &&
            !!storedPaymentMethods.length
        }
    }
}
