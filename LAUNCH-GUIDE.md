# Final launch guide

## 1. Review the package
1. Extract the ZIP.
2. Open `index.html` and review the Month 1 to Month 7 story.
3. Enter any code. In demo mode, the private invitation shows Goyni plus the actual Srimant and Baby Shower Canva artwork.
4. Select a Canva image to open the full-screen view.
5. Test the RSVP form and mobile layouts.

## 2. Create Supabase
1. Create a Supabase project.
2. Open SQL Editor, paste `supabase.sql`, and run it.
3. In Table Editor, add one test row to `invitations`.
4. Copy that invitation ID. In `invitation_events`, connect the ID only to events the household is invited to.
5. Repeat for each household.
6. In Project Settings > API, copy Project URL and anon key into `config.js`.
7. Change `DEMO_MODE:true` to `DEMO_MODE:false`.

## 3. Configure Google host sign-in
1. In Supabase Authentication > Providers, enable Google.
2. In Google Cloud, create a web OAuth client and configure the consent screen.
3. Add the callback URL displayed by Supabase to Google's authorized redirect URIs.
4. In Supabase Authentication > URL Configuration, set Site URL to the final Netlify URL and add `/admin.html` as an allowed redirect.
5. Replace the placeholder admin email in `config.js`.

## 4. Upload to GitHub
1. Create a private GitHub repository.
2. Upload every extracted file and folder to the repository root.
3. Confirm `index.html`, `style.css`, `config.js`, `supabase.sql`, `assets`, and `netlify.toml` are at the top level.
4. Commit the upload.

## 5. Deploy to Netlify
1. In Netlify select Add new project > Import an existing project.
2. Connect GitHub and select the repository.
3. Leave build command blank.
4. Set publish directory to `.`.
5. Publish.
6. Set the desired free Netlify site name under Domain management.
7. Return to Supabase URL Configuration and use the final Netlify URL.

## 6. Acceptance tests before sending links
- A Baby-Shower-only household sees only the Baby Shower Canva card.
- A Srimant-and-Baby-Shower household sees exactly two Canva cards.
- An immediate-family household sees Goyni, Srimant, and Baby Shower.
- RSVP can be edited from the same token.
- No household can load another household without its token.
- Dates, attire, maps and addresses are correct.
- Test iPhone Safari, Android Chrome, desktop Chrome and Edge.
- Remove phone numbers from Canva artwork first if those should not be visible online.
