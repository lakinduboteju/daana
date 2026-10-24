# A household owns all data, even with one organizer

_Superseded by [ADR 0004](0004-organizer-owns-data.md): the household was removed._

V1 has a single organizer, but events, contributors, monasteries and category templates belong to a **household**, not to an organizer's account. Access rules check whether the organizer is a member of the household.

Scoping every row to `auth.uid()` would be simpler today. But V2's co-organizers would then need a data migration and a rewrite of every access policy. With a household, a co-organizer joins as a second member, and the data and policies don't change. The cost now is one table and one membership row.
