<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocale } from '@/composables/useLocale';
import type { SupportedLocale } from '@/i18n';

// Mirrors the settings-page switcher via the shared useLocale source, so both stay in sync.
const { t } = useI18n();
const {
  currentLocale, availableLocales, setLocale 
} = useLocale();

const currentLocaleLabel = computed(() => currentLocale.value.toUpperCase());

const changeLanguage = (locale: SupportedLocale) => {
  setLocale(locale);
};
</script>

<template>
  <q-btn-dropdown size="1.8rem"
                  flat
                  round
                  :aria-label="t('common.language')"
                  class="language-switcher">
    <template v-slot:label>
      <span class="language-switcher__icon-wrap">
        <q-icon name="language" />
        <q-badge rounded
                 color="accent"
                 text-color="white"
                 class="language-switcher__badge">
          {{ currentLocaleLabel }}
        </q-badge>
      </span>
    </template>
    <q-list>
      <q-item
        v-for="locale in availableLocales"
        :key="locale"
        clickable
        v-close-popup
        :active="locale === currentLocale"
        @click="changeLanguage(locale)"
      >
        <q-item-section>{{ t(`language.${locale}`) }}</q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<style lang="css" scoped>
.language-switcher__icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.language-switcher__badge {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 2px 3px;
  line-height: 1;
}

/* The current language is the badge, so the dropdown chevron is redundant here. */
:deep(.q-btn-dropdown__arrow) {
  display: none;
}
</style>
