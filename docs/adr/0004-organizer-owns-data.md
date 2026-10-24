# Data belongs to the organizer

_Supersedes [ADR 0001](0001-household-owns-data.md)._

Events, contributors, monasteries and category templates belong to the organizer who signs in: each row has an `organizer_id` that defaults to `auth.uid()`, and access rules check it. Everything else (categories, items, assignments, transactions, documents) belongs to an organizer through its event.

ADR 0001 put a household between the organizer and their data, for co-organizers in V2. In practice it was a concept the organizer never saw, was easily confused with an event's host, and needed a second, manual setup step. When that step was missed in production, the organizer couldn't create anything (#22). Creating the user is now the only setup step: a new user gets the default category templates from a database trigger.

The cost: sharing data with a co-organizer later needs a migration to put a group back between organizers and their data, and every access rule rewritten.
