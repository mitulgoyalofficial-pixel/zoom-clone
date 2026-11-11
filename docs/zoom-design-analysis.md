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
- Date is typed or picked via the calendar icon; time uses two dropdowns (hh:mm and AM/PM). Dropdown option lists and the
  calendar popup were **not captured**.
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


### 3.3 Join meeting dialog
_Not analysed yet._

### 3.4 Pre-join screen
_Not analysed yet._

### 3.5 Meeting room
_Not analysed yet._

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
9. **Date and time pickers:** Zoom uses a custom calendar popup. Recommended for the 1-day deadline: native date input
   styled like Zoom's field (plus calendar icon) and two selects for hh:mm / AM-PM. Custom popup only if time remains.
10. **Passcode row:** Zoom shows the generated passcode in an editable field. Our server generates it on save. Recommended:
    keep the checkbox (checked, togglable since our API supports no passcode) and show the field read-only with
    "Generated when you save". Alternative: add an optional passcode field to the API (small backend change).
11. **Screenshots still needed for this screen:** (a) the page right after clicking Save (meeting details: link, passcode, Start,
    Copy invitation, Edit, Delete), (b) the Meetings list page (zoom.us/meeting, Upcoming tab) that "Visit Meetings"
    opens, (c) the time dropdown, duration dropdown and date picker open.

## 6. Change log
- Created empty template.
- Added global tokens, layout and full dashboard analysis from 4 screenshots (3 dashboard scroll positions + 1 network tab).
- Added schedule form analysis (screens 6-9: 4 screenshots), form tokens, component rows, open questions 8-11,
  and the nav hover note (user-reported).
- A 5th screenshot (dashboard at browser zoom 100%) was identical to the first: no value changed. Scale check done: devicePixelRatio = 1.25, assumption confirmed.
