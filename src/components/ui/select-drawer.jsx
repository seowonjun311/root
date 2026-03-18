import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function SelectDrawerTrigger({ value, label, children, ...props }) {
  return (
    <button
      {...props}
      className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-left flex items-center justify-between focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="text-muted-foreground">{label || 'Select...'}</span>
      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  );
}

export default function SelectDrawer({ open, onOpenChange, value, onValueChange, label, options = [] }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{label}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-2 max-h-[60vh] overflow-y-auto pb-4">
          {options.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            const isSelected = value === optionValue;

            return (
              <button
                key={optionValue}
                onClick={() => {
                  onValueChange(optionValue);
                  onOpenChange(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-amber-600 bg-amber-100/80'
                    : 'border-border bg-card hover:border-amber-400/50'
                }`}
                aria-label={`Select ${optionLabel}`}
                aria-selected={isSelected}
              >
                <span className="font-medium text-sm">{optionLabel}</span>
                {isSelected && <Check className="w-5 h-5 text-amber-700" />}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}