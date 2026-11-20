## Why
Provider secrets are encrypted with a key derived from `AUTH_SECRET`. When that secret changes or a
stored value is damaged, decryption throws inside `settings(true)`. Every sign-in, the provider list,
the setup checks and the settings save path call it, so the whole site stops signing anyone in and an
operator cannot reach the console to re-enter the credentials.

Visitors who already have a Google session should also be able to sign in with one tap instead of a
full OAuth redirect. Kernlift Premium ships this; it belongs in Free because Free already offers
Google sign-in and One Tap adds no commercial code.

## What Changes
- A stored secret that cannot be decrypted reads as unset. The site keeps working with the other
  providers, the setup checks report the unreadable secrets, and the provider form names them so the
  operator can enter them again.
- A Google One Tap switch in Administration → Auth Config. While it is on and Google is configured,
  the sign-in and sign-up pages show Google's prompt and Better Auth's `oneTap` plugin verifies the
  ID token against the configured client.
