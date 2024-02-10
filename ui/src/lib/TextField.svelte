<script lang="ts">
  let clazz: string = '';
  export let label: string;
  export let value: any;

  export let disabled: boolean = false;
  export let placeholder: string = '';
  export { clazz as class };
</script>

<div class="flex flex-col gap-0.5 text-sm font-semibold">
  <label for=""> {label} </label>
  <input
    type="text"
    class={`p-2 bg-neutral-50 border rounded-lg focus:outline-orange-300 ${clazz}`}
    on:keyup
    bind:value
    {placeholder}
    {disabled}
  />
</div>
