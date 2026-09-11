<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  titleTemplate: '%s | M2Oath Developer',
  description: 'Build and register M2Oath agents.'
})
</script>

<template>
  <UApp>
    <UHeader class="[--ui-header-height:6rem]">
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-3 font-semibold"
        >
          <img
            src="/brand/m2oath-logo-light.png"
            alt="M2Oath"
            class="h-24 w-auto dark:hidden"
          >

          <img
            src="/brand/m2oath-logo-dark.png"
            alt="M2Oath"
            class="hidden h-24 w-auto dark:block"
          >

          <span>
            M2Oath Developer
          </span>
        </NuxtLink>
      </template>

      <template #right>
        <UButton
          to="/agents/new"
          label="Register Agent"
          variant="ghost"
        />

        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
