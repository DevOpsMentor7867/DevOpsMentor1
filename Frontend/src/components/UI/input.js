import React from 'react';

export function Input({ className, ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 rounded border ${className}`}
      {...props}
    />
  );
}