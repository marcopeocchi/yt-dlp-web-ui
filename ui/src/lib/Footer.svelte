<script lang="ts">
  import { ChevronUp, ChevronDown } from 'lucide-svelte';
  import { cubicOut } from 'svelte/easing';
  import { tweened } from 'svelte/motion';
  import Settings from './Settings.svelte';
  import NewDownload from './NewDownload.svelte';

  const height = tweened(52, {
    duration: 300,
    easing: cubicOut,
  });

  const minHeight = 52;
  const maxHeight = 600;

  let open = false;
  $: open = $height > minHeight;
</script>

<footer
  class="
  absolute bottom-0
  w-full
  p-2
  bg-neutral-100 dark:bg-neutral-800
  border-t dark:border-t-neutral-700
  shadow-lg
  rounded-t-xl"
  style="height: {$height}px;"
>
  <button
    class="p-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg border dark:border-neutral-700"
    on:click={() => (open ? height.set(minHeight) : height.set(maxHeight))}
  >
    {#if open}
      <ChevronDown />
    {:else}
      <ChevronUp />
    {/if}
  </button>

  <div />

  {#if $height > 100}
    <div class="mt-2">
      <NewDownload />
      <Settings />
    </div>
  {/if}
</footer>
