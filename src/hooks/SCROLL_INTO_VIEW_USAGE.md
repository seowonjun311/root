# useScrollIntoViewOnFocus Hook

Automatically scrolls form inputs into view when focused, preventing keyboard obscuration on mobile devices.

## Usage Example

```jsx
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

export default function MyForm() {
  const scrollRef = useScrollIntoViewOnFocus();

  return (
    <form ref={scrollRef} className="space-y-4">
      <input type="text" placeholder="Name" />
      <input type="email" placeholder="Email" />
      <textarea placeholder="Message"></textarea>
    </form>
  );
}
```

## How It Works

- Attaches a focus event listener (capture phase) to the container
- Detects INPUT, TEXTAREA, and SELECT elements
- Smoothly scrolls the focused element into the center of the viewport
- Uses `requestAnimationFrame` for optimal performance
- Works seamlessly on mobile and desktop

## Features

✅ Prevents keyboard from obscuring inputs  
✅ Smooth scroll behavior  
✅ Centers focused input in viewport  
✅ Zero configuration required  
✅ Non-breaking for web/native environments