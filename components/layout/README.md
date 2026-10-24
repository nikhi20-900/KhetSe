# Application layout

The shared shell is currently defined inline in [`app/layout.tsx`](../../app/layout.tsx), not as components in this directory. That layout imports global Tailwind styles and renders the KhetSe header/navigation, page container, and footer around App Router pages. There are no `Header.tsx`, `Footer.tsx`, sidebar, or breadcrumb exports here yet.

Global color variables and responsive styles are in [`app/globals.css`](../../app/globals.css); Tailwind scans `app/` and `components/` as configured by [`tailwind.config.ts`](../../tailwind.config.ts). Navigation links are plain application routes; no authentication or role-based visibility is implemented.
