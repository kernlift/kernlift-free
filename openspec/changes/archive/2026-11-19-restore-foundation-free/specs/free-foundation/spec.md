## ADDED Requirements

### Requirement: Standalone foundation
The Free repository SHALL expose bilingual customer and operator routes, reusable foundation UI, actual registration statistics, roles, support, audit and assets.

#### Scenario: Existing installation upgrades
- **WHEN** an existing customer signs in
- **THEN** their account, permissions, tickets and private file access are preserved

#### Scenario: Operator views registration statistics
- **WHEN** a permitted operator opens the dashboard
- **THEN** metrics reflect registered accounts in the selected date window independently of commercial tables
