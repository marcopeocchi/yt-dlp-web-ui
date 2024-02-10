<script lang="ts">
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import Footer from './lib/Footer.svelte';
  import Home from './lib/Home.svelte';
  import Navbar from './lib/Navbar.svelte';
</script>

<main
  class="bg-neutral-50 dark:bg-neutral-900 h-screen text-neutral-950 dark:text-neutral-50"
>
  <Navbar />
  <Home />
  <Footer />
  <SvelteToast />
  <!-- <FloatingAction /> -->
</main>
