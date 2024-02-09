<script lang="ts">
  let clazz: string = '';
  export let label: string;
  export let value: any;

  export let disabled: boolean = false;
  export { clazz as class };
</script>

<div class="flex flex-col gap-0.5 text-sm">
  <label for=""> {label} </label>
  <input
    type="text"
    class={`p-2 bg-neutral-50 border rounded-lg ${clazz}`}
    on:keyup
    bind:value
    {disabled}
  />
</div>
