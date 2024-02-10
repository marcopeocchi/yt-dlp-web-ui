<script lang="ts">
  import type { DLFormat } from './types';

  let group = '';
  export let formats: DLFormat[];

  $: console.log(group);
</script>

<div class="w-full mt-4">
  <div class="mx-auto w-full">
    <fieldset class="grid grid-cols-7 gap-2">
      {#each formats as format}
        <div class="relative">
          <input
            id="formats"
            class="absolute opacity-0 w-0 h-0 peer"
            type="radio"
            bind:group
            name="type"
            value="formats"
          />
          <label
            for="formats"
            class="
            [&_p]:text-gray-900 [&_span]:text-gray-500
            peer-checked:[&_p]:text-white peer-checked:[&_span]:text-orange-100
            peer-focus:ring-2 peer-focus:ring-white
            peer-focus:ring-opacity-60 peer-focus:ring-offset-2 peer-focus:ring-offset-orange-300
            bg-white
            relative flex
            cursor-pointer
            rounded-lg px-5 py-4
            shadow-md
            focus:outline-none
            peer-checked:bg-orange-700/75
            peer-checked:text-white"
          >
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center">
                <div class="text-sm">
                  <p class="font-medium" id={format.format_id}>
                    {format.resolution}
                  </p>
                  <span class="inline" id={format.format_id}>
                    <span>{format.vcodec}</span>
                    <span aria-hidden="true">·</span>
                    <span>{format.acodec}</span>
                  </span>
                </div>
              </div>
              <div class="shrink-0 text-white">
                <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                  <circle cx="12" cy="12" r="12" fill="#fff" opacity="0.2" />
                  <path
                    d="M7 13l3 3 7-7"
                    stroke="#fff"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
          </label>
        </div>
      {/each}
    </fieldset>
  </div>
</div>
