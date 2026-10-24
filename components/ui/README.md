# Shared UI primitives

This directory contains small Tailwind-styled components reused by feature pages. They provide styling and basic accessible labels/focus states; they are not a separate design-system package.

- [`Button`](Button.tsx) renders a button or a Next.js link, with `primary`, `secondary`, and `danger` variants.
- [`Card`](Card.tsx) provides a content wrapper with optional React-node `header` and `footer`.
- [`Badge`](Badge.tsx) provides neutral/info/success/warning/danger status styling, also addressable through the gray/sky/green/amber/red tone aliases.
- [`Input`](Input.tsx) and [`Select`](Select.tsx) accept an `id`, `label`, optional `hint` and `error`, then associate feedback through `aria-describedby` and `aria-invalid`.

There is no shared modal or table component in this directory; the incident workflow uses the native `<dialog>` element, and feature views provide their own responsive rows/tables. Inputs render [`FieldValidationFeedback`](../harvest/FieldValidationFeedback.tsx), so this low-level UI folder has a small dependency on harvest field feedback. Styles use [`tailwind.config.ts`](../../tailwind.config.ts).
