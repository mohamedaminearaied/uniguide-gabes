# UniGuide Gabès — Start-From-Zero Guide (web version)

A secure, installable website that helps students in Gabès find useful places on a map.
**Website + installable app on phones (PWA) · Express API · Supabase (database + logins) · Brevo (emails).**
Languages: العربية (right-to-left) · Français · English.

> The Flutter mobile app has been **removed**. The mobile version is the website itself: students open the link, tap **Install app**, and it behaves like an app (section 13). It works on Android and iPhone.

---

## How to read this guide

Do the parts **in order**. Each part ends with a ✅ check, so you know it worked before you continue.

| Part | What you do | Time |
|---|---|---|
| 0 | **Start from zero:** what to install, which accounts, where to put the folder | 20 min |
| 1 | Understand what you are building and what you need | 5 min |
| 2 | Install tools on your PC | 10 min |
| 3 | Put the project on your PC | 5 min |
| 4 | Create the **new Supabase project** | 10 min |
| 5 | Create the database tables | 5 min |
| 6 | Set up **Brevo** (emails) | 15 min |
| 7 | Fill the **env files** (with the wizard) | 5 min |
| 8 | Run it and test it | 5 min |
| 9 | Create your admin account | 5 min |
| 10 | Add real places | – |
| 11 | Security: what is built, what you must do | 10 min |
| 12 | Put it online | 30 min |
| 13 | Install it on phones | 5 min |
| 14–16 | Final checklist · troubleshooting · reference | – |

**What was tested by me and what was not**

| Tested by me (real PostgreSQL + PostGIS, real signed login tokens, builds) | Not tested by me (I cannot reach them) |
|---|---|
| Database scripts, API behavior, 23 security tests (forged, expired, banned and deleted-user tokens, bad input, admin-only routes), setup wizard, production builds of API and website, security headers, 0 known vulnerabilities in `npm audit` | Your live Supabase and Brevo accounts, real emails arriving, how the screens look on your phone. Parts 8 and 14 let you verify these yourself |

---

## Part 0 — Start from zero (read this first)

You said you forgot where the old version is and which tools you used. **You do not need the old version.** This zip is a complete, clean copy. Start fresh and ignore the old folder (the old one had no real data worth keeping: nothing was ever seeded).

### 0.1 Everything you will use (the full inventory)

**Software on your PC (install once)**

| Software | What it is for | Cost | Required? |
|---|---|---|---|
| **Windows 10/11** | Your computer | – | You already have it |
| **Node.js LTS** (includes `npm`) | Runs the website and the API, installs packages | Free | **Yes** |
| **Git** | Stores versions of your code and uploads it to GitHub | Free | **Yes** (needed for going online) |
| **Google Chrome** (or Edge) | Open and test the website | Free | Yes (you probably have one) |
| **VS Code** | Text editor to read/edit files | Free | Recommended |
| **A safe place for passwords and keys** | The saved-passwords feature built into Chrome or Edge (free), or a paper notebook that you keep private | Free | Strongly recommended |

You do **not** need: Flutter, Android Studio, Java, Python, Docker, or a database program. (Those belonged to the removed mobile app.)

**Accounts online (create when the guide says so)**

| Account | Used for | Part |
|---|---|---|
| Supabase | Database + logins | 4 |
| Brevo | Emails | 6 |
| GitHub | Stores your code | 12 |
| Render | Runs the API online | 12 |
| Vercel | Runs the website online | 12 |

**Technologies inside the project (already included, nothing to install by hand)**
Next.js + React + TypeScript + Tailwind CSS (website), Leaflet + OpenStreetMap (map), Express (API), PostgreSQL + PostGIS on Supabase (database), Supabase Auth (logins), Brevo (emails).

### 0.2 Optional: find your old stuff
Only if you are curious or want to reuse an account.
- **Old folder:** File Explorer → *This PC* → type `gabosamap` in the search box (top right) and wait. Likely places: Downloads, Desktop, Documents.
- **Old accounts:** search your email inbox for `supabase`, `brevo`, `github`, `vercel`, `render`. The sign-up emails tell you which address you used. In the old folder, the file `apps\web\.env.local` shows the old Supabase project address.
- **Safe rule:** do **not** copy any old `.env` file into the new project. Everything gets re-created in Part 7.

### 0.3 Choose the working folder (important on Windows)
1. Create the folder **`C:\Projects`** (File Explorer → *This PC* → *Local Disk (C:)* → right-click → New → Folder → `Projects`).
2. Copy `uniguide-gabes-fresh-start.zip` into it, **right-click → Extract All…**, and extract. Do **not** open or run things from inside the zip.
3. You should now have **`C:\Projects\uniguide-gabes`** containing `package.json`, `GUIDE.md`, `apps`, `services`, `database`, `scripts`.

Why `C:\Projects`: avoid *Desktop*, *Documents* and *Downloads* if OneDrive is syncing them (it can break installs), and avoid folders with spaces, accents or Arabic letters in the path.

### 0.4 Your notes sheet
Open `MY-SETUP-NOTES.txt` (in the project folder) and fill it in as you go: folder path, which email you used for each account, project addresses. **Do not write passwords or keys in it:** put those in your browser's saved passwords or your private notebook. If you forget everything again, this one file tells you where things are.

### 0.5 How to open CMD in the right folder (you will do this many times)
1. Open File Explorer and go to `C:\Projects\uniguide-gabes`.
2. Click the **address bar** at the top, type `cmd`, press **Enter**. A black window opens **already inside the project**.
3. Paste commands with a **right-click** in the window. (Use **Command Prompt**, not PowerShell: PowerShell may say "running scripts is disabled".)
4. Handy: `dir` lists files, `cd ..` goes up one folder, **Ctrl+C** stops a running program.

✅ You have `C:\Projects\uniguide-gabes` and a CMD window that opens in it.

---

## Part 1 — What you are building, and what you need

**Accounts to create (all have free plans; limits can change, check before launch):**

| Service | Used for | When |
|---|---|---|
| Supabase | Database + student/admin logins | Part 4 |
| Brevo | Emails (approval notices; login emails) | Part 6 |
| GitHub | Storing the code so it can be deployed | Part 12 |
| Render | Hosting the API | Part 12 |
| Vercel | Hosting the website | Part 12 |

**How the pieces talk to each other**

```
Phone / PC browser ──► Website (Next.js)  ──► API (Express) ──► Supabase database
                              │                    │
                              └─► Supabase login   └─► Brevo (emails)
```
- The website talks to **Supabase only to log people in**. All places data goes through **your API**, which checks who is calling.
- The role (student or admin) is stored in the database and checked by the API on every request.

**Who can do what**

| | Visitor | Student | Admin |
|---|---|---|---|
| See approved places, save ♥ favorites on their device | ✅ | ✅ | ✅ |
| Suggest a place (goes to review) | ❌ | ✅ | publishes instantly |
| See own submissions and rejection reasons | ❌ | ✅ | ✅ |
| Approve / reject | ❌ | ❌ | ✅ |
| Log in at | – | `/login` | `/admin/login` |

---

## Part 2 — Install the software

Install these **in this order**, with the default options (just keep clicking *Next*). There are only three.

1. **Node.js LTS** — https://nodejs.org → the big **LTS** button → run the installer. (It also installs `npm`.)
2. **Git** — https://git-scm.com/download/win → run the installer. Defaults are fine.
3. **VS Code** (recommended) — https://code.visualstudio.com → install. When it asks, tick *Add to PATH* and *Open with Code*.

For passwords and keys you do not need to install anything: use the saved-passwords feature of Chrome or Edge, or a paper notebook you keep private.

**Close every CMD window, then open a new one** (Part 0.5) and check:
```
node --version
npm --version
git --version
```
✅ Each prints a version number. Node must be **version 20 or higher** (LTS is). If a command says "not recognized", the installer did not finish or you did not open a **new** CMD: restart the PC and try again.

---

## Part 3 — Install the project packages

In the CMD window opened inside `C:\Projects\uniguide-gabes` (Part 0.5):
```
npm install
npm run setup
```
- `npm install` installs the tool that starts everything together.
- `npm run setup` installs the website and API packages. It can take 3–10 minutes. Yellow `warn` lines are normal.
- If you ever forget this step, the other commands (`npm run doctor`, `npm run dev`, …) install what is missing automatically the first time.

✅ No red `npm error` at the end.

> **Always run commands from the project root** (`C:\Projects\uniguide-gabes`) unless a step says otherwise. Not from `apps\web`.

---

## Part 4 — Create the NEW Supabase project

You are starting with a **new, empty** project. Accounts from the earlier version do not exist here, so you will sign up again. Menu names can change slightly: use the dashboard search box, or https://supabase.com/docs, if one is missing.

### 4.1 Create it
1. Go to https://supabase.com → sign in → **New project**.
2. **Name**: `uniguide-gabes`. **Region**: the closest to Tunisia (e.g. a Europe region).
3. **Database password**: click *Generate a password*, then **copy it into a safe place now** (saved in your browser's passwords or in a private paper notebook). You will need it in Part 7. If you lose it you can reset it in *Database → Settings*.
4. Click **Create new project** and wait about 2 minutes until the dashboard opens.

### 4.2 Collect three values (keep this page open)
| Value | Where to find it | Looks like | Is it secret? |
|---|---|---|---|
| **Project URL** | Project Settings → API (Project URL) | `https://abcdefghijklmnopqrst.supabase.co` | No (public) |
| **Publishable key** | Project Settings → **API Keys** → tab "API Keys" → *Publishable key* (click *Create new API keys* if none exists) | `sb_publishable_...` | No (public, made for browsers) |
| **Connection string** | Click **Connect** (top bar) → choose **Session pooler** → copy the line | `postgresql://postgres.abcdefghijklmnopqrst:[YOUR-PASSWORD]@aws-0-xx.pooler.supabase.com:5432/postgres` | **YES, private** (it will hold your password) |

> **Never copy** the *secret* key or the *service_role* key anywhere in this project. The wizard in Part 7 refuses them on purpose.

### 4.3 Login settings
Authentication section:
1. **Sign In / Providers → Email**: keep Email enabled. Set **Minimum password length to 8**. For *local testing only* you may turn **Confirm email** off (turn it **on** again before real students use the site: Part 11).
2. **URL Configuration**: set **Site URL** to `http://localhost:3000` for now. Under **Redirect URLs** add `http://localhost:3000/**`. (You will add your real website address in Part 12.)

✅ You have the three values and the project is open.

---

## Part 5 — Create the database tables

1. Supabase → **SQL Editor** → **New query**.
2. Open `database\migrations\001_init.sql` from the project in a text editor, **copy everything**, paste it into the SQL Editor, click **Run**. At the bottom you should see `profiles` and `places` with `rls = true`.
3. **New query** again → copy all of `database\migrations\002_security.sql` → **Run**. You should see `audit_log`, `places`, `profiles`, each `rls = true`.

What these do: create the tables, create a student profile automatically on signup, lock the tables so that **only your API can read or write them** (browsers cannot), block anyone from making themselves admin, and add an **audit log** of admin actions. Both scripts are safe to run again.

✅ Both runs finish with the `rls = true` table. (Supabase may show a warning about "destructive operations" for `revoke`; confirm and run.)

---

## Part 6 — Brevo (emails)

Emails are **optional**: the site works without them. But Supabase's built-in sender is very limited (about **2 emails per hour**, per Brevo's and Supabase's docs), so for real students you want Brevo. You will use Brevo for two different things:

| Purpose | Credential | Used in |
|---|---|---|
| A. "Your place was approved/rejected" emails | **API key** (`xkeysib-...`) | Your API (`BREVO_API_KEY`) |
| B. Supabase's signup-confirmation and password-reset emails | **SMTP key** (`xsmtpsib-...`) | Supabase dashboard only |

They are **different keys**. Using the wrong one is the most common mistake.

### 6.1 Account and sender
1. Create an account at https://www.brevo.com (free plan; it listed 300 emails/day when we planned this, re-check current limits).
2. Verify a **sender** (the "from" address): gear icon **Settings → Senders, Domains & Dedicated IPs → Senders → Add a sender**. Enter a name (`UniGuide Gabès`) and an email address you can open, then confirm the verification email Brevo sends.
   - Best: an address on a domain you own, and authenticate that domain in the same menu (adds DNS records).
   - Free-mail addresses (Gmail, Yahoo…) as sender can land in spam. Fine for testing; for students prefer your own domain.

### 6.2 API key (purpose A)
1. **Settings → SMTP & API →** tab **API keys & MCP → Generate API key**. Name it `uniguide-api`.
2. **Copy it immediately** (shown once). It starts with `xkeysib-`.

### 6.3 If Brevo answers "401 / unrecognised IP"
Brevo can block API calls from IP addresses it does not know (your PC, Render's servers). Fix one of these ways: **Settings → Security → Authorized IPs →** authorize the IP, or **Deactivate blocking** for API keys. Free hosts change IP often, so deactivating is usually needed; this lowers protection of the key a bit, so keep the key private and revoke it if it ever leaks. The doctor command (Part 8) tells you when this is the cause.

### 6.4 SMTP for Supabase emails (purpose B, recommended before real users)
1. In Brevo: **Settings → SMTP & API →** tab **SMTP → Generate SMTP key**. Copy it (starts with `xsmtpsib-`). Note the **SMTP login** shown on that page (it can be your account email or something ending in `@smtp-brevo.com`: copy exactly what the page shows).
2. In Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP** and fill:

   | Field | Value |
   |---|---|
   | Sender email | the verified sender from 6.1 |
   | Sender name | `UniGuide Gabès` |
   | Host | `smtp-relay.brevo.com` |
   | Port | `587` |
   | Username | the SMTP login from step 1 |
   | Password | the SMTP key (`xsmtpsib-...`) |

3. **Save.** Supabase then allows about 30 auth emails per hour instead of 2 (adjustable in *Authentication → Rate Limits*).

✅ You have: a verified sender, an API key (`xkeysib-`), and (optionally) custom SMTP saved in Supabase.

---

## Part 7 — Fill the env files (new configuration)

"Env files" hold the settings. There are two. **The wizard writes both for you** and checks every answer.

From the project root:
```
npm run configure
```
It asks 6 questions. Have these ready:

| # | Question | Answer from |
|---|---|---|
| 1 | Supabase Project URL | Part 4.2 |
| 2 | Publishable key | Part 4.2 (it refuses secret / service_role keys) |
| 3 | Connection string (Session pooler) | Part 4.2, paste it **as copied** (with `[YOUR-PASSWORD]`) |
| 3b | Database password | Part 4.1 (the wizard inserts it and encodes special characters) |
| 4 | Website address | Press **Enter** for local use (`http://localhost:3000`) |
| 5 | Brevo API key | Part 6.2 (Enter to skip; it refuses an SMTP key) |
| 6 | Sender email (+ name) | Part 6.1 |

It writes:
- `services\api\.env` — **private**
- `apps\web\.env.local` — public values only

Old files are saved as `.bak-...` copies, so run the wizard again whenever something changes.

<details><summary>Manual alternative (what the files contain)</summary>

`services\api\.env`
```
PORT=4000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres.YOUR-REF:YOUR-PASSWORD@aws-0-xx.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://YOUR-REF.supabase.co
SUPABASE_JWKS_URL=https://YOUR-REF.supabase.co/auth/v1/.well-known/jwks.json
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=you@yourdomain.com
BREVO_SENDER_NAME=UniGuide Gabès
```
`apps\web\.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```
Special characters in the database password must be URL-encoded (`@` → `%40`, `/` → `%2F`, `:` → `%3A`, `#` → `%23`). The wizard does it for you.
</details>

**Which file holds what**

| Variable | File | Secret? |
|---|---|---|
| `DATABASE_URL` | API `.env` | **Yes** |
| `BREVO_API_KEY` | API `.env` | **Yes** |
| `SUPABASE_URL`, `SUPABASE_JWKS_URL`, `CORS_ORIGIN`, `PORT`, `BREVO_SENDER_*` | API `.env` | No (but keep the file private) |
| `NEXT_PUBLIC_*` (3 values) | web `.env.local` | No, they are public by design |

✅ The wizard ends with "Done".

---

## Part 8 — Run it and test it

```
npm run doctor
```
The doctor checks your files, the database, the security rules, the login keys and Brevo, and tells you **exactly** what to fix. Run it again until the last line says **✅ All good**.

Then:
```
npm run dev
```
Keep this window open: it runs the API (`http://localhost:4000`) and the website (`http://localhost:3000`) together.

Checks:
1. `http://localhost:4000/api/v1/health` shows `"status":"ok","db":"connected"`.
2. `http://localhost:3000` shows the map of Gabès and "No places yet" (nothing is invented on purpose).
3. If you set up Brevo, send a test email (replace with your own address):
   ```
   npm run test-email -- you@example.com
   ```
   You should see `OK: test email accepted by Brevo`. Check the inbox and the spam folder.

✅ Health is ok, the site opens, and (optional) the test email arrives.

---

## Part 9 — Create your admin account

1. Open `http://localhost:3000/signup` and sign up with an email you control. (If Confirm email is on, open the confirmation email first. Password: 8+ characters with letters and numbers.)
2. In CMD, in a second window at the project root:
   ```
   npm run make-admin -- you@example.com
   ```
   Use **your real email**. There is no password in this command. You should see `OK: ... is now an admin`.
3. Log in at `http://localhost:3000/admin/login`. A student account is refused there.

Forgot your password? Use **Forgot your password?** on the login page, or:
```
npm run set-password -- you@example.com NewPass123
```
(development helper; also marks the email as confirmed).

✅ You open the **Moderation** page.

---

## Part 10 — Add real places (no invented data)

1. Logged in as admin → **Add a place**.
2. Click the exact spot on the map (or *Use my location* when you are there).
3. Name, category, short description and a **source link** (the place's OpenStreetMap page or official website).
4. **Publish now**: it appears on the map immediately.

Only add places you have confirmed exist. Compare the pin with OpenStreetMap or visit the place; keep the proof in the source link.

Student suggestions arrive under **Pending**: use *View on map*, then **Approve**, or **Reject** with a reason (the student sees it in *My account* and gets an email if Brevo is set up).

Useful for students: ♥ saves a place on that device; **Share** creates a link that opens straight on that place; the language buttons switch the whole interface.

✅ A place you added shows on the home map.

---

## Part 11 — Security

### 11.1 What is built in (and was tested)
| Protection | What it does |
|---|---|
| Strict login-token checks | The API accepts a token only if it is signed by **your** Supabase project, has the right issuer and audience, is not expired, and the user still exists and is not banned or deleted. Forged, expired, other-project and "alg: none" tokens are refused. |
| Roles live in the database | The browser can never say "I am admin". Roles are read from the database on every request, and the database itself blocks changing a role from a browser session. |
| Locked database tables | Browsers cannot read or write `places`, `profiles` or `audit_log` through Supabase. Only your API can. |
| Strict input validation | Unknown fields are rejected; names, descriptions, coordinates, categories and links are checked (links must start with `http://` or `https://`); invisible control characters are removed; the database re-checks the same rules. |
| Rate limits | 600 requests/15 min in general, 20 writes/hour per visitor, 120 admin requests/min. |
| CORS | The production API only answers your own website address. |
| Audit log | Every admin publish / approve / reject is recorded (who, what, when). |
| No caching of private data | Login-dependent API answers are `no-store`; the offline cache never stores anything that needs a login. |
| Security headers | Content-Security-Policy (only your site, your API, your Supabase and OpenStreetMap tiles), HSTS, no framing, no sniffing, strict referrer and permissions policies. |
| Safe emails | Everything inserted into emails is HTML-escaped; emails only go to the logged-in user's own address. |
| Safe errors | In production the API never shows internal error details. |
| Dependencies | `npm audit` showed **0 known vulnerabilities** for both projects when checked. |

### 11.2 What you must do
1. **Rotate any secret that was ever shared** (zips, chats, screenshots): the old database password and the old Brevo key. The new project in this guide already replaces the old database; delete the old Supabase project if you no longer need it.
2. **Never commit or share** `services\api\.env`. The `.gitignore` already excludes it. Check `git status` before every commit.
3. Turn **Confirm email ON** in Supabase before real users sign up, and keep the **minimum password length at 8**.
4. Keep **few admins**, each with a strong unique password. Remove admin rights when someone leaves:
   `update public.profiles set role = 'student' where id = (select id from auth.users where email = 'x@y.com');`
5. **Look at the audit log now and then** (Supabase SQL Editor):
   `select at, actor_email, action, details from public.audit_log order by at desc limit 50;`
6. Once a month: `npm audit` in `services\api` and `apps\web`, update packages if it reports problems.
7. In production set `NODE_ENV=production`, `TRUST_PROXY=1` and `CORS_ORIGIN` to your real https address (the Render blueprint does the first two). `npm run doctor` checks this.
8. If a key leaks: Supabase → *Database → Settings* (reset password) and *API Keys* (create a new publishable key, delete the old one); Brevo → delete the API key and create another. Then run `npm run configure` again.

### 11.3 Honest limits (not built yet)
- **No two-factor login for admins** yet. Use long unique passwords. Supabase supports it; it can be added later.
- The Content-Security-Policy allows inline scripts, because the website's pages need them. A stricter nonce-based policy is a possible later step.
- No bot protection (CAPTCHA) on signup yet. The rate limits and Supabase's own limits help; add it if you see abuse. (Do not switch on CAPTCHA in Supabase without adding it to the site first, or signups will stop working.)
- Free plans can pause or sleep (Part 12). No security review by an outside professional has been done; the app stores emails and public place information only, but get a review before you handle anything more sensitive.

---

## Part 12 — Put it online (free-first)

Order: **GitHub → API (Render) → website (Vercel) → connect them**. Re-check each provider's current free-plan terms before a public launch.

### 12.1 GitHub
1. https://github.com → **New repository** → name `uniguide-gabes` → **Private** → Create (do not add a README).
2. In CMD at the project root:
   ```
   git add .
   git status
   ```
   **Stop and check:** no `.env` file may be listed (only `.env.example` and `.env.local.example` are allowed). Then:
   ```
   git config user.name "Your Name"
   git config user.email "you@example.com"
   git commit -m "UniGuide Gabes"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/uniguide-gabes.git
   git push -u origin main
   ```

### 12.2 API on Render
Render's docs say a free web service **sleeps after 15 minutes without traffic** (the first request afterwards takes about a minute), has monthly free-hour limits, can restart at any time and has no persistent disk. The website shows a "server is waking up" message meanwhile. Use a paid plan later for reliability.

1. https://render.com → **New + → Blueprint** → connect GitHub → pick the repository (it reads `render.yaml`).
2. Fill the values it asks for (same values as your local `.env`):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Session pooler string with your password (the wizard-made value in `services\api\.env`) |
   | `SUPABASE_URL` | your Project URL |
   | `SUPABASE_JWKS_URL` | `<Project URL>/auth/v1/.well-known/jwks.json` |
   | `CORS_ORIGIN` | a placeholder for now; the real address in 12.4 |
   | `BREVO_API_KEY` | `xkeysib-...` (or leave empty) |
   | `BREVO_SENDER_EMAIL` | your verified sender (or leave empty) |

   `NODE_ENV=production` and `TRUST_PROXY=1` are already in the blueprint.
3. Deploy. When it is live, open `https://YOUR-API.onrender.com/api/v1/health` → `"db":"connected"`.

### 12.3 Website on Vercel
1. https://vercel.com → **Add New → Project** → import the same repository.
2. **Root Directory: `apps/web`**.
3. Environment variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://YOUR-API.onrender.com/api/v1` |
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your publishable key |

4. **Deploy.** These `NEXT_PUBLIC_` values are built into the site: after changing one, **redeploy**. Check Vercel's plan terms for non-commercial/student use.

### 12.4 Connect everything
1. **Render →** your service → Environment → `CORS_ORIGIN` = your website address exactly, e.g. `https://uniguide-gabes.vercel.app` (no trailing slash) → save (it restarts).
2. **Supabase → Authentication → URL Configuration:** Site URL = your website address; add `https://YOUR-SITE/**` to Redirect URLs (needed for password-reset emails).
3. **Supabase → Authentication:** switch **Confirm email ON**.
4. Open your website, sign up, log in, add a place. In Render, run the doctor check from your PC against production values only if needed; the Render logs show any error.

✅ The online site loads places, signup works, and an admin can approve.

---

## Part 13 — Install it on phones

Open your **https** website address on the phone:
- **Android (Chrome):** tap **Install app** in the top bar (or ⋮ menu → *Install app*).
- **iPhone (Safari):** tap **Share → Add to Home Screen** (the top-bar *Install app* button shows these steps).
- **Computer (Chrome/Edge):** the install icon in the address bar.

It then opens full-screen with its own icon. If the network drops it shows an offline page or the last loaded places. Share the link or a QR code with students.

**Testing on your phone before it is online:** with `npm run dev` running and the phone on the same Wi-Fi, open `http://YOUR_PC_IP:3000` (find the IP with `ipconfig` → IPv4 Address) and allow Node.js through the Windows Firewall on private networks. It works as a normal website; installing as an app needs https, so it works once online.

---

## Part 14 — Final checklist

| # | Do this | Expected |
|---|---|---|
| 1 | `npm run doctor` | ✅ All good |
| 2 | `http://localhost:4000/api/v1/health` | `db: connected` |
| 3 | `npm run test-email -- you@example.com` | email arrives |
| 4 | Sign up a student, log in at `/login` | logged in |
| 5 | Add a place as the student | "Waiting for review" |
| 6 | Student opens `/admin` | "Administrators only" |
| 7 | Student opens `/admin/login` | "does not have administrator access" |
| 8 | `npm run make-admin -- your-email`, log in at `/admin/login` | Moderation opens |
| 9 | Approve the student's place | appears on the map; student gets an email |
| 10 | Add a weak password at signup (`abc`) | refused |
| 11 | ♥ a place → **Saved** filter; **Share** → open link | works |
| 12 | Switch to العربية | layout flips right-to-left |
| 13 | Online: install on a phone | icon on home screen |
| 14 | SQL: `select * from public.audit_log;` | shows your approvals |

---

## Part 15 — Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `'tsx' is not recognized` (or `'next'` / `'concurrently'` is not recognized) | The packages were not installed. From the project root run `npm install`, then `npm run setup`, wait for both to finish, and try again. The commands now also print this advice themselves. |
| `Missing script: "..."` | You are in `apps\web`. Go to the project root. |
| `'tsx' is not recognized` (or `'next'`, `'concurrently'` is not recognized) | The packages are not installed yet. Run `npm run setup` from the project root and wait for it to finish. (The commands now also install missing packages by themselves; if that fails, check your internet connection and run `npm run setup` again.) |
| `localhost:4000` does not open | API not running (it stops at startup if `.env` is wrong). Run `npm run doctor`. The API has no web page: the site is `:3000`, the check is `/api/v1/health`. |
| Wizard: "does not contain your project reference" | The connection string is from a different Supabase project than the URL. Copy both from the **same** project. |
| Wizard refuses my key | You copied a secret/service_role key (or a Brevo SMTP key). Use the **publishable** key / the **API** key. |
| Doctor: Table "audit_log" missing | Run `002_security.sql` (Part 5). |
| Doctor: "password authentication failed" | Wrong database password. Supabase → Database → Settings → reset, then `npm run configure`. |
| Doctor: "Tenant or user not found" | Use the **Session pooler** string exactly as shown. |
| Doctor: Brevo 401 | Wrong key type, or Brevo → Security → Authorized IPs blocking (6.3). |
| Doctor: sender "not verified" | Open the verification email Brevo sent to that sender address. |
| `test-email` FAILED, status 400 | `BREVO_SENDER_EMAIL` is not a verified sender in Brevo. |
| Test email accepted but nothing arrives | Check spam; free-mail senders land in spam. Use a domain you own. |
| Signup/reset emails never arrive | Custom SMTP not set (6.4): Supabase's own sender allows ~2 emails/hour. |
| "User already registered" | That email already has an account in this project: log in, *Forgot your password?* or `npm run set-password`. |
| "Password too weak" | 8+ characters with letters and numbers. |
| Logged in but "Administrators only" | `npm run make-admin -- email`, then log out and in. |
| `make-admin`: "No account found" | Sign up first; the API's `DATABASE_URL` must be the **same project** as the website. |
| Map: "Could not load places" | API not running/wrong address, or `CORS_ORIGIN` is not your website address. |
| Online site slow the first time | The free API was asleep (12.2). Normal. |
| Online: blank page or things blocked | Security policy blocking something. Add the variable `CSP_REPORT_ONLY=1` in Vercel, redeploy, open the browser console (F12) and send me the "Content-Security-Policy" message. |
| No "Install app" button | Needs https (online site), not already installed. iPhone: Share → Add to Home Screen. |
| Phone on Wi-Fi: no places | Firewall blocking ports 3000/4000, or phone on another network. |
| Installed app looks old | Close and reopen it once or twice (it updates in the background). |
| Port already in use | Close the other terminal, or change `PORT` in `services\api\.env`. |

---

## Part 16 — Reference

**Commands (project root)**

| Command | What it does |
|---|---|
| `npm run configure` | Wizard: writes both env files |
| `npm run doctor` | Checks configuration, database, security rules, login keys, Brevo |
| `npm run dev` | Starts API (:4000) + website (:3000) |
| `npm run make-admin -- email` | Makes an existing account an admin |
| `npm run set-password -- email NewPass123` | Sets a password without email (development) |
| `npm run test-email -- email` | Sends one test email through Brevo |

**API** (`/api/v1`)

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/health` | public | API + database status |
| GET | `/places?q=&category=` | public | Approved places (max 500) |
| GET | `/places/nearby?lat=&lng=&radius=` | public | Approved places within `radius` km (≤100) |
| GET | `/me` | logged in | `{ id, email, role }` |
| GET | `/me/submissions` | logged in | Your submissions |
| POST | `/places/submissions` | logged in | Suggest a place (pending) |
| POST | `/admin/places` | admin | Create a published place |
| GET | `/admin/submissions?status=` | admin | List submissions |
| PATCH | `/admin/submissions/:id/approve` | admin | Approve |
| PATCH | `/admin/submissions/:id/reject` | admin | Reject, body `{ "reason": "…" }` |

Categories: `faculty, housing, library, cafe, transport, pharmacy, other`.

**Project map**
```
uniguide-gabes/
├── package.json  render.yaml  GUIDE.md
├── scripts/configure.mjs            setup wizard
├── apps/web/                        website + PWA (src/app, src/components, src/lib, public/sw.js)
├── services/api/src/                server, auth, db, email, doctor, make-admin, set-password, send-test-email
└── database/migrations/             001_init.sql, 002_security.sql   (+ make_admin.sql)
```

**Next steps (suggested order):** 1) add 10–20 verified places, 2) translated place names/descriptions, 3) "report wrong information", 4) two-factor login for admins, 5) event and housing listings.
