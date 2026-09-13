# Collage slots

44 placeholder pieces make up the landing intro. 35 of them are photo slots (32 cut-outs + 3 polaroid photos). The other 9 are CSS shapes and handwritten captions (3 clouds, 6 text pieces) and need no artwork.

Theme: Southeast and East Asia. Malaysia, Singapore, Japan and Korea, mixing famous landmarks with street-level details so the collage reads as a trip, not a postcard rack.

Send transparent PNG cut-outs (background removed), roughly twice the listed size for sharp rendering. Name each file after the slot id and drop it in `public/collage/`. Polaroid slots take plain photos (the white frame is drawn by CSS). The phone video is one portrait clip (9:19.5), plus one QR image.

| Beat | Slot id | Stand-in today | Suggested subject | Size on stage |
|---|---|---|---|---|
| 1 beach | umb-l | ⛱️ | Striped beach umbrella, Langkawi (Malaysia) | 230 |
| 1 | umb-r | ⛱️ | Beach umbrella, Sentosa (Singapore) | 200 |
| 1 | beach | 🏖️ | Deck chairs on Tanjung Rhu beach, Langkawi | 300 |
| 1 | rock-l | 🪨 | Basalt columns, Jusangjeolli Cliff, Jeju (Korea) | 200 |
| 1 | rock-r | 🪨 | Coastal rocks, Okinawa (Japan) | 170 |
| 1 | palm-a | 🌴 | Small coconut palm, Perhentian Islands (moves to top-left) | 150 → 300 |
| 1 | palm-b | 🌴 | Small coconut palm, Sentosa (moves to top-right) | 150 → 300 |
| 2 flower | sun | 🌻 | Giant hibiscus, Malaysia's national flower, behind the wordmark | 440 → 270 |
| 2 | palm-c | 🌴 | Tall palm, Penang waterfront | 300 |
| 2 | palm-d | 🌴 | Tall palm, East Coast Park, Singapore | 280 |
| 2 | city | 🏙️ | Petronas Twin Towers, Kuala Lumpur | 320 |
| 2 | lantern | 🏮 | Red chochin lantern, Kyoto, or Petaling Street lantern | 140 |
| 3 objects | phone | ☎️ | Green Japanese public payphone handset | 170 |
| 3 | octo | 🐙 | Dotonbori takoyaki octopus sign, Osaka | 210 |
| 3 | book | 📙 | Manga volume or Korean webtoon cover | 230 |
| 3 | portrait | 🧑‍🎤 | Portrait cut-out in hanbok, Bukchon Hanok Village, Seoul | 230 |
| 3 | opera | 🏛️ | Marina Bay Sands, Singapore | 270 |
| 3 | fish | 🐠 | Koi or Japanese goldfish (kingyo) | 90 |
| 3 | cactus-l | 🌵 | Supertree, Gardens by the Bay, Singapore | 180 |
| 3 | cactus-r | 🌵 | Bamboo stalks, Arashiyama grove, Kyoto | 170 |
| 3 | flower | 🌸 | Cherry blossom sprig, Tokyo, or mugunghwa (Korea) | 100 |
| 4 sky | balloon | 🎈 | Hot-air balloon, Putrajaya balloon fiesta (Malaysia) | 120 |
| 4 | tape | 📼 | Game Boy or Walkman in hand, Akihabara (fades out at the end) | 170 |
| 4 | camera | 📷 | Instax camera in hand, Myeongdong, Seoul | 150 |
| 5 details | ufo | 🛸 | Neon UFO doodle, Shinjuku sign style | 100 |
| 5 | bfly-a | 🦋 | Rajah Brooke's birdwing butterfly (Malaysia) | 60 |
| 5 | bfly-b | 🦋 | Blue morpho-style butterfly, Penang Butterfly Farm | 50 |
| 5 | robot | 🤖 | Life-size Gundam head, Odaiba, Tokyo | 190 |
| 5 | disco | 🪩 | Noraebang (karaoke) disco ball, Seoul | 130 |
| 5 | pol-a | gradient | Polaroid: Shibuya Crossing at night | 90×150 |
| 5 | pol-b | gradient | Polaroid: Gyeongbokgung Palace gate, Seoul | 96×160 |
| 5 | pol-c | gradient | Polaroid: hawker centre plate, Singapore, or Jalan Alor at night | 80×130 |
| 5 | daisy | 🌼 | Frangipani flowers, Malaysia | 80 |
| 5 | alien | 👾 | Merlion, Singapore | 120 |
| 5 | wheel | 🎡 | Tokyo Tower or the Singapore Flyer | 200 |

Spare landmark ideas if a cut-out doesn't work: Batu Caves staircase (KL), Fushimi Inari torii gates (Kyoto), Mount Fuji, N Seoul Tower, Gamcheon Culture Village (Busan), Sultan Abdul Samad Building (KL), Kampong Glam shophouses (Singapore).

Phone card: `video` (portrait mp4) and `qr` (png) in `CARDS` in `src/app/page.tsx`.
