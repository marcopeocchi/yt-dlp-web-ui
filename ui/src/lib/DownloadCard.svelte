<script lang="ts">
  import { get } from 'svelte/store';
  import Chip from './Chip.svelte';
  import type { RPCResult } from './types';
  import { formatSpeedMiB, mapProcessStatus, roundMiB } from './utils';
  import { rpcClient } from './store';
  import Button from './Button.svelte';

  export let download: RPCResult;

  const remove = (id: string) => get(rpcClient).kill(id);
</script>

<div
  class="flex gap-4
  bg-neutral-100 dark:bg-neutral-800
  pt-2 md:p-4
  rounded-lg shadow-lg
  border dark:border-neutral-700"
>
  <div
    class="h-full w-96 bg-cover bg-center rounded"
    style="background-image: url({download.info.thumbnail})"
  />

  <div class="flex flex-col justify-between gap-2 w-full">
    <div>
      <h2 class="font-bold text-lg">{download.info.title}</h2>
      <p
        class="font-mono text-sm mt-2 p-1 break-all bg-neutral-200 dark:bg-neutral-700 rounded"
      >
        {download.info.url}
      </p>
    </div>

    <div class="flex flex-col justify-end gap-2 select-none flex-wrap">
      <div class="flex items-center gap-2 text-sm">
        {#if download.info.vcodec}
          <Chip text={download.info.vcodec} />
        {/if}
        {#if download.info.acodec}
          <Chip text={download.info.acodec} />
        {/if}
        {#if download.info.ext}
          <Chip text={download.info.ext} />
        {/if}
        {#if download.info.resolution}
          <Chip text={download.info.resolution} />
        {/if}
        {#if download.info.filesize_approx}
          <Chip text={roundMiB(download.info.filesize_approx)} />
        {/if}
        {#if download.progress.process_status}
          <Chip text={mapProcessStatus(download.progress.process_status)} />
        {/if}
        {#if download.progress.speed}
          <Chip text={formatSpeedMiB(download.progress.speed)} />
        {/if}
      </div>

      <div class="flex gap-2">
        <Button class="w-14" on:click={() => remove(download.id)}>Stop</Button>
        {#if download.progress.process_status === 2}
          <Button class="w-18">Download</Button>
        {/if}
      </div>

      <div
        class="w-full mt-4 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700"
      >
        <div
          class={`h-2 rounded-full ${
            download.progress.process_status === 2
              ? 'bg-green-600'
              : 'bg-orange-500'
          }`}
          style="width: {download.progress.percentage}"
        />
      </div>
    </div>
  </div>
</div>
