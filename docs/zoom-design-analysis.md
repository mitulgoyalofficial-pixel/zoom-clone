# Zoom web app: design analysis

Single source of truth for how the clone should look and behave.
Built screen by screen from reference screenshots. The images were pasted in the chat (not stored in the repo),
so everything needed to build is written down here.

How to read this file:
- **[measured]** = value taken from dev tools. **[estimated]** = read by eye from a screenshot, may be a few px / shades off.
- Sizes are **CSS px** unless marked "(shot)". Screenshots were taken at Windows display scale 125% (confirmed:
  devicePixelRatio = 1.25), so `CSS px = screenshot px / 1.25`.
- Rule: build with the estimate, then correct the value here after review.

---

## 1. Global design tokens

Final values go into `frontend/app/globals.css` (Tailwind theme).

| Token | Value | Source |
|---|---|---|
| Brand blue (links, primary buttons, Join/Schedule tiles) | `#0B5CFF` | CLAUDE.md |
| Host / New Meeting tile orange | ~`#F5732A` | [estimated] |
| Top utility bar background | near-black navy, ~`#05050F` | [estimated] |
| Main navbar background | `#FFFFFF` | [estimated] |
| Page (main content) background | `#FFFFFF` | [estimated] |
| Sidebar background | very light grey-lavender, ~`#F5F6FA` | [estimated] |
| Sidebar active item (Home) background | light blue-grey, ~`#EBF0FA` | [estimated] |
| Card background | `#FFFFFF` with soft shadow | [estimated] |
| Empty-state box / soft button background | ~`#F2F4FA` (soft blue-grey) | [estimated] |
| Border / divider | ~`#E4E7EE` | [estimated] |
| Main text | dark navy-grey, ~`#232333` | [estimated] |
| Secondary text | mid grey, ~`#6B6F80` | [estimated] |
| Link blue (text links) | same as brand blue | [estimated] |
| Default avatar colour | purple ~`#A94BC0` (comes from users.avatar_color) | [estimated] |
| "New" badge | bg ~`#E6EEFF`, text brand blue | [estimated] |
| "Canvas" tag (red outline pill) | text ~`#D92D4B`, border ~`#F3B5BF`, bg `#FFF3F5` | [estimated] |
| Footer background | dark slate, ~`#3B3B4F`, white text | [estimated] |
| Form input border | ~`#CDD1DB`, 1px, radius 8, white fill | [estimated] |
| Disabled control | text and border lighter grey (~`#B8BCC8`) | [estimated] |
| Notice box (amber warning) | bg ~`#FFF9F0`, border ~`#F0D3A8` 1px, radius ~12, amber triangle icon | [estimated] |
| Soft button (Cancel, Add Whiteboard) | bg ~`#F2F4FA`, text brand blue, radius 8 | [estimated] |
| Checkbox | 16px, radius 4, grey 1px border; checked = brand-blue fill + white tick | [estimated] |
| Radio | 16px circle; selected = thick brand-blue ring with white centre; unselected = thin grey ring | [estimated] |
| Nav link hover (Products, Solutions, Resources, Plans & Pricing) | text turns brand blue | [user-reported] |
| Meeting room background | _tbd (meeting screens not yet analysed)_ | |
| Font family | geometric sans, Inter-like (`Inter`, system-ui fallback) | [estimated] |
| Base font size | 16px | [estimated] |
| Card radius | ~12px | [estimated] |
| Button / pill radius | ~8px | [estimated] |
| Action tile (icon) radius | ~12px | [estimated] |
| Card shadow | very soft, ~`0 2px 10px rgba(0,0,0,0.08)` | [estimated] |

## 2. Layout and spacing (desktop, ~1536 CSS px wide viewport)

| Item | Value (CSS px) | Source |
|---|---|---|
| Top utility bar height | 40 | [estimated] (50 shot) |
| Main navbar height | 64 | [estimated] (80 shot), 1px bottom border |
| Sidebar width | 300 | [estimated] (375 shot), full height, scrolls with page |
| Gap between sidebar and content | ~72 | [estimated] |
| Content grid | 2 columns: left ~725 wide, right ~326 wide, gap ~24 | [estimated] |
| Card inner padding | ~24 | [estimated] |
| Vertical gap between cards | ~24 | [estimated] |
| Sidebar item height | ~36 | [estimated] |
| Quick-action icon tile | 50 x 50, centres ~93 apart | [estimated] |
| Chat button (floating, bottom-right) | 56 circle, brand blue | [estimated] |

Type scale (CSS px, estimated): utility bar text 15; nav links 16 (medium weight); sidebar items 15-16, section label 13 grey;
card titles ("Meetings", "Recent activity") ~26 bold; profile name ~24 bold; body/meta 15-16; buttons 15; empty-state text 18 bold.

---

## 3. Screens

Order of analysis: dashboard, schedule form, join dialog, pre-join, meeting room, small states.

### 3.1 Dashboard (zoom.us/myhome, laptop width) - ANALYSED

**Page structure**

```
+--------------------------------------------------------------------------------+
| UTILITY BAR (black):            Search  Support  <phone> | Contact Sales  Request a Demo |
+--------------------------------------------------------------------------------+
| ZOOM  Products Solutions Resources Plans&Pricing      Schedule Join Host v WebApp v (m) |
+-----------+--------------------------------------------------------------------+
| SIDEBAR   |  +-------------------------------+   +--------------------------+  |
| Home      |  | PROFILE CARD                  |   | QUICK ACTIONS CARD       |  |
| My Prod.. |  | [m] name  Manage Plan         |   |  [Host] [Join] [Schedule]|  |
|  AI  New  |  |     Plan: ...  View Plan ..   |   |  Personal Meeting ID ... |  |
|  Meetings |  +-------------------------------+   |  Booking links (3 tiles) |  |
|  ...      |  | PROMO CARD (Upgrade and save) |   +--------------------------+  |
|  Tasks    |  +-------------------------------+   | MEETINGS CARD            |  |
|  Scheduler|  | RECENT ACTIVITY CARD          |   |  Meetings   Visit Meet.. |  |
| Discover  |  |  [tabs: Recordings|Summaries| |   |  "No Upcoming Meetings"  |  |
| > My Acct |  |         My Notes]             |   |  [Test Audio and Video]  |  |
| > Admin   |  |  item cards (thumb,title,..)  |   +--------------------------+  |
| > Support |  +-------------------------------+                         (chat o) |
+-----------+--------------------------------------------------------------------+
| FOOTER (dark slate): About / Download / Sales / Support / Language, Currency, socials, copyright |
+--------------------------------------------------------------------------------+
```

**A. Top utility bar** (black, full width, 40px): right-aligned white items: search icon + "Search", "Support",
a phone number, a thin vertical divider, "Contact Sales", "Request a Demo". Marketing links, not functional in the clone.

**B. Main navbar** (white, 64px, bottom border):
- Left: blue "ZOOM" wordmark (~110px wide), then links Products, Solutions, Resources, Plans & Pricing (16px, dark grey, ~38px gaps).
- Right: Schedule, Join, "Host" with chevron, "Web App" with chevron (16px, medium weight, darker), then the
  profile avatar: 32px rounded square (radius ~6), purple, white initial letter "m".
- **Hover [user-reported]:** Products, Solutions, Resources and Plans & Pricing turn brand blue on hover. Hover of
  Schedule / Join / Host / Web App not reported yet (build the same blue-on-hover). Dropdown contents of Host and
  Web App not seen yet (only chevrons).

**C. Left sidebar** (300px, light grey-lavender):
- "Home": selected state = rounded pill (radius ~8) with soft blue background, blue text.
- Small grey label "My Products", then items (15-16px, dark): AI (New badge + external-link icon), Meetings,
  Recordings, Summaries, Hub (New + ext icon), Whiteboards (ext), Notes, Clips (ext), Canvas (ext), Paper (ext),
  Sheets (ext), Slides (ext), Tasks (ext), Scheduler (ext), Discover More Products.
- Then three collapsible groups with a right-pointing chevron on the left: My Account, Admin, Support.
- External-link icon = small square-with-arrow, grey, right-aligned in the row. "New" = small rounded pill.

**D. Profile card** (left column, top): avatar 78px rounded square (radius ~10), purple, large white initial.
Next to it: name bold ~24px ("mitul goyal"); below: "Plan:" in grey + "Workplace Basic" in dark. Top-right: pill button
"Manage Plan" (soft blue-grey bg, brand-blue text, radius 8, ~32px high). Bottom-right: text link "View Plan Details" (blue).

**E. Promo card** (left column, middle): small blue Zoom icon + "Workplace Pro" in brand blue (bold ~22px);
"Upgrade and save!" bold ~26px; grey paragraph; filled blue button "Upgrade today" (~124x32, radius 8, white text);
on the right a ~214px rounded (radius ~12) dark-blue illustration of a video call. Marketing only.

**F. Recent activity card** (left column, bottom): title "Recent activity" (bold ~26px), thin divider under it.
Row of 3 bordered pill-cards (radius ~12), each with a coloured icon square + bold label: Recordings (red), Summaries (violet),
My Notes (purple). Below, stacked item cards (border 1px, radius ~12, padding ~24): left a thumbnail box (~160x160, bordered,
centered icon), right: blue bold title link, "Created by <name>", "Last viewed 9 months ago" (all ~15px), a red outlined
"Canvas" tag at bottom-right, and a blue "..." (three dots) menu button at top-right.

**G. Quick actions card** (right column, top): three tiles in a row, each a 50px rounded-square icon (white glyph) with a
~16px label centred under it:
- **Host**: orange tile, white video-camera icon.
- **Join**: blue tile, white "+" in a rounded square.
- **Schedule**: blue tile, white calendar icon showing "19".
Below a divider-less gap: "**Personal Meeting ID**" (bold label) + number formatted `### ### ####` + a copy icon button.
Then a thin divider, then "**Booking links**" (bold), then three small bordered tiles (radius ~8): View links,
Create page, Meeting poll, each a blue outline icon over a grey ~13px label.

**H. Meetings card** (right column, below G): title "Meetings" (bold ~26px) with a blue "Visit Meetings" link on the right.
Below it a soft-blue-grey rounded box (radius 8, ~40px high) with bold "No Upcoming Meetings" - this is the **empty state**.
Below that a centred soft-blue pill button "Test Audio and Video" (brand-blue text).

**I. Floating chat button**: 56px brand-blue circle, white chat-bubble icon, fixed bottom-right (~28px from edges).

**J. Footer** (dark slate): 4 link columns (About, Download, Sales, Support) + a 5th column with a "Language" select
("English" with caret), "Currency" select ("Indian Rupee Rs" with caret) and 6 circular social icons; bottom line with
copyright and legal links separated by thin vertical bars. White text, ~15px.

**Build notes (how this maps to our app)**

| Zoom element | In our clone | Data source |
|---|---|---|
| Utility bar + navbar + avatar | build as shown; links are placeholders, avatar opens a placeholder profile/settings menu | `GET /api/me` (initial, avatar_color) |
| Sidebar | build the full list as static placeholders; only Home is active/clickable | static array |
| Profile card | build; "Plan: Workplace Basic" is static text, Manage Plan / View Plan Details are placeholders | `GET /api/me` |
| Quick actions: Host / Join / Schedule | **the three required buttons**: orange tile = instant meeting, blue Join = join dialog, blue Schedule = schedule dialog | `POST /instant`, modals |
| Meetings card (empty state + list) | **Upcoming meetings section**: same card, same empty state "No Upcoming Meetings"; when data exists show MeetingCards in the card instead of the empty box | `GET /api/meetings/upcoming` |
| Recent activity card | **Recent meetings section**: same card style (title, divider, stacked item cards with blue title link, meta lines, "..." menu); replaces Zoom Docs/recordings items | `GET /api/meetings/recent` |
| Promo card | optional, static, lowest priority (skip if time is short) | none |
| Personal Meeting ID, Booking links | placeholders only (not in our schema) | none |
| Chat button | static decoration | none |
| Footer | optional, simplified, lowest priority | none |

**Screenshot 4 (Chrome Network tab, CSS filter):** shows Zoom serves ~30 separate hashed CSS bundles (internal design-system
files named zoom-ui, zoom-fusion, app-common ...). Not used for the build: values are taken from the screenshots instead
(see CLAUDE.md: we write our own Tailwind, no copied CSS).

### 3.2 Schedule meeting form (zoom.us/meeting/schedule) - ANALYSED

A **full page**, not a modal: same utility bar, navbar, sidebar and footer as the dashboard. Sidebar differences here:
"**Meetings**" is the active item (blue text, soft blue pill) and "Home" is plain; below "My Account / Admin / Support"
there is a centred outlined pill button "Upgrade to Pro" (star icon, light cyan bg ~`#E4F7FF`, cyan-blue border, blue
text, ~146x32). The content area is white (no cards), content starts ~32px right of the sidebar.

**Top of page**
- "< Back to Meetings": blue link, chevron-left icon, 15px.
- Title "Schedule Meeting": bold ~22px, left aligned, ~24px below the link.

**Form layout:** a two-column grid of rows. **Label column 170px wide** (15px, dark, vertically centred on the control),
**field column** after it. Rows are ~24px apart. Required fields have a **red asterisk before the label** (Topic only).

| Row (label) | Control and exact content | Size (CSS px) |
|---|---|---|
| **Topic*** | text input, value "My Meeting" (Zoom's default topic) | 490 x 32 |
| _(blank label)_ | blue link "+ Add Description" (plus icon); presumably reveals a textarea (not seen) | text link |
| **When** | 3 controls in a row, 12px gap: date input "11/11/2026" (MM/DD/YYYY, calendar icon on the right) 240 wide; time select "5:30" with chevron 195 wide; AM/PM select "PM" 103 wide. All 32 high | see left |
| _(below When)_ | soft info bar (bg ~`#F2F4FA`, radius 12, 522 x 40): blue calendar-clock icon, "Let your invitee pick a time instead.", pill button on the right "Share booking link" + arrow-out icon | 522 x 40 |
| **Duration** | select "0" (disabled, grey) + text "hr" + select "40" + text "min"; both selects 150 wide | 32 high |
| _(below Duration)_ | amber notice box, 810 x 75: warning triangle + "You can schedule meetings for up to 40 minutes each with your current Basic plan. Need more time?" and blue link "Upgrade to Zoom Workplace Pro" on the 2nd line | |
| **Time Zone** | select "(GMT+5:30) India", chevron | 490 x 32 |
| _(below)_ | checkbox (unchecked) "Recurring meeting" | |
| **Invitees** | text input, placeholder "Enter user names or email addresses" | 490 x 32 |
| _(below)_ | amber notice box: "Participants won't receive this meeting invite until your calendar is connected." + blue link "Connect calendar" | 810 wide |
| **Meeting ID** | two radios in a row: (selected) "Generate Automatically", ( ) "Personal Meeting ID ### ### ####" | |
| **Template** | select, placeholder "Select a template" (grey text), chevron | 490 x 32 |
| **Whiteboard** (i) | soft button "Add Whiteboard" with whiteboard icon | 32 high |
| **Docs** | soft button "Add Docs" with doc icon | 32 high |
| **Security** | checkbox "Passcode" (**checked and disabled**, pale blue) + text input with the passcode (6 letters/digits, e.g. `Cbi37d`, 200 wide) + grey helper line "Only users who have the invite link or passcode can join the meeting"; below, checkbox "Waiting Room" (unchecked) + helper "Only users admitted by the host can join the meeting" | |
| _(divider)_ | full-width 1px line | |
| **Encryption** | radios: (selected) green shield-check icon "Enhanced encryption" (i), ( ) green shield icon "End-to-end encryption" (i) | |
| **Zoom AI** | bold sub-heading "Zoom AI"; checkbox "Automatically start Zoom AI" (i); two indented checkboxes "Automatically start meeting questions", "Automatically start meeting summary"; line "Enable and auto-start summaries and questions for this and all future meetings." (first words are a blue link) | |
| **Workflow** | blue link "Attach workflow to this meeting" | |
| **My Notes** | checked "Allow participants to transcribe meeting with My Notes"; indented radios "Only participants in your organization" and (selected) "All participants" | |
| **Meeting chat** | checked "Allow users to access meeting chats before and after the meeting" | |
| **Video** | sub-rows "Host" and "Participant", each with radios (selected) "on" / "off" | |
| **Options** | blue link "Show" (expands more options, not seen) | |
| **Interpretation** | checkbox "Select sign language interpretation video channels below. You can assign interpreters at any time." | |

**Buttons** (left-aligned under the label column, ~24px below the last row): **Save** = filled brand blue, white text,
~60 x 32, radius 8; **Cancel** = soft button (bg ~`#F2F4FA`, blue text) ~73 x 32, 8px gap. Then the footer.

**Behaviour seen / inferred**
- Passcode is generated by Zoom and shown in the field; on this (Basic) plan the checkbox is forced on.
- The 40-minute notice appears because the account is on the Basic plan.
- Date is typed or picked via the calendar icon; time uses two dropdowns (hh:mm and AM/PM).
- **Date picker popup [captured]:** opens under the date field: white card, radius ~16, soft shadow, ~230px wide. Header row:
  double-chevron-left, chevron-left, bold "November 2026", chevron-right, double-chevron-right (previous/next month and year).
  Weekday row S M T W T F S (grey). Day grid of 6 rows; **past days are light grey and disabled**, today is bold blue with a
  blue circle and square outline, future days dark, days of the neighbouring months medium grey. Date text format in the
  field is MM/DD/YYYY.
- **Time dropdown [captured]:** a combobox you can also type in. Options in **15-minute steps** (4:45, 5:00, 5:15, 5:30 ...).
  The selected option has a grey background, a check mark on the right and a thin blue bar on the left; the list is a rounded
  white popover with a shadow. The AM/PM dropdown looks the same.
- What happens after Save (Zoom shows a meeting details page) was **not captured**.

**Build notes (how this maps to our app)**

Our API (`POST /api/meetings/schedule`) accepts: `title`, `description`, `scheduled_start`, `duration_minutes` (1-1440),
`has_passcode`. Recommended scope for the form:

| Tier | Rows | Why |
|---|---|---|
| **Functional (send to API)** | Topic (default "My Meeting"), Add Description (reveals textarea), When (date + time + AM/PM, combined into one ISO start in the browser time zone), Duration (hr + min, summed to minutes), Passcode checkbox | exactly the brief's must-have fields |
| **Visual only (static, look right, do nothing)** | Time Zone (show the browser time zone as the only option), Meeting ID radios (Generate Automatically selected), Waiting Room checkbox, Video Host/Participant radios, Save, Cancel, Back to Meetings | keeps the page looking like Zoom without extra backend work |
| **Skip** | Plan/calendar notice boxes, booking-link bar, Recurring, Invitees, Template, Whiteboard, Docs, Encryption, Zoom AI, Workflow, My Notes, Meeting chat, Options, Interpretation, Upgrade to Pro pill | Zoom product features outside the assignment (see open question 8) |

- Save: validate (title required, start not in the past), `POST /schedule`, then go to the dashboard where the meeting
  appears in Upcoming (or to the post-save details page once we have its screenshot).
- Cancel / Back to Meetings: back to the dashboard.
- The 40-minute notice would be wrong for our 24h limit, so it is not built.


### 3.2.1 Meeting details page (zoom.us/meeting/{meeting ID}) - ANALYSED (top and bottom)

The page Zoom opens **right after Save** (and when you click a meeting in the list). URL pattern:
`/meeting/{11-digit meeting ID}` (Zoom adds an extra `?meetingMasterEventId=...` we do not need).
Same shell as the schedule page (utility bar, navbar, sidebar with the "Upgrade to Pro" pill, footer). It is a **read-only view**
of the meeting: plain text values, no inputs.

**Lower rows.** Same two-column rows as the form, but the label column is 160px and the block starts
~16px further right than on the form page. Row spacing ~54px; sub-rows (Host / Participant) ~30px apart. Text 15px, dark;
secondary text grey.

| Row (label) | Value shown |
|---|---|
| **Encryption** | green shield-check icon + "Enhanced encryption" |
| **My Notes** | "Allow participants to transcribe meeting with My Notes", second line in grey: "All participants" |
| **Meeting chat** | "Allow users to access meeting chats before and after the meeting" |
| **Video** | two sub-rows, sub-label then value in a second column: "Host" ... "on", "Participant" ... "on" |
| **Options** | "Allow participants to join anytime" |

**Button row / sticky bar** (left-aligned under the label column; all 32px high, radius 8, 10px gaps):
**Start** = filled brand blue, white text, ~66 wide | **Copy Invitation** = outlined (white, 1px border ~`#D9DCE5`),
copy icon + text, ~154 wide | **Edit** = outlined, ~61 wide | **Delete** = outlined, ~79 wide.
At the far right of the same row: **Save as Template** = outlined, ~154 wide.

**Top of the page (second screenshot, scrolled to the top)**
- **Breadcrumb** (15px, ~40px below the navbar): blue link "My Meetings", a small chevron, then dark text `Manage "<topic>"`
  (e.g. `Manage "My Meeting"`). There is no big page title.
- **Tabs** (~32px high, 20px side padding, ~22px below the breadcrumb): "**Details**" selected = soft blue pill (radius 8,
  bg ~`#EBF0FA`, blue text), "**Attachments**" = plain dark text (its content was not captured).
- **Rows** (label column 160px, 15px; rows ~52px apart; values are plain text):

| Row (label) | Value shown |
|---|---|
| **Topic** | the topic, e.g. "My Meeting" |
| **Time** | `MMM d, yyyy hh:mm a <zone name>`, e.g. "Nov 11, 2026 05:30 PM India" (start time only, no duration) |
| **Meeting ID** | 11 digits as `### #### ####` (e.g. `123 4567 8901`) |
| **Security** | a tick, "Passcode", the passcode hidden as 8 asterisks, and a blue link "Show" that reveals it |
| **Invite Link** | one long blue link `https://<zoom host>/j/<11-digit ID>?pwd=<long token>` followed by a dark filled "copy" icon button |
| **Add to** | three icon + blue-link items: "Google Calendar", "Outlook Calendar (.ics)", "Yahoo Calendar" |

  Then a thin divider line (from the value column to the right edge), then the Encryption row and the lower rows listed above.
- **Sticky action bar:** the button row (Start / Copy Invitation / Edit / Delete, and Save as Template on the right) is
  **pinned to the bottom of the browser window** with a thin top border while the page is long, and sits at the end of
  the content once you have scrolled down. The floating chat button overlaps its right end.


**Build notes (how this maps to our app)**
- **Route:** Zoom uses `/meeting/{id}` for this page. We have reserved that path for the live room, so the decision is:
  details page = `/meeting/[code]` (like Zoom), live room = `/room/[code]` (see open question 12).
- **Start** opens the pre-join screen as host (`/join/{code}?host=1`). **Copy Invitation** copies Zoom's invitation text
  (topic, time, join link, meeting ID, passcode) built in the browser from the meeting data.
- **Needs a new backend endpoint:** the page must show the passcode and invite link, which the public
  `GET /api/meetings/{code}` hides on purpose. Proposed `GET /api/meetings/{code}/details` returning the host view
  (`HostMeeting`), allowed only for the meeting's host (403 otherwise).
- **Edit and Delete:** the backend has neither. Delete is small (`DELETE /api/meetings/{code}`, host only; participants
  are removed by the database cascade). Edit is bigger (a PATCH endpoint plus reusing the schedule form in edit mode).
  See open question 13.
- **Visual-only static rows** (Encryption, My Notes, Meeting chat, Video, Options): fixed text exactly as above; they are
  not stored in our database. **Save as Template:** placeholder button that does nothing.

### 3.2.2 Meetings list page (zoom.us/meeting#/upcoming) - ANALYSED (Upcoming tab)

Opened by the sidebar's "Meetings" item and the dashboard's "Visit Meetings" link. Same shell as the schedule page
(sidebar highlights "Meetings", "Upgrade to Pro" pill under the groups, footer). Content starts ~32px right of the sidebar.
Zoom keeps the tab in the URL hash (`#/upcoming`).

**Header row**
- Left: title "**Meetings**", bold ~24px.
- Right, 12px apart: a soft grey button "**Booking pages**" (calendar icon, small 14px text, chevron-down, radius 8, 32px high,
  ~140 wide) and the primary **split button** "**+ Schedule a Meeting**": brand blue, white 15px medium text, ~218 wide,
  32px high, radius 8, a thin divider and a chevron-down part on its right end.

**Plan notice bar** (full width, bg ~`#F5F6FA`, radius 12, padding ~10px 12px, 15px text): "Your current Basic plan allows you
to schedule meetings for up to 40 minutes each. Upgrade to Zoom Workplace Pro ..." plus a blue link "Discover Zoom Workplace Pro".

**Tabs** (~20px text, 32px gaps, a 1px grey line under the whole row): "**Upcoming**" (selected: brand-blue text and a 2px blue
underline), "Previous", "Attachments", "Personal Room", "Meeting Templates", "Meeting Agendas" (dark grey, regular).

**Date range filter** (~24px below the tabs): an outlined box 270 x 32 (1px border, radius 8) with a calendar icon and the
text `11-11-2026   to   02-11-2027` (MM-DD-YYYY, default range = today until about 3 months ahead), and a small grey
"?" help icon just to its right.

**List** (~24px below the filter), grouped by day:
- **Day header:** a full-width soft bar (bg ~`#F7F8FA`, radius 8, ~40px high) with bold 15px text "**Today**".
  (Labels for other days were not captured; assumed a date such as "Thu, Nov 12".)
- **Meeting row** (~16px padding, two columns):
  - Left column (~240px): bold 16px time range `05:30 PM - 06:10 PM` (start to start+duration), and under it a soft box
    "Need more meeting time?" with a blue link "Upgrade to Zoom Workplace Pro" (plan upsell).
  - Right column: bold 16px title (e.g. "My Meeting"), under it grey 15px `Meeting ID: ### #### ####` (e.g. `123 4567 8901`).
  - The title is presumably the link to the details page (section 3.2.1). Hover state and any row buttons not captured.
- After the last row there is empty space, then a thin divider.

**Bottom block** (below the list, above the footer): text "Save time by scheduling your meetings directly from your
calendar." with two items side by side: Outlook icon + "Microsoft Outlook Plugin" + blue "Download" link, and Chrome icon +
"Chrome Extension" + blue "Download" link.

**Build notes (how this maps to our app)**
- **Route:** `/meeting` (Zoom's `zoom.us/meeting`). The sidebar "Meetings" item and the dashboard "Visit Meetings" link go here.
  It sits next to `/meeting/schedule` and `/meeting/[code]` without clashing (the static segment wins).
- **Functional:** Upcoming tab (`GET /api/meetings/upcoming`) and Previous tab (`GET /api/meetings/recent`), grouped by local
  day with Today / date headers, rows showing time range, title and meeting ID, row click opens `/meeting/{code}`.
  "Schedule a Meeting" button opens `/meeting/schedule`.
- **Visual only (inert):** the other four tabs, "Booking pages", the split-button chevron, the date range box (shows the default
  range, does not filter) and the "?" icon.
- **Skip:** the Basic-plan notice bar, the "Need more meeting time?" box and the Outlook/Chrome block (Zoom marketing; the
  40-minute text would be false for us).
- The Previous tab was not captured; build it with the same layout and the Recent data (see open question 19).

### 3.3 Join meeting page (zoom.us/join) - ANALYSED

A **minimal page**: no black utility bar, no sidebar, no cards.
- **Header** (white, ~64px, bottom border): the logo on the left; on the right "Support", "Schedule", "Join", "Host" (chevron),
  "Web App" (chevron) and the profile avatar (32px rounded square).
- **Centre column** (~360px wide, centred, starts ~90px below the header):
  - Title "**Join Meeting**", bold ~28px, centred.
  - Label "Meeting ID or Personal Link Name" (15px, dark), ~40px below the title.
  - Text input 361 x 42, radius 10, **focused by default with a blue border and soft blue glow**; placeholder
    "Enter Meeting ID or Personal Link Name" (grey).
  - Checkbox "Always join from browser" (15px) under the input.
  - Button "**Join**", full input width, 38px high, radius 8, **disabled grey (bg ~`#ECEDF2`, grey text) while the input is
    empty**; presumably brand blue when filled (not captured).
  - ~70px lower, a centred blue link "Join a meeting from an H.323/SIP room system".
- **Footer line** at the bottom: "(c) 2026 Zoom Communications, Inc. All rights reserved. Privacy & Legal Policies" (grey 15px)
  and a blue "English" dropdown link. The floating chat button is present.

**Build notes:** route `/join` with its own light layout (logo header + copyright line, no sidebar). Functional: input, Join button
(disabled while empty). Accepts a meeting ID with spaces/dashes **or a pasted invite link** (extract the 11 digits and keep `?pwd=`).
On Join: validate with `GET /api/meetings/{code}` (404 shows the backend's "Meeting not found..." message under the input), then
go to the pre-join screen `/join/{code}`. Inert: "Always join from browser", the H.323/SIP link, "English".

### 3.3.1 Join launch page (zoom.us/s/{meeting ID}) - ANALYSED

The page Zoom shows after entering an ID or opening an invite link. Header: logo (larger, left) and, on the right, blue links
"Support" and "English" (chevron). Centred column (~400px wide):
- Title "**Join meeting**", bold ~28px.
- Filled blue button "**Join from Zoom Workplace app**", 400 x 48, radius 8, white 17px medium text.
- Outlined button "**Join from browser**", same size, white with a thin dark border.
- Text "Don't have the Zoom Workplace app installed?" + blue link "Download Now".
- Text "By joining a meeting, you agree to our" + blue links "Terms of Service" and "Privacy Statement".
- Footer: copyright line plus a row of legal links separated by thin bars. Chat button present.

**Build notes:** this is a desktop-app hand-off that does not exist in a clone. Recommended: **skip this page** and go straight from
`/join` (or an invite link) to the pre-join screen. If time remains, build it as a static page where "Join from browser"
goes to the pre-join screen (see open question 22).

### 3.4 Pre-join screen
**Not captured.** The new screenshots show the room directly (after the launch page and the browser-join step). The camera
preview, name field and mic/camera toggles of Zoom's pre-join step were not shown (open question 23).

### 3.5 Meeting room (full-screen view) - ANALYSED

A dark, full-window page with **no website header or sidebar**.
- **Top bar** (black, ~48px high): left = a dark rounded pill with an (i) info icon and the meeting topic in bold white 14px
  (e.g. "My Meeting"). Right = small white icons ~20px apart: a **green shield with a check** (encryption), a pencil/draw icon,
  a sparkle (AI) icon, a thin vertical divider, a grid "view" icon, and a small dark circle with "zm".
- **Stage** (fills the space, near-black bg ~`#1C1C1C`): with the camera off, each person is a **square avatar tile**
  (~96px, the user's avatar colour, big lowercase white initial) centred on the stage. Bottom-left of the stage: a small dark
  name tag with the person's name and a **red slashed microphone** when muted.
- **Bottom control bar** (black, ~50px high). Every button = a 24px icon over a ~11px light label:
  - left group: **Unmute / Mute** (microphone, red slash when muted, small chevron-up beside it) and **Video** (camera, red
    slash when off, chevron-up);
  - centre group: **Participants** (people icon with a small count badge "1" and chevron), **Chat** (chevron), **React** (heart),
    **Share** (up-arrow in a box, chevron), **Host tools** (shield), **More** (three dots in a circle);
  - right: **End** = red icon (white X in a red rounded hexagon) with the label "End".
- The line "To exit full screen, press Esc" is browser UI, not part of the design.

### 3.5.1 End / Leave menu (web-client view) - ANALYSED

Zoom's web client also wraps the room in the "Workplace" shell (top bar with logo, "Discover products", "Pricing", a search box,
"Admin Center", "Download", a blue "Upgrade" button, bell, avatar; plus a narrow left rail Home / Chat / Calendar / Contacts /
More / Settings). **Recommended: skip that shell** and use the full-screen look above. The useful part is what **End** opens:
a dark popover (bg ~`#232323`, radius 12, padding 12, ~240px wide) anchored at the bottom-right above the bar with two full-width
buttons: "**End Meeting for All**" (red, white text) and "**Leave Meeting**" (dark grey, white text). Below it, on the bar level:
a "Give feedback" checkbox and a dark "**Cancel**" button.

**Build notes for the room (not built yet)**
- Route: `/room/[code]` (outside the website shell, in the `(meeting)` group). Needs the participant id from the pre-join step.
- **Functional:** Mute/Unmute (PATCH self mute), Video (local camera on/off), Participants (opens a panel, polls the list, shows
  the count badge), Share (copies the invite link, as in CLAUDE.md), End/Leave (calls `leave`; for the host the meeting ends).
  Name tag and avatar tile come from the participant list. Participants who are removed or whose meeting ended see a message.
- **Host only:** "Host tools" (mute all, remove in the panel). For a guest, the End button reads "Leave" and shows only
  "Leave Meeting".
- **Inert:** Chat, React, More, the chevrons, the top-right icons, "Give feedback".
- **Host leaving:** our backend ends the meeting when the host leaves, so for the host both menu buttons would do the same thing
  (see open question 24).
- **Not captured yet:** the Participants side panel (with host controls), the Host tools menu, the muted/unmuted tile with a
  live camera, a second participant's tile layout (open question 25).

### 3.6 Small states
(meeting card actions, empty states, "meeting has ended", "you were removed")

_Not analysed yet._

---

## 4. Component inventory

Each component lives in `frontend/components/`.

| Component | Used on | Notes |
|---|---|---|
| TopUtilityBar | all pages | black strip, placeholder links |
| Navbar | all pages | logo, nav links, Schedule/Join/Host/Web App, avatar menu placeholder |
| SidebarNav | dashboard | static product list, active "Home", "New" badges, ext-link icons, collapsible groups |
| ProfileCard | dashboard | avatar, name, plan text, 2 placeholder actions |
| ActionTile | dashboard | 50px coloured icon tile + label (Host orange, Join blue, Schedule blue) |
| QuickActionsCard | dashboard | 3 ActionTiles + Personal Meeting ID row + Booking links (placeholders) |
| MeetingsCard | dashboard | "Meetings" title, Visit link, Upcoming list or empty state, Test Audio and Video button |
| RecentMeetingsCard | dashboard | "Recent activity"-style card listing recent meetings |
| MeetingCard | dashboard | one meeting row/card (title link, host, time, "..." menu) |
| Avatar | navbar, profile, participants | rounded square or circle with initial + avatar_color |
| ChatFab | all pages | floating blue circle |
| Footer | all pages | optional |
| Modal | join dialog | _details after screen 3.3_ (the schedule form is a full page, not a modal) |
| FormRow | schedule form | 170px label column + field column, optional red asterisk |
| TextInput / SelectInput / DateInput | schedule form | 32px high, radius 8, 1px border, chevron or calendar icon |
| Checkbox / RadioOption | schedule form | custom 16px styles (see tokens) |
| NoticeBox | schedule form | amber warning style (and soft blue info style) |
| SoftButton / PrimaryButton | forms, dashboard | soft blue-grey vs filled brand blue |
| BackLink | schedule form, later screens | blue "< Back to Meetings" |
| PageTabs | meetings list, details page | text tabs with a blue underline (list) or a soft blue pill (details) |
| SplitButton | meetings list | blue "+ Schedule a Meeting" with a chevron part |
| DayGroupHeader / MeetingListRow | meetings list | soft day bar; time range + title + meeting ID row |
| SimpleHeader / SimpleFooter | join page | logo + links header, copyright footer; no sidebar |
| JoinMeetingForm | join page | ID input, disabled-until-filled Join button, validation message |
| ControlBarButton | meeting room | icon over label, red slash when off, optional chevron and badge |
| ParticipantTile | meeting room | square avatar tile or camera feed with name tag |
| DateRangeField | meetings list | outlined box with calendar icon and `MM-DD-YYYY to MM-DD-YYYY` (visual only) |

## 5. Open questions / things to confirm
1. ~~Display scale~~ **RESOLVED:** `window.devicePixelRatio` = 1.25 and browser zoom = 100%, so `CSS px = screenshot px / 1.25`
   and every CSS px value in this file is correct. (A black outline in one re-taken screenshot is a focus ring, ignore it.)
2. **Sidebar:** build the full product list (matches Zoom, all placeholders) or a short list (Home, Meetings, Recordings)? Recommended: full list, it is just a static array.
3. **Label under the orange tile:** Zoom web says "Host"; the assignment says "New Meeting". Recommended: "New Meeting".
4. **Promo card, Personal Meeting ID, Booking links, footer:** include as static placeholders, or skip? Recommended: skip promo and footer unless time remains; include PMI/Booking links as static placeholders since they fill the quick-actions card.
5. **Colours to measure** (dev tools > Computed): utility bar background, sidebar background, orange tile, main text, grey text, footer background.
6. **Default user avatar colour:** Zoom screenshot shows purple; our seed uses blue `#0B5CFF`. Recommended: change seed to purple.
7. Hover states of Schedule / Join / Host / Web App, Host / Web App dropdown contents, and mobile layout have not been seen.
8. **Schedule form scope:** build the 3 tiers above (functional / visual-only / skip)? Recommended: yes.
9. **Date and time pickers:** now captured (section 3.2). Recommended for the 1-day deadline: native date input styled like
   Zoom's field and two selects for hh:mm (15-minute steps, as in Zoom) / AM-PM. A custom calendar popup that copies the
   screenshot only if time remains.
10. **Passcode row:** Zoom shows the generated passcode in an editable field. Our server generates it on save. Recommended:
    keep the checkbox (checked, togglable since our API supports no passcode) and show the field read-only with
    "Generated when you save". Alternative: add an optional passcode field to the API (small backend change).
11. **Screenshots still needed for this screen:** (a) the details page: DONE, top and bottom received (section 3.2.1),
    (b) the Meetings list page: DONE (section 3.2.2),
    (c) the date picker and time dropdown: DONE (section 3.2); the duration dropdown was not captured (assumed same style).

12. **Route names:** details page `/meeting/[code]` (matches Zoom's URL) and live room `/room/[code]`. Recommended: yes.
13. **Edit and Delete on the details page:** recommended: build Delete for real (small backend endpoint plus a confirm
    dialog), show Edit as a visible button that does nothing yet (or hide it). Edit-for-real only if time remains.
14. **Details endpoint:** add `GET /api/meetings/{code}/details` (host view, 403 for non-hosts) so the page can show the
    passcode and invite link after a reload. Recommended: yes.
15. **Time label on the details page:** Zoom shows the zone as a name ("India"). Browsers only give raw names
    ("Asia/Calcutta"). Recommended: show the offset, e.g. "Nov 11, 2026 05:30 PM (GMT+5:30)".
16. **"Add to" calendar links and the Attachments tab:** recommended: static placeholders that do nothing
    (the Attachments tab shows an empty state).
17. **Invite link shape:** Zoom uses `/j/<id>?pwd=<token>`; ours is `/join/<id>?pwd=<passcode>`. Recommended: keep ours.
    The Show link on the passcode row and the copy button on the invite link should work (small client-side code).

18. **Meetings list route and tabs:** `/meeting` with working Upcoming and Previous tabs, other tabs inert. Recommended: yes.
19. **Previous tab:** not captured. Recommended: same layout with past meetings (newest first, grouped by day). Optional:
    send a screenshot of Zoom's Previous tab if you want it exact.
20. **Date range filter:** recommended: visual only (shows today to +3 months, does not filter).
21. **Skip on the list page:** plan notice bar, "Need more meeting time?" box, Outlook/Chrome block. Recommended: skip.

22. **Join launch page** ("Join from Zoom Workplace app / Join from browser"): recommended: skip, go straight to pre-join.
23. **Pre-join screen:** not captured. Recommended: build from the CLAUDE.md scope (camera preview, name field, mic/camera
    toggles, Join button) in a clean light style that matches the join page. Send Zoom's pre-join screenshot if you want it exact.
24. **Host "Leave Meeting":** in Zoom the host can leave without ending the meeting; our backend ends it. Recommended: host sees
    both buttons, both call `leave` (the meeting ends); a note in the README explains the simplification.
25. **Room screenshots still needed:** Participants panel (host controls), Host tools menu, a tile with live camera.

### Decisions taken while building (recommended options, change if you disagree)
- Sidebar: full static product list. Tile label: "New Meeting". Promo card and footer: skipped.
- Personal Meeting ID and Booking links: static placeholders (sample ID, not a real one).
- Default avatar colour: purple `#A94BC0` (seed changed).
- Schedule form scope: functional / visual-only / skip tiers (section 3.2); native date input + two selects; passcode
  checkbox plus read-only "Generated when you save" field.
- Dashboard built from this analysis; verified against the reference at 1536 CSS px wide / 1.25 scale (see components/).

## 6. Change log
- Created empty template.
- Added global tokens, layout and full dashboard analysis from 4 screenshots (3 dashboard scroll positions + 1 network tab).
- Added schedule form analysis (screens 6-9: 4 screenshots), form tokens, component rows, open questions 8-11,
  and the nav hover note (user-reported).
- A 5th screenshot (dashboard at browser zoom 100%) was identical to the first: no value changed. Scale check done: devicePixelRatio = 1.25, assumption confirmed.
- Dashboard built in the frontend (shell, quick actions, Upcoming, Recent). Fixed: nowrap on tile labels, sidebar group indent,
  logo size, FAB offset, sidebar spacing after side-by-side comparison with the screenshot.
- Added meeting details page analysis (bottom half only: screens 10-11 were identical uploads), open questions 12-14,
  and the route conflict `/meeting/[code]` (details) vs live room (`/room/[code]`).
- Completed the meeting details page analysis with the top half (breadcrumb, tabs, Topic/Time/Meeting ID/Security/Invite Link/Add to rows, sticky action bar). Real meeting ID, link and token were deliberately not recorded.
- Added Meetings list page analysis (Upcoming tab, section 3.2.2), component rows and open questions 18-21. A real meeting ID visible in the screenshot was deliberately not recorded.
- Added join page, join launch page, meeting room (full-screen view) and End/Leave menu analysis; captured the date picker
  and time dropdown (screens 15-20). A meeting ID and a password token visible in those URLs were deliberately not recorded.
- Corrected: the Meetings list date range is MM-DD-YYYY (02-11-2027 = Feb 11, today + 3 months), not DD-MM-YYYY.
