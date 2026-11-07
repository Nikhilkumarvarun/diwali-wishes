# 🪔 Diwali Wishes (React edition)

A small, smartphone-first 3D Diwali greeting built with **React + React Three Fiber**. Visitors tap to light a 3D diya: the flame flickers and lights a procedural rangoli, a ring of little lamps wakes up one by one, embers drift, and fireworks burst (tap anywhere for more). They can share the wish via the phone's share sheet or WhatsApp. Your name and Instagram / GitHub / LinkedIn / email sit in the footer.

**Live:** https://YOUR-PROJECT.vercel.app

## Stack

React 18 · Vite 5 · three.js · @react-three/fiber · @react-three/drei · @react-three/postprocessing (bloom + vignette). No external 3D files or images.

## Mac setup (one time)

```bash
xcode-select --install                      # git
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node gh                        # Node.js + GitHub CLI
node -v                                     # v18 or newer
```

## Run locally

```bash
cd ~/Downloads/diwali-wishes-diya-react     # wherever you unzipped it
npm install
npm run dev                                 # http://localhost:5173
```

On your phone (same Wi-Fi): `npm run dev -- --host`, then open the "Network" URL. Phone-tilt parallax on iPhone needs HTTPS, so it works on the Vercel link.

## Make it yours

Edit `src/config.js`: your name, role, social links and the wish text. Colours: `src/styles.css` and the `PAL` array in `src/Scene.jsx`.

## Deploy free (GitHub + Vercel)

```bash
git init && git add . && git commit -m "Diwali wishes"
gh auth login                               # one time: GitHub.com + browser
gh repo create diwali-wishes --public --source=. --push
```

Open [vercel.com/new](https://vercel.com/new), sign in with GitHub, import `diwali-wishes`, keep the auto-detected **Vite** preset, click **Deploy**. Every `git push` redeploys. (CLI alternative: `npx vercel --prod`.)

## Structure

```
src/
├── main.jsx    # entry
├── App.jsx     # UI overlay, sharing, Canvas
├── Scene.jsx   # diya, rangoli, lights, fireworks, camera, bloom
├── config.js   # your details
└── styles.css
```

## Performance tips

Lower the `Sparkles` count in `Scene.jsx`, set `dpr={[1, 1.5]}` in `App.jsx`, or remove `<EffectComposer>` on very old phones.

## License

MIT. Remix it and send it to everyone you love.

Made with love by **YOUR NAME**
