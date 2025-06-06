"use client";

import { InputHTMLAttributes, useEffect, useState } from "react";

type Props = {
  value?: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
} & InputHTMLAttributes<HTMLInputElement>;

export default function DebouncedInput({
  value = "",
  onDebouncedChange,
  debounceMs = 300,
  onChange,
  ...rest
}: Props) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onDebouncedChange(localValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onDebouncedChange]);

  return (
    <input
      {...rest}
      value={localValue}
      onChange={(e) => {
        console.log("Debounced onchange...");
        setLocalValue(e.target.value);
        onChange?.(e);
      }}
    />
  );
}
