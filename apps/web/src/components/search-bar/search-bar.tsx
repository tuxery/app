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
    <div class="tuxery-search">
      <input
        class="tuxery-search-input"
        type="search"
        placeholder={placeholder ?? "Search for an app…"}
        aria-label="Search for an app"
      />
    </div>
  );
});
