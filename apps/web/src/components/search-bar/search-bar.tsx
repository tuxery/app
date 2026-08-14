import { component$ } from "@builder.io/qwik";

export interface SearchBarProps {
  placeholder?: string;
}

/**
 * Stub search input — not wired to `tuxery/catalog`'s dataset yet. Real
 * search is tracked on the Tuxery GitHub Project ("Homepage search UI").
 */
export const SearchBar = component$<SearchBarProps>(({ placeholder }) => {
  return (
    <div class="flex justify-center mb-8">
      <input
        class="input input-lg focus:input-primary w-full max-w-xl"
        type="search"
        placeholder={placeholder ?? "Search for an app…"}
        aria-label="Search for an app"
      />
    </div>
  );
});
