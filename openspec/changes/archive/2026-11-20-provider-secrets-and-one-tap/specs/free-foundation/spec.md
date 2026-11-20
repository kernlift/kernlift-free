## ADDED Requirements

### Requirement: Unreadable provider secrets
The Free repository SHALL treat a stored provider secret that cannot be decrypted as unset, keep serving the other providers, and report the unreadable secret to operators.

#### Scenario: Authentication secret changed
- **WHEN** a stored secret was encrypted under a different `AUTH_SECRET`
- **THEN** sign-in with email and password still works, the affected provider is reported as not configured, and the setup checks and provider form name the secret

#### Scenario: Operator re-enters the secret
- **WHEN** an operator saves a new value for an unreadable secret
- **THEN** the secret is readable again and no longer reported

#### Scenario: Blank field
- **WHEN** an operator saves the provider form with an unreadable secret left blank
- **THEN** the stored value is kept unchanged

### Requirement: Google One Tap
The Free repository SHALL offer Google One Tap on the sign-in and sign-up pages when an operator switches it on and Google sign-in is configured, verifying every ID token against the configured Google client.

#### Scenario: One Tap enabled
- **WHEN** One Tap is on and the Google client ID and secret are configured
- **THEN** the provider list exposes the public client ID, the auth pages show Google's prompt, and a token that is not a valid Google ID token for that client is rejected

#### Scenario: One Tap off or Google missing
- **WHEN** One Tap is off, or Google sign-in is not configured
- **THEN** no client ID is exposed and the One Tap callback endpoint does not exist
