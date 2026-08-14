"use client";

import { useEffect, useRef, useState } from "react";

import { MapPin, Search } from "lucide-react";

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { type AdresseSuggestion, searchAdresse } from "@/lib/api/geocodage";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

function emptyStateLabel(loading: boolean, error: boolean): string {
  if (loading) return "Recherche…";
  if (error) return "Recherche d'adresse indisponible.";
  return "Aucune adresse trouvée.";
}

export interface AdresseSearchBoxProps {
  id?: string;
  value: string;
  /** Fires on every keystroke — the raw text the user typed. */
  onInputChange: (value: string) => void;
  /** Fires when a suggestion is picked from the dropdown. */
  onSelect: (suggestion: AdresseSuggestion) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/** Address autocomplete backed by the official French geocoding service (IGN Géoplateforme / BAN). */
export function AdresseSearchBox({
  id,
  value,
  onInputChange,
  onSelect,
  onBlur,
  placeholder,
  disabled,
  className,
}: AdresseSearchBoxProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AdresseSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  function scheduleSearch(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setOpen(true);
    setLoading(true);
    setError(false);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const results = await searchAdresse(query, { signal: controller.signal });
        setSuggestions(results);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onInputChange(e.target.value);
    scheduleSearch(e.target.value);
  }

  function handleSelect(suggestion: AdresseSuggestion) {
    setOpen(false);
    setSuggestions([]);
    onSelect(suggestion);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative flex items-center", className)}>
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <Input
            id={id}
            className="pl-8"
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onBlur={onBlur}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        asChild
        align="start"
        sideOffset={5}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command className="rounded-lg border shadow-md" shouldFilter={false}>
          <CommandList className="max-h-64 overflow-auto">
            <CommandEmpty className="py-3 text-center text-muted-foreground text-sm">
              {emptyStateLabel(loading, error)}
            </CommandEmpty>
            <CommandGroup>
              {suggestions.map((s) => (
                <CommandItem
                  key={s.label}
                  value={s.label}
                  onSelect={() => handleSelect(s)}
                  className="items-start gap-2"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{s.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
