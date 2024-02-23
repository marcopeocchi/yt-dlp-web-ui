<script lang="ts">
  export let text: string;
</script>

<div
  class="flex items-center gap-1.5 p-1 bg-blue-200 rounded-lg text-neutral-900"
>
  <slot />
  {text}
</div>
