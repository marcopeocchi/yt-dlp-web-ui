<script lang="ts">
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import * as O from 'fp-ts/Option';
  import { pipe } from 'fp-ts/lib/function';
  import { onDestroy } from 'svelte';
  import DownloadCard from './lib/DownloadCard.svelte';
  import FloatingAction from './lib/FloatingAction.svelte';
  import Footer from './lib/Footer.svelte';
  import Navbar from './lib/Navbar.svelte';
  import Spinner from './lib/Spinner.svelte';
  import { downloads, rpcClient } from './lib/store';
  import { datetimeCompareFunc, isRPCResponse } from './lib/utils';

  const unsubscribe = rpcClient.subscribe(($client) => {
    setInterval(() => $client.running(), 750);

    $client.socket.onmessage = (ev: any) => {
      const event = JSON.parse(ev.data);
      // guards
      if (!isRPCResponse(event)) {
        return;
      }
      if (!Array.isArray(event.result)) {
        return;
      }

      if (event.result) {
        return downloads.set(
          O.of(
            event.result
              .filter((f) => !!f.info.url)
              .sort((a, b) =>
                datetimeCompareFunc(b.info.created_at, a.info.created_at),
              ),
          ),
        );
      }

      downloads.set(O.none);
    };
  });

  onDestroy(unsubscribe);
</script>

<main
  class="bg-neutral-50 dark:bg-neutral-900 h-screen text-neutral-950 dark:text-neutral-50"
>
  <Navbar />
  {#if O.isNone($downloads)}
    <div class="h-[90vh] w-full flex justify-center items-center">
      <Spinner />
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 p-8">
      {#each pipe( $downloads, O.getOrElseW(() => []), ) as download}
        <DownloadCard {download} />
      {/each}
    </div>
  {/if}
  <FloatingAction />
  <Footer />
  <SvelteToast />
</main>
