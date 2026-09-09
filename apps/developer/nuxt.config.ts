// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    controlPlaneBaseUrl: 'http://127.0.0.1:4000',

    /**
     * OpenID Connect configuration for the authenticated Developer
     * experience.
     *
     * These values remain server-only. OIDC establishes who the
     * Developer is; M2Oath remains authoritative for lifecycle
     * authorization such as agent.create.
     */
    oauth: {
      auth0: {
        clientId: '',
        clientSecret: '',
        domain: ''
      }
    },

    /**
     * Server-only Developer credential used when calling protected
     * control-plane lifecycle endpoints.
     *
     * Nuxt exposes runtimeConfig values only when placed under
     * `public`. This value intentionally remains private.
     *
     * Development deployment can override this with:
     * NUXT_DEVELOPER_TOKEN
     */
    developerToken: ''
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
