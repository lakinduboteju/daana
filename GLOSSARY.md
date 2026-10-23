# දාන — Almsgiving Organizer

Planning Buddhist almsgiving events for monks at a monastery: the menu, who brings each dish, whether they've agreed, and the money and documents around it.

## People and ownership

**Organizer**:
A person who signs in and plans events. In V1, a household has one organizer.
_Avoid_: User, admin

**Household**:
The group that owns events, contributors, monasteries and category templates. Organizers belong to a household.
_Avoid_: Team, workspace, family, account

**Contributor** (දායකයා):
A person who may bring or pay for food for an event. Contributors don't sign in. They're kept in the household's reusable list.
_Avoid_: Donor, helper, person, member

**Host** (දානය භාරගත් අය):
The person or family on whose behalf an event is given, such as "බොතේජු පවුල". An event may have no host.
_Avoid_: Almsgiving name, sponsor, dedication

**Monastery** (අසපුව):
The place where an event is given, kept in the household's list.
_Avoid_: Temple, asapuwa, venue

## Events and menu

**Event** (දානය):
One almsgiving for one meal on one date at one monastery. It's upcoming or past depending on its date, and it can be cancelled.
_Avoid_: Almsgiving, dana, occasion

**Meal** (හීල් / දහවල්):
Which meal an event serves: breakfast (හීල්) or lunch (දහවල්).
_Avoid_: Session, time

**Category** (කාණ්ඩය):
A group of items within one event's menu, such as බත් or පලතුරු. Each event has its own categories.
_Avoid_: Section, group

**Category template**:
A household-level default category that's copied into new events. Changing it doesn't affect existing events. The defaults are බත්, හොදි, ව්‍යංජන, පලතුරු, කැවිලි හා අතුරුපස, පාන, වෙනත් ආහාර, පිරිකර and ඖෂධ.
_Avoid_: Global category, default category

**Item**:
One thing to be offered at an event, under one category. It's usually a dish, but can also be a requisite (පිරිකර) or a medicine (ඖෂධ). It can have a required quantity in a single unit.
_Avoid_: Menu item, food item, dish, අයිතමය

**Ready**:
An item whose item status is confirmed or received. An event's progress is its ready items out of all its items.
_Avoid_: Done, complete

**Needs attention**:
An item in an upcoming, non-cancelled event that is unassigned or pending. Partial items are counted separately, as short.
_Avoid_: Urgent, outstanding

**Required quantity**:
How much of an item the event needs, in the item's unit.
_Avoid_: Estimated quantity, amount

**Unit**:
What an item's quantities are measured in: kg, litres, pieces, or a custom unit typed in for that item.
_Avoid_: Measure, UOM

## Assignments

**Assignment**:
A contributor taking responsibility for an item (or part of one) in an event. It can record a quantity in the item's unit.
_Avoid_: Allocation, commitment, pledge

**Assignment status**:
Where one assignment stands: **pending** (තහවුරු කර නැත — asked or suggested, not yet agreed), **confirmed** (තහවුරුයි — agreed), or **received** (ලැබී ඇත — delivered). A new assignment is always pending.
_Avoid_: Commitment status

**Item status**:
An item's overall readiness, worked out from its assignments: **unassigned**, **pending**, **partial**, **confirmed** or **received**. It's never set directly.
_Avoid_: Item state

**Partial** (අර්ධ වශයෙන් තහවුරුයි):
An item where some assignments are confirmed but others are still pending, or where the confirmed quantity is less than the required quantity.
_Avoid_: Partially confirmed, incomplete

**Shortfall**:
The gap between an item's required quantity and its confirmed quantity. It counts only when both are known.
_Avoid_: Deficit, missing amount

## Money

**Transaction**:
A money record for an event. It can be linked to an item and a contributor. It is either a given or an expense.
_Avoid_: Payment, entry

**Given** (ලබා දුන්):
Money the organizer handed to a contributor, for example to buy ingredients.
_Avoid_: Payment, advance, transfer

**Expense** (වියදම්):
The actual cost of something bought for the event, usually backed by a bill.
_Avoid_: Cost, spend, purchase

**Reimbursement**:
What the organizer still owes a contributor: their expenses minus the money they were given, when that's above zero. It's settled by recording another given.
_Avoid_: Refund, outstanding payment
