<script lang="ts">
  let clazz: string = '';
  export let disabled: boolean = false;
  export { clazz as class };
</script>

<button
  class={`px-2.5 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 hover:duration-150 text-sm font-semibold ${
    disabled && 'bg-neutral-300 hover:bg-neutral-300'
  } ${clazz}`}
  {disabled}
  on:click
>
  <slot />
</button>
