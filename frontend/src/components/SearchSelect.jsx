import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiSearch } from 'react-icons/fi';

/**
 * Autocomplete input backed by a server search.
 * - Debounced queries, stale responses ignored
 * - Keyboard: ArrowUp/ArrowDown, Enter to select, Escape to close
 * - Optional "create new" row when nothing suitable is found
 */
const SearchSelect = ({
  value,
  onChange,
  fetchOptions,
  onSelect,
  renderOption,
  getKey = (option) => option.id,
  placeholder,
  createLabel,
  onCreate,
  minChars = 1,
  autoFocus = false,
  invalid = false,
}) => {
  const [open, setOpen] = useState(false);
  // Results are kept with the query they belong to, so stale results are never shown or selectable
  const [result, setResult] = useState({ query: null, options: [] });
  const [highlight, setHighlight] = useState(0);
  const requestId = useRef(0);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState(null);
  const fetchRef = useRef(fetchOptions);
  useEffect(() => {
    fetchRef.current = fetchOptions;
  });

  const query = value.trim();
  const loading = result.query !== query;
  const options = loading ? [] : result.options;
  const canCreate = Boolean(onCreate) && query.length >= minChars && !loading;
  const rowCount = options.length + (canCreate ? 1 : 0);

  useEffect(() => {
    // Invalidate any in-flight request; the dropdown is hidden for short queries
    const id = ++requestId.current;
    if (!open || query.length < minChars) return undefined;

    const timer = setTimeout(async () => {
      let options = [];
      try {
        options = (await fetchRef.current(query)) || [];
      } catch {
        options = [];
      }
      if (id === requestId.current) {
        setResult({ query, options });
        setHighlight(0);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open, minChars]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current?.contains(event.target) || dropdownRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const choose = (index) => {
    if (index < options.length) onSelect(options[index]);
    else if (canCreate) onCreate(query);
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!open || rowCount === 0) {
      if (event.key === 'ArrowDown') setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => (h + 1) % rowCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => (h - 1 + rowCount) % rowCount);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(Math.min(highlight, rowCount - 1));
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && query.length >= minChars;

  // The dropdown is portaled to <body> so scroll containers (tables, modals) cannot clip it
  useLayoutEffect(() => {
    if (!showDropdown) return undefined;
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showDropdown]);

  return (
    <div className="relative" ref={containerRef}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${invalid ? 'border-red-400' : 'border-gray-300'}`}
      />
      {showDropdown && position && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: position.top, left: position.left, width: position.width }}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[100] max-h-72 overflow-y-auto min-w-[18rem]"
        >
          {loading && <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>}
          {!loading && options.length === 0 && !canCreate && (
            <p className="px-4 py-3 text-sm text-gray-500">No matches found</p>
          )}
          {!loading && options.map((option, index) => (
            <button
              type="button"
              key={getKey(option)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(index)}
              onMouseEnter={() => setHighlight(index)}
              className={`w-full px-4 py-2.5 text-left border-b last:border-b-0 ${highlight === index ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              {renderOption(option)}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(options.length)}
              onMouseEnter={() => setHighlight(options.length)}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium text-gray-900 flex items-center gap-2 ${highlight === options.length ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <FiPlus className="w-4 h-4" />
              {createLabel ? createLabel(query) : `Add "${query}"`}
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default SearchSelect;
