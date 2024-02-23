<script lang="ts">
  import { ChevronDown, ChevronUp } from 'lucide-svelte';
  import { cubicOut } from 'svelte/easing';
  import { tweened } from 'svelte/motion';
  import NewDownload from './NewDownload.svelte';

  const height = tweened(52, {
    duration: 300,
    easing: cubicOut,
  });

  const minHeight = 52;
  const maxHeight = window.innerHeight / 1.5;

  let open = false;
  $: open = $height > minHeight;
</script>

<footer
  class="
  fixed bottom-0 z-10
  w-full
  p-2
  bg-neutral-100 dark:bg-neutral-800
  border-t dark:border-t-neutral-700
  shadow-lg
  rounded-t-xl"
  style="min-height: {$height}px;"
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
    </div>
  {/if}
</footer>
