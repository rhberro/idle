# Auth lives entirely in apps/client, not apps/website

`apps/website`'s `SiteHeader`/`signOut` action and `@supabase/ssr` session-refresh middleware were scaffolded assuming the marketing site would host sign-in/sign-up UI. We're removing all of that: `apps/website` never calls Supabase Auth or knows whether a visitor is signed in — its only connection to auth is a "Play game" link to `apps/client`'s origin (`play.<domain>`), where sign-in, sign-up, sign-out, and password reset all live.

This sidesteps a real cross-origin problem: the website's cookie-based `@supabase/ssr` session and the client's browser-storage `supabase-js` session don't share automatically across `<domain>` and `play.<domain>`. It also keeps the website's build/deploy fully decoupled from anything auth-related, since it has no protected content of its own.
