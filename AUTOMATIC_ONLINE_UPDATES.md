# Automatic Online Updates

To make this website update online every day, use this setup:

1. Put this `korea-news-reader` folder in a GitHub repository.
2. Connect that GitHub repository to Netlify or GitHub Pages.
3. Keep the Codex daily automation active.
4. The daily automation should update `news-data.js` and push the change to GitHub.
5. Netlify or GitHub Pages will publish the new version automatically.

## Recommended Simple Setup

Use GitHub + Netlify:

1. Create a free GitHub account if you do not have one.
2. Create a new GitHub repository called `korea-news-reader`.
3. Upload all files from this folder:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `news-data.js`
   - `README.md`
4. Go to Netlify and choose `Add new site` -> `Import an existing project`.
5. Connect Netlify to the GitHub repository.
6. For the publish directory, use the repository root.

After this, every time `news-data.js` changes in GitHub, Netlify will update the website.

## What Still Needs To Be Connected

Codex can already update the local copy every morning. To update the online copy too, the local folder needs to become a GitHub repository with permission to push changes.

Once GitHub is connected, the daily automation should:

- gather today’s Korea news
- update `news-data.js`
- keep older saved days
- add new vocabulary to the in-page dictionary
- commit the update
- push it to GitHub

Netlify will then publish the new day automatically.

## Important Note

The website cannot update online automatically from a drag-and-drop Netlify upload. Drag-and-drop is only a one-time upload. Automatic updates need GitHub or another connected source.
