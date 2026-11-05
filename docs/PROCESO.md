# How we organize work on Space

Lightweight kanban with milestones. No sprints or fixed dates: what matters is that everything has an owner, a status and a next step.

## Where everything lives
- **Tickets:** issues in this repository. It is public: no customer data, emails, phone numbers or keys in tickets, screenshots or comments.
- **Board:** the "Space" project of the organization, with one view per kind of work (Bugs, Features, Ideas, Improvements, Critical, Board). Each view filters by label, so a ticket lands in its view just by carrying the right label.
- **Templates:** when creating an issue, pick Bug, Feature, Improvement or Request (intake). Each one sets its type label.

## Ticket flow
`Intake` → `Ready` → `In progress` → `In review (QA)` → `Done`

- **Intake:** everything new enters as a "Request" or a "Bug". One person triages once a week: confirms type, area and severity, or closes it with a reason.
- **Ready:** it has a clear goal and acceptance criteria and fits in under 2 days. If it is bigger, split it.
- **In review (QA):** `tsc` passes and the test matrix shows no new failures.
- **blocked** and **needs info** are labels, not states: the ticket stays where it was.

States are the values of the project's Status field. If the project does not have them yet, add them there.

## Labels
- **Type:** `type: bug`, `type: improvement`, `type: feature`, `type: request`, `type: tech debt`.
- **Severity (bugs only):** `S1: critical`, `S2: high`, `S3: medium`, `S4: low` (same scale as the QA matrix). The reporter suggests it in the form; triage confirms it and sets the label.
- **Area:** `area: catalog`, `panel`, `import-export`, `account`, `landing`, `seo-performance`, `accessibility`.
- **Other:** `blocked`, `needs info`, `found in QA`.

## Milestones
They group tickets by goal, not by date. They close when all their tickets are done and deployed.

## Branches and deployment
- Work happens on `feat/…`, `fix/…` or `chore/…` branches that start from `dev`.
- Each PR links its ticket with `Closes #n`.
- `dev` is the integration branch. `main` is production: it is only updated with explicit confirmation, after the QA matrix and a review of the `dev` deployment.
- Each release keeps the previous commit as a rollback point.

## Bugs
The title says what fails and where. It carries steps, expected vs. actual result and evidence. If QA found it, add the matrix ID and the `found in QA` label. Bugs reported with the Bug Box extension arrive already as an issue with the `type: bug` label.
