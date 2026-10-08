# Amina Community Hospital Centre: Website + Digital Patient System
Powered by Kilele Digital. Designed & Developed by Engineer Emmanuel Mwabili.

## What is included
| File | Purpose |
|---|---|
| `index.html` | Public website (services, doctors, dental, gallery, insurance, booking, map, assistant) |
| `portal.html` | Patient portal: Patient ID + date of birth shows visit history |
| `admin.html` | Staff dashboard: queue, appointments, patient records and visits, doctors with photos, backup |
| `assets/data.js` | Hospital details and Supabase keys (edit here) |
| `supabase/schema.sql` | Database setup for LIVE mode |

## Two modes
- **DEMO (default):** works instantly, but data stays in the browser of the device used. Good for trying it out. Do NOT store real patient data this way.
- **LIVE (Supabase, free tier):** doctors, appointments and patient records are shared across all staff devices, and the public site shows doctors you add. Required for real use.

## Go LIVE (about 10 minutes)
1. Create a free project at https://supabase.com.
2. SQL Editor > New query > paste `supabase/schema.sql` > Run.
3. Authentication > Sign In / Providers > turn OFF "Allow new users to sign up" (important: only staff you create should get in).
4. Authentication > Users > Add user: create an email + password for each staff member.
5. Project Settings > API: copy the Project URL and the `anon` public key into `assets/data.js` under `supabase`.
6. Push to GitHub (below). Staff sign in at `/admin.html`.

## Deploy on GitHub Pages (free)
```
git init && git add . && git commit -m "Amina Hospital system"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/amina-hospital.git
git push -u origin main
```
Then GitHub > Settings > Pages > Source: `main` / root > Save. Your site: `https://YOUR-NAME.github.io/amina-hospital/`. Custom domain (e.g. aminahc.org): Settings > Pages > Custom domain.

## Daily workflow (paperless)
1. Patient arrives: reception registers them (Patients > Register) and gives them their **Patient ID**.
2. Reception adds a **New visit** (status Waiting). The queue shows on the Overview tab.
3. Doctor opens the patient, records vitals, diagnosis and prescription, sets status Completed.
4. Patient can check their history on the Patient portal with Patient ID + date of birth.

## Security notes (please read)
- Staff sessions last about 1 hour in LIVE mode; sign in again when asked.
- Keep the Supabase service_role key private. Only the `anon` key goes in `data.js`.
- Patient health data is sensitive. Check Kenya's Data Protection Act requirements (registration with the ODPC, consent, retention) before going fully live.
- Use strong staff passwords and download a backup regularly (Settings > Backup).
