"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";

interface TimetableSelectOption {
  value: string;
  label: string;
}

interface TimetableSelectProps {
  ariaLabel?: string;
  disabled?: boolean;
  id?: string;
  onChange: (value: string) => void;
  options: readonly TimetableSelectOption[];
  placeholder?: string;
  value: string;
}

export function TimetableSelect({
  ariaLabel,
  disabled = false,
  id,
  onChange,
  options,
  placeholder = "선택",
  value
}: TimetableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function closeOnOutsidePointer(event: globalThis.PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((current) => !current);
    }
  }

  return (
    <div className={`timetable-select${isOpen ? " open" : ""}${disabled ? " disabled" : ""}`} ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="timetable-select-button"
        disabled={disabled}
        id={id}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span>{selectedOption?.label ?? placeholder}</span>
      </button>
      {isOpen && !disabled ? (
        <div className="timetable-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className="timetable-select-option"
              key={option.value}
              onClick={() => selectValue(option.value)}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
