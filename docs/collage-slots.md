# Collage slots

44 placeholder pieces make up the landing intro. 35 of them are photo slots (32 cut-outs + 3 polaroid photos). The other 9 are CSS shapes and handwritten captions (3 clouds, 6 text pieces) and need no artwork.

Send transparent PNG cut-outs (background removed), roughly twice the listed size for sharp rendering. Name each file after the slot id and drop it in `public/collage/`. Polaroid slots take plain photos (the white frame is drawn by CSS). The phone video is one portrait clip (9:19.5), plus one square app icon and one QR image.

| Beat | Slot id | Stand-in today | Suggested subject | Size on stage |
|---|---|---|---|---|
| 1 beach | umb-l | ⛱️ | beach umbrella | 230 |
| 1 | umb-r | ⛱️ | beach umbrella | 200 |
| 1 | beach | 🏖️ | deck chairs / beach scene | 300 |
| 1 | rock-l | 🪨 | rocks | 200 |
| 1 | rock-r | 🪨 | rocks | 170 |
| 1 | palm-a | 🌴 | small palm (moves to top-left) | 150 → 300 |
| 1 | palm-b | 🌴 | small palm (moves to top-right) | 150 → 300 |
| 2 sunflower | sun | 🌻 | big flower behind the wordmark | 440 → 270 |
| 2 | palm-c | 🌴 | large palm | 300 |
| 2 | palm-d | 🌴 | large palm | 280 |
| 2 | city | 🏙️ | city / signage | 320 |
| 2 | lantern | 🏮 | sign or lantern | 140 |
| 3 objects | phone | ☎️ | vintage handset | 170 |
| 3 | octo | 🐙 | octopus / sea creature | 210 |
| 3 | book | 📙 | book cover | 230 |
| 3 | portrait | 🧑‍🎤 | portrait cut-out | 230 |
| 3 | opera | 🏛️ | landmark | 270 |
| 3 | fish | 🐠 | goldfish | 90 |
| 3 | cactus-l | 🌵 | cactus | 180 |
| 3 | cactus-r | 🌵 | cactus | 170 |
| 3 | flower | 🌸 | flower | 100 |
| 4 sky | balloon | 🎈 | hot-air balloon | 120 |
| 4 | tape | 📼 | device in hand (fades out at the end) | 170 |
| 4 | camera | 📷 | camera in hand | 150 |
| 5 details | ufo | 🛸 | UFO doodle | 100 |
| 5 | bfly-a | 🦋 | butterfly | 60 |
| 5 | bfly-b | 🦋 | butterfly | 50 |
| 5 | robot | 🤖 | helmet / character | 190 |
| 5 | disco | 🪩 | disco ball | 130 |
| 5 | pol-a | gradient | polaroid photo | 90×150 |
| 5 | pol-b | gradient | polaroid photo | 96×160 |
| 5 | pol-c | gradient | polaroid photo | 80×130 |
| 5 | daisy | 🌼 | flowers | 80 |
| 5 | alien | 👾 | mascot / character | 120 |
| 5 | wheel | 🎡 | windmill / ride | 200 |

Phone card: `video` (portrait mp4), `icon` (square png), `qr` (png) in `CARDS` in `src/app/page.tsx`.
