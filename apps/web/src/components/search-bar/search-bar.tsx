import { component$, type Signal } from "@builder.io/qwik";

export interface SearchBarProps {
  placeholder?: string;
  value: Signal<string>;
}

/** Debounced server-side search — see `routes/index.tsx`'s call to `/api/search`. */
export const SearchBar = component$<SearchBarProps>(({ placeholder, value }) => {
  return (
    <div class="flex justify-center mb-8">
      <input
        class="input input-lg focus:input-primary w-full max-w-xl"
        type="search"
        placeholder={placeholder ?? "Search for an app…"}
        aria-label="Search for an app"
        value={value.value}
        onInput$={(_, el) => {
          value.value = el.value;
        }}
      />
    </div>
  );
});
