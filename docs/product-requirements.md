# Product Requirements

## Buddhist Almsgiving Organizer App — දාන සංවිධාන යෙදුම

Product UI/UX Design Requirements for App Version 1.0

## 1. Product Overview

The Buddhist Almsgiving Organizer is a mobile-first web application that helps people plan, organize, and manage almsgiving events (දාන) for Buddhist monks (ස්වාමීන් වහන්සේලා) at monasteries (අසපු).

The main purpose is to make it easy for an organizer to create an almsgiving event (දානය), plan the food menu (මෙනුව), assign food items (ආහාර) to contributors,(දායකයන්) track who has agreed to provide each item, and manage any related expenses and documents.

The application should give the organizer a clear overview of the entire event, including what has been planned, what has been confirmed, what is still unassigned, and what needs attention.

The application will use:

- Frontend: React
- Backend: Supabase (database, authentication, file storage)
- Primary language: Sinhala
- Primary device: Mobile phones
- Secondary device: Desktop and tablets

The user interface must be simple, practical, and easy for Sinhala-speaking users who may not be technically experienced.

## 2. Target Users

Primary user — Almsgiving Organizer

The person responsible for organizing one or multiple almsgiving events. They create events, manage menus, assign contributors, confirm commitments, and monitor progress.

Secondary user — Contributors (future feature, not in this version)

People who agree to prepare, purchase, or bring food items for an almsgiving event.

For the initial version, the organizer can manage all contributor information without requiring contributors to create accounts.

In a future version, contributors could access a simple shared page to view their responsibilities and confirm their commitments.

## 3. Main Application Screens / Functionalities

1 — Almsgiving Events

The home screen displays all upcoming and previous almsgiving events as cards, with event dates and summary information.

2 — Event Menu and Assignment Tracking

Displays food categories, menu items, assigned contributors, confirmation statuses, and progress.

3 — Food Item Details

Add or edit an item's contributors, quantities, preparation notes, status, payments, and documents.

4 — Expenses and Documents

Track money given to contributors, record expenses, and store supporting receipts and bills.

5 — People, Filters and Settings

Manage contributors, search across events, configure food categories, and update event preferences.

## 4. Functional Requirements

### 4.1 Home Screen — Almsgiving Events

The home screen should display a list of almsgiving events, with each event presented as a card.

Each card should contain:

| Field               | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| Date (දිනය)               | Date of the almsgiving                                             |
| Meal of the day           | Breakfast (හීල් දානය) and lunch (දහවල් දානය)                |
| Monastery           | Name and optionally location (E.g: මාලබේ අසපුව)                                       |
| Almsgiving name     | Name, dedication, or person/family on whose behalf it is organized (දානය භාරගත් අය) |
| Number of monks     | Expected number of Buddhist monks (ස්වාමීන් වහන්සේලා ගණන)                                 |
| Number of laypeople | Expected number of lay attendees (ගිහි පිරිස)                                  |
| Progress            | Number or percentage of menu items confirmed                       |
| Event status        | Upcoming, completed, or cancelled                                  |

Expected behavior

- Display upcoming events first, sorted by date.
- Provide a separate section for past events.
- Allow users to create, edit, duplicate, and delete events.
- Tapping an event card opens its menu and management screen.
- Include search and filtering by date, monastery, organizer/name, and event status.
- Support multiple events on the same date.
- Provide a clear primary action to create a new event.

Recommended addition: Allow an organizer to duplicate an existing event, including its menu and categories, to save time when organizing similar almsgiving events. Contributor confirmations should reset for the new event.

### 4.2 Create or Edit an Almsgiving Event

The organizer should be able to enter:

Required information

- Almsgiving date (දිනය)
- Meal of the day (හීල් දානය / දහවල් දානය)
- Monastery name (මාලබේ අසපුව, පොල්ගහවෙල අසපුව)
- Almsgiving name or dedication (දානය භාරගත් අය)
- Number of monks (ස්වාමීන් වහන්සේලා ගණන)
- Number of laypeople (ගිහි පිරිස)

Optional information

- Main organizer's name and contact number
- Additional event notes
- Special dietary requirements or monastery instructions

The total expected number of recipients should be calculated automatically by adding monks and laypeople.

Users should be able to edit all event information later.

### 4.3 Event Dashboard and Menu Overview

When an organizer opens an event, the application should show the event summary and its menu.

At the top, show the event date, meal of the day, monastery, expected recipients, and overall preparation progress.

The event screen should make it easy to identify:

- How many menu items are planned.
- How many items have been assigned.
- How many assignments are confirmed.
- How many items still require contributors or confirmation.
- Which items need immediate attention.

An event should have a single clear progress indicator, and each category should have its own smaller progress indicator.

### 4.4 Menu Categories

Food items should be organized under categories.

The application should include a default set of Sinhala categories, for example:

| Category            | Sinhala           |
| ------------------- | ----------------- |
| Rice dishes         | බත්          |
| Gravy               | හොදි        |
| Curries             | ව්‍යංජන      |
| Fruits              | පලතුරු            |
| Sweets and desserts | කැවිලි හා අතුරුපස |
| Beverages           | පාන          |
| Other food items    | වෙනත් ආහාර        |

These are initial examples only. The final category names and default menu items can be supplied later.

Category management

- Add custom categories.
- Rename categories.
- Remove categories that are no longer needed.
- Reorder categories.
- Add, edit, and delete menu items inside categories.
- Move menu items between categories.
- Expand or collapse categories to simplify the mobile view.

Categories should be configurable for each event. Ideally, the app should also have reusable global category templates.

### 4.5 Food Item Details

Each menu item should have a detail screen or mobile-friendly editing panel.

| Field             | Required? | Description                                       |
| ----------------- | --------- | ------------------------------------------------- |
| Item         | Yes       | Name of the food item in Sinhala                  |
| Category          | Yes       | Category under which the item appears             |
| Contributors (දායකයන්)     | No        | One or multiple responsible people                |
| Status | Yes       | Current assignment / commitment status                         |
| Quantity (ප්‍රමාණය)         | No        | Required amount and unit                          |
| Preparation notes | No        | Special instructions or requirements              |
| Payments (මුදල්)          | No        | Financial support given for the item              |
| Attachments       | No        | Transfer receipts, bills, photos, other documents |

Quantity should support configurable units, such as kilograms, grams, litres, portions, pieces, and trays, as well as a custom unit.

An organizer should be able to create a menu item before knowing who will provide it.

### 4.6 Contributor Assignment and Confirmation

An item can be assigned to one person or multiple people.

The organizer should be able to:

- Select an existing contributor or add a new person.
- Assign multiple contributors to the same item.
- Record a tentative contributor without marking the assignment as confirmed.
- Confirm the contributor's commitment after receiving their agreement.
- Change, remove, or replace contributors.
- Record optional quantities for each contributor when multiple people share responsibility.

For example, if 3 kg of rice is required, one contributor may provide 1 kg and another 2 kg.

Assignment statuses

පවරා නැත

Unassigned — no contributor has been selected.

තහවුරු කර නැත

Pending — a contributor is suggested or contacted but has not agreed.

තහවුරුයි

Confirmed — contributor has agreed to provide the item.

ලැබී ඇත

Received — the contribution has arrived or been completed.

The Received status is an additional recommendation for tracking preparation on the day of the almsgiving.

For items assigned to multiple contributors, confirmation should be tracked individually. The item can also show a combined status such as "Partially confirmed" if only some contributors have agreed or the committed quantity is insufficient.

Important: Never treat assigning someone's name as confirmation that they have agreed.

### 4.7 Contributor Management

The app should maintain a reusable list of contributors.

Each contributor can have:

- Name
- Phone number (optional)
- Additional contact details - like WhatsApp, Facebook Messenger, Telegram (optional)
- Notes (optional)

The organizer should be able to search for a contributor and see all their assigned items across different events, including their confirmation statuses.

Avoid requiring contributors to register or log in for this first version.

### 4.8 Financial Records and Expense Tracking

Each menu item should optionally support financial transactions.

For example, the organizer may transfer money to a contributor to purchase ingredients.

The organizer should be able to:

- Record the amount provided.
- Record the contributor receiving the money.
- Enter the transfer or payment date.
- Specify payment method, such as bank transfer or cash.
- Upload a bank transfer receipt.
- Add optional notes.
- Record actual expenses and attach purchase bills.
- View the financial history related to the item.

Recommended addition: Include an event-level financial summary showing total money paid, total recorded expenses, and any outstanding payments or reimbursements. Keep money provided and actual expenses separate to prevent double-counting.

All financial details should be optional. Organizers who only want menu and contributor tracking should not have to use these features.

### 4.9 Attachments and Documents

The application should provide a dedicated attachments or documents section.

Documents can be attached to individual items or to an event in general.

Supported document types should include images and PDFs.

Examples:

- Bank transfer receipts
- Ingredient purchase bills
- Supplier invoices
- Menu preparation instructions
- Other event-related documents

Users should be able to upload, preview, download, rename, and delete documents.

### 4.10 Search and Filtering

Filtering is a major requirement because the organizer may manage many menu items across several almsgiving events.

Global search and filters

Search across all events by:

- Contributor
- Food item
- Monastery
- Almsgiving name
- Date or date range
- Assignment / commitment status

Examples:

- Show every item assigned to Nimal across all events.
- Show every almsgiving event where kiribath is included.
- Show all unassigned items across upcoming events.
- Show all assignments still awaiting confirmation.

Event-specific filters

Within one almsgiving event:

- All menu items
- Unassigned
- Pending confirmation
- Confirmed
- Received
- Category
- Contributor

Filters should be quick to apply, easy to clear, and visible as selectable chips on mobile screens.

Support combining filters and searching within the filtered results.

## 5. Additional Recommended Features

The following features would make the application more useful without changing its main purpose.

| Feature                                  | Purpose                                                        | Priority |
| ---------------------------------------- | -------------------------------------------------------------- | -------- |
| Reusable menu templates                  | Quickly reuse common food menus                                | High     |
| Duplicate previous events                | Avoid recreating recurring almsgiving arrangements             | High     |
| Day-of-event checklist                   | Track which food items have actually arrived                   | High     |
| Contributor summary                      | View everything one person has agreed to bring                 | High     |
| Quick contact actions                    | Call or message contributors directly from the app             | High     |
| WhatsApp/shareable summaries             | Share item lists and responsibilities with contributors        | Medium   |
| Event sharing                            | Allow trusted co-organizers to collaborate                     | Medium   |
| Reminders                                | Identify or notify contributors with outstanding confirmations | Medium   |
| Estimated quantity vs committed quantity | Identify items where the required amount is not yet covered    | Medium   |
| Reports and exports                      | Export event menu, assignments, or expenses to PDF             | Medium   |
| Activity history                         | See who made changes and when                                  | Low      |

For this initial release, manual confirmation updates are sufficient. Automated messages and full contributor accounts can be added later.

## 6. Navigation and Mobile UX Requirements

The product should be designed mobile-first, not as a desktop application reduced to a smaller screen.

The experience should prioritize quick reading and editing, with as little typing and navigation as possible.

Design principles

- Use readable Sinhala typography with proper Sinhala character rendering.
- Use large touch-friendly buttons and controls.
- Use card-based layouts instead of wide tables.
- Display important statuses using both color and text, not color alone.
- Keep primary actions such as "Add Item" easily accessible.
- Use simple forms with clear labels and optional fields hidden when unnecessary.
- Use bottom sheets or focused screens for editing on mobile.
- Provide clear empty states, loading indicators, error messages, and save confirmations.
- Allow quick editing without losing the user's place in the menu.
- Support long contributor names and Sinhala item names without breaking layouts.
- Design responsive layouts for tablets and desktop while keeping mobile the priority.

All user-facing navigation, buttons, labels, messages, and default category names should be in Sinhala. English support can be added later as an optional language setting.

## 7. Screens and User Flows Required from the Designer

The UI/UX designer should produce complete designs for these experiences.

| Screen                 | Main purpose                                                    |
| ---------------------- | --------------------------------------------------------------- |
| Login                  | Secure organizer access                                         |
| Events home            | View all upcoming and past events                               |
| Create/edit event      | Enter almsgiving information                                    |
| Event overview         | View preparation progress and event details                     |
| Menu management        | Browse, add, edit, and organize food items                      |
| Food item details      | View quantities, notes, contributors, finances, and attachments |
| Assign contributor     | Find or add a contributor and set the status                    |
| Contributors directory | Manage people and their responsibilities                        |
| Contributor details    | View all assignments for one person                             |
| Global search          | Search and filter across events                                 |
| Event-specific filters | Find items requiring attention                                  |
| Payments and expenses  | Manage event-related financial transactions                     |
| Documents              | View and manage attachments                                     |
| Category management    | Create and customize categories                                 |
| Event settings         | Modify event information and preferences                        |
| Application settings   | Manage language, account, and global defaults                   |

The designer should also cover important interaction states, including empty screens, partially completed events, fully confirmed menus, items with multiple contributors, missing quantities, failed uploads, and confirmation before destructive actions.

## 8. Technical and Data Requirements

The following requirements help ensure the designs are practical for the planned React and Supabase application.

Authentication and access

- Organizers should log in securely using Supabase Authentication.
- All event information should be accessible only to authorized users.
- Contributors should not need accounts in the initial version.
- Shared access, if added, should distinguish organizers who can edit from people who can only view.

Data organization

The backend should support these main data entities:

- Users and organizers
- Almsgiving events
- Menu categories
- Menu items
- Contributors
- Item-to-contributor assignments
- Assignment confirmation statuses
- Financial transactions
- Documents and attachments
- Optional activity history

Multiple contributors must be able to belong to the same menu item, and the same contributor must be reusable across multiple events.

File storage and security

- Supabase Storage should store uploaded receipts, bills, and documents.
- Files should be private by default.
- Organizers should only have access to events and files they are permitted to view or edit.
- Important changes and deletions should require appropriate permissions.

Usability and reliability

- Prioritize fast loading on mobile networks.
- Show clear feedback when data is being saved or updated.
- Prevent accidental loss of changes.
- Handle intermittent internet connections gracefully.
- Store monetary values consistently in Sri Lankan Rupees (LKR) by default, with configurable currency if needed.
- Support both local date display and consistent date storage.
- Ensure Sinhala search works properly for menu items, categories, and contributor names.

## 9. Main User Journey

1

Create an almsgiving event

Enter date, monastery, dedication and attendees

2

Build the menu

Add food items under Sinhala categories

3

Assign contributors

Choose people and optionally allocate quantities

4

Confirm commitments

Update statuses as people agree

5

Track preparation

Review pending items, notes and expenses

6

Complete the event

Check received items and close the event

## 10. MVP Scope and Future Phases

To keep the initial application simple, the product should be divided into two stages.

Version 1 — Essential features

Include event creation, event cards, Sinhala menu categories, menu item management, contributor assignments, confirmation statuses, optional quantities and notes, payments, receipt uploads, contributor management, search, filters, and basic progress insights.

This should be a fully usable application for a single organizer, rather than a prototype.

Version 2 — Extended features

Add multiple organizers, contributor self-service pages, automated reminders, richer financial reporting, printable/exportable summaries, activity history, and reusable event templates if they are not already included in Version 1.

## 11. Final Product Design Goal

The most important design requirement is that an organizer should be able to open an almsgiving event on their phone and immediately understand what is ready, what is not ready, who is responsible, and what actions are required next.

The application should not feel like a complicated project-management or accounting system. It should feel like a simple, purpose-built Sinhala application for organizing Buddhist almsgiving, with financial and document-management features available when needed.

Success means the organizer can manage an entire event without relying on scattered notes, spreadsheets, or long messaging conversations.

## Recommended Design Deliverables

The designer should deliver a clickable mobile prototype, a complete set of Sinhala UI screens, a reusable component library (cards, badges, forms, filters, dialogs), and responsive layouts for desktop use.

The prototype should demonstrate at least three core flows: creating an event and planning the menu; assigning a contributor and confirming a commitment; and locating outstanding items through filters.

The designs should be realistic enough that a React developer can implement them directly with Supabase, without having to make major product or interaction decisions independently.

One particularly important design decision: An item and a contributor's assignment should have separate states. A food item can have several contributors, each with a different confirmation status. Handling that distinction correctly will make the application much more reliable as real events become more complex.
