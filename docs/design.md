# Design

- **Design canvas (V1):** https://claude.ai/artifact/YW6gZci4MPYzRNY55FxFxw. It's private; the owner shares it from the canvas's Share menu.
- **Screen sources:** [`design/screens/`](../design/screens). These are the canvas artboards in `.dc.html` format, kept here as a reference for markup, copy and sample data.

## Visual language

| Token | Value | Use |
| --- | --- | --- |
| Background | `#FAF7F2` | App background |
| Surface | `#FFFFFF` | Cards, sheets, headers |
| Border | `#E7E1D8` | Card and divider lines |
| Text | `#2A2420` | Primary text |
| Muted text | `#6B625A` | Secondary text, subtitles |
| Accent | `#B04E0A` | Primary buttons, active tab, progress |
| Font | Noto Sans Sinhala | All text, line-height 1.5 |

Touch targets are at least 44px. Mobile layout comes first, at a 390px reference width.

## Assignment status

The item status and each contributor's assignment status are **separate**. An item's status is derived from its assignments.

| Key | Label | Symbol | Background / text |
| --- | --- | --- | --- |
| `unassigned` | පවරා නැත | ○ | `#F1EEEA` / `#57504A` (dashed border) |
| `pending` | තහවුරු කර නැත | ◔ | `#FDF0D5` / `#7A4A00` |
| `partial` (item only) | අර්ධ වශයෙන් තහවුරුයි | ◑ | `#FDF0D5` / `#7A4A00` |
| `confirmed` | තහවුරුයි | ✓ | `#E2F0E6` / `#1C5E33` |
| `received` | ලැබී ඇත | ✓✓ | `#E3ECF8` / `#1E4A85` |

Every status shows its text label as well as its colour and symbol. A new assignment always starts as `pending`: adding a name never counts as confirmation.

## Language: mixed Sinhala and English

Sri Lankan users are used to apps that mix Sinhala and English, and a fully Sinhala UI feels unfamiliar. The rule: keep Sinhala for domain and Buddhist terms and for most labels, and use English where it's the everyday word (for example "Item", "Clear", "Edit", "Edit Categories", "Search", "Settings", "Logout", "Password", "Save", "Cancel", "Upload", "Download", "Open", "Account", "Not Found", "WhatsApp").

| Concept | UI text |
| --- | --- |
| Home greeting | නමෝ බුද්ධාය! |
| Events home title | දාන |
| Create event | අළුත් දානයක් |
| Food item | Item |
| Add item | Item එකක් එක් කරන්න |
| Edit (event tab, cards, items, assignments, transactions, contributors) | Edit |
| Edit categories (event menu and that screen's title) | Edit Categories |
| Category templates on Settings | Edit |
| Clear filters/search | Clear |
| Search tab and screen | Search |
| Settings | Settings |
| Sign out | Logout |
| Password section | Password |
| New password fields | New Password / New Password Again |
| Optional field marker | (optional) |
| Event date | calendar (`YYYY-MM-DD`) |
| Leave the event form | Cancel |
| Cancelled event | Cancelled |
| Cancel an event | දානය Cancel කරන්න |
| Restore a cancelled event | දානය නැවත සක්‍රීය කරන්න |
| Assign to someone | `<name>` ට පවරන්න |
| Login field | නම (Username) + Password |
| Sign in | Login |
| Show or hide the password | Show password / Hide password |
| Wrong sign-in | නම හෝ Password වැරදියි. |
| Settings account section | Account |
| Save a form | Save |
| Upload a photo or PDF | Photo එකක් හෝ PDF එකක් Upload කරන්න |
| Upload button | Upload කරන්න |
| Open a file | Open |
| Download a file | Download |
| Share a contributor's list | WhatsApp |
| Search with no matches | Not Found |
