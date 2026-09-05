<script setup>
import { useSlideContext } from '@slidev/client/context.ts'

// A slide layer, not a global one: `slide-top.vue` is rendered inside each
// slide's wrapper and after the slide's own content, so it sits above the
// layout's background and is present in the exported PDF as well as in the
// browser. A `global-*.vue` layer would render once, outside any slide, with
// no page number in scope.
const { $page, $nav } = useSlideContext()
</script>

<template>
  <!-- The cover is page 1 and carries its own bottom-right note. -->
  <div v-if="$page > 1" class="slide-no" aria-hidden="true">
    {{ $page }} / {{ $nav.total }}
  </div>
</template>

<style scoped>
.slide-no {
  position: absolute;
  right: 0.9rem;
  bottom: 0.6rem;
  z-index: 10;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
}
</style>
