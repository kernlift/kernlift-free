## Unreadable secrets
`settings(true)` decrypts each secret through `decryptSetting`, which returns `null` instead of
throwing when the value is not `iv.tag.data` or fails AES-GCM authentication. A `null` reads as the
empty string, the same as a secret that was never saved, so every caller already treats it as "not
configured". `unreadableSecrets()` lists the affected keys for the setup checks and the provider form.

Saving keeps the current rule: a blank secret field keeps the stored value, a filled one replaces it.
Re-entering the secret therefore repairs it, and nothing ever overwrites an unreadable value on its
own. The key derivation and the stored format are unchanged, so existing installations need no
migration.

## Google One Tap
A new non-secret setting `googleOneTap` (`on`/`off`, default off). `getAuth()` mounts
`oneTap()` from `better-auth/plugins` only while it is on and both Google credentials are readable;
otherwise `/api/auth/one-tap/callback` does not exist. The plugin verifies the token's signature,
issuer and audience (the configured client ID). New accounts follow the same rule as the Google
button: Free registration always creates an ordinary member.

`/api/core/providers` returns `googleOneTapClientId`, the public client ID or `null`, computed by
`providerFlags()` next to the other flags. The auth page mounts `GoogleOneTap`, which loads Google
Identity Services, prompts with FedCM, posts the credential to the callback and follows the page's
safe return path. When the script is blocked the Google button still works.
