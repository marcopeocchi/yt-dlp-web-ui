<script lang="ts">
  import { ArrowDownUp, HardDrive, Network } from 'lucide-svelte';
  import { downloads, rpcClient, serverApiEndpoint } from './store';
  import { formatGiB, formatSpeedMiB } from './utils';
  import * as O from 'fp-ts/Option';
  import { pipe } from 'fp-ts/lib/function';
  import { onDestroy } from 'svelte';

  let downloadSpeed = 0;

  const unsubscribe = downloads.subscribe((downloads) =>
    pipe(
      downloads,
      O.matchW(
        () => (downloadSpeed = 0),
        (d) =>
          (downloadSpeed = d
            .map((d) => d.progress.speed)
            .reduce((a, b) => a + b)),
      ),
    ),
  );

  onDestroy(unsubscribe);
</script>

<nav
  class="
  p-4
  flex justify-between items-center
  bg-neutral-100 dark:bg-neutral-800
  rounded-b-xl
  border-b dark:border-b-neutral-700
  shadow-lg
  select-none"
>
  <div class="font-semibold text-lg">yt-dlp WebUI</div>

  <div />

  <div class="flex items-center gap-2 text-sm">
    <div
      class="flex items-center gap-1.5 p-1 text-neutral-900 bg-orange-200 rounded-lg"
    >
      <ArrowDownUp size={18} />
      <div>
        {formatSpeedMiB(downloadSpeed)}
      </div>
    </div>

    <div class="flex items-center gap-2 text-sm">
      <div
        class="flex items-center gap-1.5 p-1 text-neutral-900 bg-orange-200 rounded-lg"
      >
        <HardDrive size={18} />
        <div>
          {#await $rpcClient.freeSpace()}
            Loading...
          {:then freeSpace}
            {formatGiB(freeSpace.result)}
          {/await}
        </div>
      </div>

      <div
        class="flex items-center gap-1.5 p-1 text-neutral-900 bg-orange-200 rounded-lg"
      >
        <Network size={18} />
        <div>
          {$serverApiEndpoint.split('//')[1]}
        </div>
      </div>
    </div>
  </div>
</nav>
