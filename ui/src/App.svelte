<script lang="ts">
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import Router from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';
  import Footer from './lib/Footer.svelte';
  import Home from './views/Home.svelte';
  import Navbar from './lib/Navbar.svelte';

  const routes = {
    '/': Home,
    '/settings': wrap({
      asyncComponent: () => import('./views/SettingsView.svelte'),
    }),
  };
</script>

<main
  class="bg-neutral-50 dark:bg-neutral-900 h-screen text-neutral-950 dark:text-neutral-50"
>
  <Navbar />
  <Router {routes} />
  <Footer />
  <SvelteToast />
  <!-- <FloatingAction /> -->
</main>
