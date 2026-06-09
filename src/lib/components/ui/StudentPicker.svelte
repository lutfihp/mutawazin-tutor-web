<script lang="ts">
  import { avatarColor, initials } from '$lib/utils/avatar';

  type Student = { id: string; full_name: string | null; username: string | null };

  let {
    students,
    value = $bindable([]),
    max,
  }: {
    students: Student[];
    value: string[];
    max?: number;
  } = $props();

  let query = $state('');
  let open = $state(false);

  const filtered = $derived(
    query.length === 0
      ? []
      : students
          .filter((s) => !value.includes(s.id))
          .filter((s) => {
            const name = (s.full_name ?? s.username ?? '').toLowerCase();
            return name.includes(query.toLowerCase());
          })
          .slice(0, 6)
  );

  const selected = $derived(
    value.map(
      (id) => students.find((s) => s.id === id) ?? { id, full_name: null, username: id }
    )
  );

  function displayName(s: Student): string {
    return s.full_name ?? s.username ?? s.id;
  }

  function add(student: Student) {
    value = [...value, student.id];
    query = '';
    open = false;
  }

  function remove(id: string) {
    value = value.filter((v) => v !== id);
  }
</script>

<div class="relative flex flex-col gap-2">
  <div class="relative">
    {#if max === undefined || value.length < max}
      <input
        type="text"
        bind:value={query}
        oninput={() => { open = query.length > 0; }}
        onblur={() => { setTimeout(() => { open = false; }, 150); }}
        placeholder="Type name to search..."
        class="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    {:else}
      <p class="text-xs text-text2 py-1">Private session — 1 student only</p>
    {/if}
    {#if open && filtered.length > 0}
      <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-sm shadow-md z-20 max-h-48 overflow-y-auto">
        {#each filtered as student}
          <button
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bgGray text-left"
            onmousedown={() => add(student)}
          >
            <span
              class="w-7 h-7 rounded-pill flex items-center justify-center text-white text-xs flex-shrink-0"
              style="background-color: {avatarColor(student.id)}"
            >
              {initials(displayName(student))}
            </span>
            {displayName(student)}
          </button>
        {/each}
        <div class="px-3 py-1.5 text-xs text-text2 bg-bgGray border-t border-border">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
        </div>
      </div>
    {/if}
  </div>

  {#if selected.length > 0}
    <div class="flex flex-wrap gap-1.5">
      {#each selected as student}
        <span class="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-pill px-2.5 py-1 text-xs">
          <span
            class="w-5 h-5 rounded-pill flex items-center justify-center text-white text-[9px] flex-shrink-0"
            style="background-color: {avatarColor(student.id)}"
          >
            {initials(displayName(student))}
          </span>
          <span class="text-primary font-medium">{displayName(student)}</span>
          <button
            type="button"
            onclick={() => remove(student.id)}
            class="text-primary/50 hover:text-primary ml-0.5 leading-none"
            aria-label="Remove {displayName(student)}"
          >×</button>
        </span>
      {/each}
    </div>
  {/if}
</div>
