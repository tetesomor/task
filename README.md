# task

A task manager built around three ideas:

- the eisenhower matrix (do now, schedule, delegate, drop)
- the 80/20 rule (mark your vital few tasks)
- areas of your life, each with a note on what its own vital 20% actually is

This is a plain HTML/CSS/JS site, no build step, no bundler. Just these files served as they are:

```
index.html
app.js
manifest.json
sw.js
icon-192.png
icon-512.png
favicon.svg
```

It's a PWA (progressive web app): once it's live on the web, people can open it in a browser and install it like a real app, own icon, own window, works offline.

## Putting it on GitHub

1. Create a new repo on GitHub, any name you like.
2. Push these files to it:
   ```
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. In the repo, go to **settings → pages**. Under "build and deployment", set **source** to **deploy from a branch**, branch `main`, folder `/ (root)`. Since there's no build step here, this is the right setting (unlike a Vite-style project, there's no separate "built" version to publish).
4. Your app will be live at `https://<your-username>.github.io/<repo-name>/` after a minute or two.

Because every path in this project is relative (`./app.js`, `./icon-192.png`, and so on) rather than hardcoded to `/task/`, it doesn't matter what you call the repo, or whether it's served from a root domain or a subfolder. It'll just work.

## Installing it as an app

Once it's live:
- **On a phone (Android/Chrome):** open the link, you'll see an "install app" prompt, or tap the browser menu and choose "install app" / "add to home screen".
- **On iPhone (Safari):** tap the share icon, then "add to home screen".
- **On desktop (Chrome/Edge):** an install icon appears in the address bar.

Once installed, it opens in its own window, no browser bar, and works offline since the service worker caches everything.

## If it still doesn't install properly

- Open the live link, then open developer tools (F12) and check the **console** tab for red errors, and the **application** tab → manifest, to see if the browser found and read it correctly.
- Make sure you're visiting the page over **https** (GitHub Pages always is), PWAs won't install over plain http.
- Try a hard refresh or a private/incognito window in case an old service worker is stuck.

## Where your data lives

Tasks and areas are saved in the browser's local storage, on your device. There's no server or account, so your data stays on whichever device and browser you use it in. Completed tasks clear themselves out after two weeks.

## Changing the icon

Just swap `icon-192.png` and `icon-512.png` for your own square images, same file names, then push. Don't add a separate "maskable" icon variant, phones round or shape whatever plain icon you give them automatically to match their own style, adding a maskable one tells the phone to use your shape exactly as-is instead, corners and all.
