# Birthday Gift Site — Male Friend Edition

A single-page interactive birthday experience built with plain HTML, CSS, and vanilla JS. No build step required.

## Stack
- `index.html` — all markup and SVG sprite
- `assets/css/style.css` — all styles, three color worlds (daydream/starlit/aquaria)
- `assets/js/script.js` — all interactivity (navigation, countdown, game, fireworks, etc.)
- `assets/gifs/` — images/GIFs used on screen

## How to run
```
python3 -m http.server 5000
```
Configured as the "Start application" workflow — just hit Run.

## Things to personalise
- **Friend's name**: change "Best Friend" in `index.html` (`.name-tag` div, screen 4)
- **Friend's photo**: replace `assets/gifs/image.jpeg` with your own photo
- **Birthday date**: already set to July 6 in the countdown (`script.js` line ~197) and the card
- **Friendship start date**: update `new Date(2020, 0, 1)` in `script.js` (~line 719) to when you and your friend met
- **Letter content**: edit the `.letter-body` div in `index.html` (love letter overlay section)

## User preferences
- Keep the existing file structure — no framework or build step
