import { component$, type Signal } from "@builder.io/qwik";
import { LuSearch } from "@qwikest/icons/lucide";

export interface SearchBarProps {
  placeholder?: string;
  value: Signal<string>;
}

/** Debounced server-side search — see `routes/index.tsx`'s call to `/api/search`. */
export const SearchBar = component$<SearchBarProps>(({ placeholder, value }) => {
  return (
    <label class="input input-lg focus-within:input-primary w-full max-w-xl mx-auto mb-8 flex items-center gap-2">
      <LuSearch class="text-base-content/50 text-lg" />
      <input
        class="grow"
        type="search"
        placeholder={placeholder ?? "Search for an app…"}
        aria-label="Search for an app"
        value={value.value}
        onInput$={(_, el) => {
          value.value = el.value;
        }}
      />
    </label>
  );
});
