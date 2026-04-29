# 🤖 Allogic AI BOT

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Ribeye&size=42&pause=1000&color=33FF00&center=true&width=900&height=90&lines=Allogic+AI+BOT;AI+WhatsApp+Bot;Smart+Command+Router;Multi+Device+WhatsApp+Bot;AI+Router+V4" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/fajarsecid/Allogic-AI-BOT?style=for-the-badge&label=Stars" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/fajarsecid/Allogic-AI-BOT?style=for-the-badge&label=Forks" alt="Forks"/>
  <img src="https://img.shields.io/github/watchers/fajarsecid/Allogic-AI-BOT?style=for-the-badge&label=Watchers" alt="Watchers"/>
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
</p>

---

## 📌 Tentang Allogic AI BOT

**Allogic AI BOT** adalah bot WhatsApp berbasis **Node.js** dan **Baileys Multi Device** yang dibuat untuk membantu pengguna dan admin grup dalam mengelola WhatsApp secara otomatis.

Bot ini dilengkapi dengan **Allogic AI Router V4**, yaitu sistem routing AI otomatis yang bisa membedakan pertanyaan ringan dan pertanyaan berat, lalu memilih provider dan model AI yang paling cocok.

Bot juga bisa memahami perintah natural seperti:

```text
.ai jadikan dia admin
.ai copot admin dia
.ai tutup grup
.ai buka grup
.ai aktifkan mode publik
.ai ubah bot ke mode private
.ai download mp4 https://youtube.com/...
```

---

## ✨ Fitur Utama

### 🤖 AI Assistant

- Chat AI melalui `.ai`
- Tanya jawab umum
- Coding dan debugging
- Penjelasan pelajaran
- Ringkasan teks
- Ide caption, bio, konsep, dan lainnya
- Bantuan Bahasa Jerman
- Terjemahan dan penjelasan kosakata
- Jawaban ringan dan berat dengan model berbeda

### 🧠 Smart Command Router

AI dapat memahami kalimat natural dan mengubahnya menjadi command bot.

Contoh:

```text
.ai jadikan bot publik
```

Menjadi:

```text
.mode public
```

Contoh lain:

```text
.ai copot admin @user
```

Menjadi:

```text
.demote @user
```

### 👮 Admin & Group Management

- Promote member jadi admin
- Demote admin jadi member
- Kick member
- Mute / unmute grup
- Tag all
- Hidetag
- Welcome / goodbye
- Antilink
- Antitag
- Warn / warnings
- Ban / unban
- Clear chat
- Group info
- Reset link grup

### 🔐 Owner Tools

- Mode public / private
- Clear session
- Clear tmp
- Update bot
- Settings bot
- Ganti PP bot
- Pair
- Owner info
- Auto read
- Auto typing
- Auto react
- Anti call
- Anti delete
- PM blocker

### 🎨 Media & Tools

- Sticker maker
- Sticker to image
- Text to speech
- Translate
- Remove background
- Enhance / remini
- Upload media to URL
- Text maker
- Screenshot web
- AI image generation jika command tersedia

### 📥 Downloader

- YouTube MP3
- YouTube MP4
- TikTok
- Instagram
- Facebook
- Spotify

### 🎮 Fun & Games

- Truth
- Dare
- Tic Tac Toe
- Hangman
- Trivia
- Quote
- Joke
- Anime reaction commands
- Misc fun commands

---

## 🧠 Allogic AI Router V4

Allogic AI BOT menggunakan **AI Router V4** untuk memilih provider dan model secara otomatis.

Router ini bisa membedakan:

```text
Tugas ringan → pakai model cepat dan hemat
Tugas berat  → pakai model lebih pintar
```

---

## ⚡ Tugas Ringan

Contoh tugas ringan:

```text
.ai halo
.ai siapa mark zuckerberg
.ai buat caption jualan bakso
.ai apa bahasa jermannya makan
.ai jelaskan singkat apa itu API
```

Default flow:

```text
Groq → OpenRouter → NVIDIA NIM → Google/Gemini
```

Contoh log:

```text
🤖 Allogic AI Router V4: type=light order=groq>openrouter>nvidia>google
🤖 Allogic Model Try: provider=groq model=llama-3.1-8b-instant
```

---

## 🧠 Tugas Berat

Contoh tugas berat:

```text
.ai selesaikan soal matematika ini step by step: 2x + 5 = 17
.ai buatkan game sederhana pakai html css javascript lengkap
.ai debug error nodejs ini
.ai jelaskan secara detail tentang database
.ai analisis kode ini dan perbaiki bugnya
```

Default flow:

```text
Google/Gemini → Groq → OpenRouter → NVIDIA NIM
```

Contoh log:

```text
🤖 Allogic AI Router V4: type=heavy order=google>groq>openrouter>nvidia
🤖 Allogic Model Try: provider=google model=gemini-2.5-flash
```

---

## 🔁 Model Fallback / Rolling Model

Jika satu model limit, penuh, error, atau sedang high demand, bot akan mencoba model berikutnya secara otomatis.

Contoh:

```text
🤖 Allogic AI Router V4: type=heavy order=google>groq>openrouter>nvidia
🤖 Allogic Model Try: provider=google model=gemini-2.5-flash
⚠️ Allogic Model Failed: google/gemini-2.5-flash: high demand
🤖 Allogic Model Try: provider=google model=gemini-3.1-flash-lite-preview
```

Artinya bot tidak langsung berhenti saat model pertama gagal.

---

## 🔌 Provider AI yang Didukung

Allogic AI BOT mendukung beberapa provider AI:

- Google / Gemini
- Groq
- OpenRouter
- NVIDIA NIM

Konfigurasi provider dan model bisa diatur melalui file `.env`.

---

## ⚙️ Contoh Konfigurasi Model

### Google / Gemini

```env
GOOGLE_MODEL=gemini-2.5-flash

GOOGLE_MODELS_LIGHT=gemini-3.1-flash-lite-preview,gemini-2.5-flash-lite,gemma-4-26b-a4b-it,gemma-4-31b-it,gemini-2.5-flash
GOOGLE_MODELS_HEAVY=gemini-2.5-flash,gemini-3.1-flash-lite-preview,gemma-4-31b-it,gemma-4-26b-a4b-it,gemini-2.5-flash-lite
```

### Groq

```env
GROQ_MODEL=llama-3.3-70b-versatile

GROQ_MODELS_LIGHT=llama-3.1-8b-instant,llama-3.3-70b-versatile
GROQ_MODELS_HEAVY=llama-3.3-70b-versatile,llama-3.1-8b-instant
```

### OpenRouter

```env
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct

OPENROUTER_MODELS_LIGHT=stepfun/step-3.5-flash:free,openai/gpt-oss-120b:free,meta-llama/llama-3.3-70b-instruct
OPENROUTER_MODELS_HEAVY=openai/gpt-oss-120b:free,meta-llama/llama-3.3-70b-instruct,stepfun/step-3.5-flash:free
```

### NVIDIA NIM

```env
NVIDIA_MODEL=nvidia/llama-3.1-nemotron-nano-8b-v1

NVIDIA_MODELS_LIGHT=nvidia/llama-3.1-nemotron-nano-4b-v1.1,nvidia/llama-3.1-nemotron-nano-8b-v1
NVIDIA_MODELS_HEAVY=nvidia/llama-3.3-nemotron-super-49b-v1.5,nvidia/llama-3.3-nemotron-super-49b-v1,nvidia/llama-3.1-nemotron-ultra-253b-v1,nvidia/llama-3.1-nemotron-nano-8b-v1
```

Jika salah satu model tidak tersedia di akun kamu, sistem fallback akan mencoba model berikutnya.

---

## ⚠️ Peringatan Penting

Project ini menggunakan **Baileys**, yaitu library tidak resmi untuk koneksi WhatsApp Multi Device.

Gunakan dengan bijak.

Risiko penggunaan:

- Nomor WhatsApp bisa logout
- Nomor bisa terkena limit
- Nomor bisa terkena banned jika dipakai spam
- WhatsApp update bisa membuat bot error sementara
- Bot ini bukan produk resmi WhatsApp / Meta

Jangan gunakan bot untuk spam, penipuan, bulk message ilegal, atau aktivitas yang melanggar hukum.

---

## 📦 Requirements

Sebelum install, pastikan server kamu punya:

- Node.js v20 atau lebih baru
- npm
- Git
- FFmpeg
- Python3
- koneksi internet stabil

Rekomendasi minimal:

```text
RAM 1GB  : bisa jalan untuk bot ringan
RAM 2GB  : lebih aman
OS       : Ubuntu 22.04 / 24.04
```

Untuk VPS Ubuntu/Debian:

```bash
apt update && apt upgrade -y
apt install git curl nano unzip ffmpeg python3 python3-pip -y
```

Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y
```

Cek versi:

```bash
node -v
npm -v
git --version
ffmpeg -version
```

---

## 🚀 Cara Install

### 1. Clone repository

```bash
git clone https://github.com/fajarsecid/Allogic-AI-BOT.git
cd Allogic-AI-BOT
```

### 2. Install dependencies

```bash
npm install
```

Kalau ada error dependency:

```bash
npm install --legacy-peer-deps
```

---

## ⚙️ Konfigurasi `.env`

File `.env` digunakan untuk menyimpan owner number, API key, provider AI, dan model fallback.

Jika repository menyediakan `.env` template, edit langsung:

```bash
nano .env
```

Jika belum ada, buat file `.env`:

```bash
cp .env.example .env
nano .env
```

Contoh konfigurasi:

```env
# ==============================
# Allogic AI BOT Environment
# ==============================

OWNER_NUMBER=628xxxxxxxxxx
OWNER_NUMBERS=628xxxxxxxxxx
SUDO=628xxxxxxxxxx
SUDO_USERS=628xxxxxxxxxx

# Jika WhatsApp membaca owner sebagai LID, tambahkan juga LID:
# OWNER_NUMBERS=628xxxxxxxxxx,77107715690729
# SUDO=628xxxxxxxxxx,77107715690729
# SUDO_USERS=628xxxxxxxxxx,77107715690729

ALLOGIC_AI_PROVIDER=auto

AI_LIGHT_PROVIDER_ORDER=groq,openrouter,nvidia,google
AI_HEAVY_PROVIDER_ORDER=google,groq,openrouter,nvidia

AI_HEAVY_MIN_CHARS=700
AI_HEAVY_HISTORY_CHARS=2500

# Google / Gemini
GOOGLE_API_KEY=YOUR_GOOGLE_OR_GEMINI_API_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GOOGLE_API_BASE=https://generativelanguage.googleapis.com/v1beta
GOOGLE_MODEL=gemini-2.5-flash

GOOGLE_MODELS_LIGHT=gemini-3.1-flash-lite-preview,gemini-2.5-flash-lite,gemma-4-26b-a4b-it,gemma-4-31b-it,gemini-2.5-flash
GOOGLE_MODELS_HEAVY=gemini-2.5-flash,gemini-3.1-flash-lite-preview,gemma-4-31b-it,gemma-4-26b-a4b-it,gemini-2.5-flash-lite

# Groq
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_API_BASE=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile

GROQ_MODELS_LIGHT=llama-3.1-8b-instant,llama-3.3-70b-versatile
GROQ_MODELS_HEAVY=llama-3.3-70b-versatile,llama-3.1-8b-instant

# OpenRouter
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
OPENROUTER_SITE_URL=https://github.com/fajarsecid/Allogic-AI-BOT
OPENROUTER_APP_NAME=Allogic AI BOT

OPENROUTER_MODELS_LIGHT=stepfun/step-3.5-flash:free,openai/gpt-oss-120b:free,meta-llama/llama-3.3-70b-instruct
OPENROUTER_MODELS_HEAVY=openai/gpt-oss-120b:free,meta-llama/llama-3.3-70b-instruct,stepfun/step-3.5-flash:free

# NVIDIA NIM
NVIDIA_API_KEY=YOUR_NVIDIA_API_KEY
NVIDIA_API_BASE=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/llama-3.1-nemotron-nano-8b-v1

NVIDIA_MODELS_LIGHT=nvidia/llama-3.1-nemotron-nano-4b-v1.1,nvidia/llama-3.1-nemotron-nano-8b-v1
NVIDIA_MODELS_HEAVY=nvidia/llama-3.3-nemotron-super-49b-v1.5,nvidia/llama-3.3-nemotron-super-49b-v1,nvidia/llama-3.1-nemotron-ultra-253b-v1,nvidia/llama-3.1-nemotron-nano-8b-v1

# AI Settings
AI_TEMPERATURE=0.2
AI_MAX_OUTPUT_TOKENS=1000
AI_MAX_HISTORY=6

ALLOGIC_PLANNER_MODEL=llama-3.3-70b-versatile
```

Format owner number yang benar:

```env
OWNER_NUMBER=6281234567890
```

Jangan pakai:

```env
OWNER_NUMBER=+62 812-3456-7890
```

---

## 🔐 Login WhatsApp

Jalankan bot:

```bash
npm start
```

atau:

```bash
node index.js
```

Ikuti instruksi login yang muncul di terminal.

Biasanya bot akan menggunakan:

- QR code
- pairing code

Jika menggunakan QR:

1. Buka WhatsApp
2. Masuk ke **Linked Devices / Perangkat Tertaut**
3. Scan QR dari terminal
4. Tunggu sampai bot connected

Jika berhasil, terminal akan menampilkan pesan seperti:

```text
Bot Connected Successfully
```

Session login akan tersimpan di folder:

```text
session/
```

Jangan hapus folder `session/` kalau tidak mau login ulang.

---

## ▶️ Menjalankan Bot

### Manual

```bash
npm start
```

### Langsung dengan Node

```bash
node index.js
```

### Menggunakan PM2

Install PM2:

```bash
npm install -g pm2
```

Jalankan bot:

```bash
pm2 start index.js --name allogic-ai-bot
```

Cek status:

```bash
pm2 list
```

Lihat log:

```bash
pm2 logs allogic-ai-bot
```

Restart:

```bash
pm2 restart allogic-ai-bot --update-env
```

Stop:

```bash
pm2 stop allogic-ai-bot
```

Auto start setelah reboot:

```bash
pm2 save
pm2 startup
```

---

## 💬 Cara Menggunakan

Prefix utama bot biasanya menggunakan titik:

```text
.command
```

Untuk AI:

```text
.ai pertanyaan kamu
```

Contoh:

```text
.ai halo
.ai siapa kamu
.ai jelaskan apa itu API
.ai buatkan caption promosi makanan
.ai selesaikan soal matematika ini step by step: 2x + 5 = 17
```

---

## 🧠 Contoh Smart Router

Kamu bisa menggunakan command langsung:

```text
.promote @user
.demote @user
.mute
.unmute
.mode public
.mode private
```

Atau menggunakan bahasa natural lewat AI:

```text
.ai jadikan dia admin
.ai copot admin dia
.ai turunkan dia jadi member
.ai tendang dia
.ai tutup grup
.ai buka grup
.ai aktifkan mode publik
.ai jadikan bot private
.ai ganti nama grup Test Group
.ai ganti deskripsi grup Ini deskripsi baru
.ai reset link grup
.ai lihat admin grup
.ai kasih warning dia
```

Bot akan mencoba mengubah perintah natural menjadi command yang sesuai.

---

## 📚 Daftar Command Umum

Command bisa berbeda tergantung file yang ada di folder `commands/`.

### AI

```text
.ai
.ask
.gpt
.gemini
.groq
.allogic
```

### Owner

```text
.mode public
.mode private
.clearsession
.cleartmp
.update
.settings
.setpp
.autoread
.autotyping
.autoreact
.autostatus
.anticall
.antidelete
.pmblocker
.pair
.owner
```

### Admin / Group

```text
.promote
.demote
.kick
.mute
.unmute
.tagall
.hidetag
.setgpp
.setgname
.setgdesc
.resetlink
.groupinfo
.staff
.delete
.warn
.warnings
.ban
.unban
.clear
.welcome
.goodbye
.antilink
.antitag
.antibadword
.chatbot
```

### Downloader

```text
.play
.song
.ytmp3
.ytmp4
.video
.tiktok
.instagram
.facebook
.spotify
```

### Media

```text
.sticker
.s
.simage
.take
.removebg
.remini
.blur
.url
.tts
.trt
.ss
.imagine
```

### Fun / Games

```text
.truth
.dare
.tictactoe
.hangman
.trivia
.answer
.8ball
.quote
.joke
.fact
```

---

## 🧪 Test Setelah Install

Setelah bot connected, coba di WhatsApp:

```text
.ai halo
```

Tes owner:

```text
.ai jadikan bot publik
.ai jadikan bot private
```

Tes admin group:

```text
.ai tutup grup
.ai buka grup
```

Tes AI ringan:

```text
.ai siapa mark zuckerberg
```

Log yang benar:

```text
🤖 Allogic AI Router V4: type=light order=groq>openrouter>nvidia>google
🤖 Allogic Model Try: provider=groq model=llama-3.1-8b-instant
```

Tes AI berat:

```text
.ai buatkan game sederhana pakai html css javascript lengkap
```

Log yang benar:

```text
🤖 Allogic AI Router V4: type=heavy order=google>groq>openrouter>nvidia
🤖 Allogic Model Try: provider=google model=gemini-2.5-flash
```

Tes NVIDIA langsung:

```bash
node - <<'NODE'
require('dotenv').config();
const { askAllogicAI } = require('./lib/allogic-ai-router-v4');

askAllogicAI('Jawab singkat: halo', { provider: 'nvidia' })
  .then(console.log)
  .catch(e => console.error(e.message));
NODE
```

Tes downloader:

```text
.ai download mp4 https://youtube.com/shorts/xxxxx
```

---

## 📁 Struktur Project

```text
Allogic-AI-BOT/
├── commands/        # file command bot
├── lib/             # helper, AI, router, planner, tools
├── session/         # session WhatsApp, jangan upload isi session ke GitHub
├── data/            # data runtime bot
├── index.js         # entry point bot
├── main.js          # handler utama bot
├── package.json     # dependency project
├── .env             # konfigurasi environment
├── .gitignore       # ignore file sensitif
└── README.md
```

File penting AI:

```text
lib/allogic-ai.js
lib/allogic-ai-router-v4.js
lib/allogic-ai-intent-router.js
commands/ai.js
```

---

## 🔒 File yang Tidak Boleh Diupload

Jangan upload file sensitif ini ke GitHub:

```text
.env asli yang berisi API key pribadi
session/*.json
sessions/
auth/
auth_info_baileys/
baileys_auth_info/
creds.json
baileys_store.json
node_modules/
backup file
```

Contoh `.gitignore`:

```gitignore
node_modules/

.env.private*
.env.local
.env.*.local
*.private*

session/*
!session/README.md
!session/.gitkeep

sessions/
auth/
auth_info_baileys/
baileys_auth_info/
baileys_store.json
creds.json
creds*.json

_backup*/
backup*/
backup-*/
*.tar.gz
*.zip
*.bak
*.bak*
*.debugbak

temp/
tmp/
logs/
*.log
```

Jika ingin upload `.env` ke GitHub, pastikan isinya hanya template public, bukan API key asli.

---

## 🛠️ Troubleshooting

### Bot tidak respon

Cek apakah bot masih jalan:

```bash
pm2 list
```

atau:

```bash
ps -ef | grep node
```

Restart:

```bash
pm2 restart allogic-ai-bot --update-env
```

atau:

```bash
pkill -f "node index.js"
pkill -f "node main.js"
npm start
```

### Bot minta login ulang

Kemungkinan folder `session/` hilang atau rusak.

Jalankan ulang bot dan login ulang.

### Error decrypt session

Jika muncul error seperti:

```text
Failed to decrypt message with any known session
MessageCounterError
```

Biasanya penyebabnya:

- bot jalan dobel
- session bentrok
- WhatsApp linked device sync error

Solusi:

```bash
pkill -f "node index.js"
pkill -f "node main.js"
npm start
```

Jika masih error, backup lalu reset session.

### AI tidak jalan

Cek `.env`:

```bash
grep -n "API_KEY" .env
```

Pastikan minimal salah satu API key tersedia:

```env
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
NVIDIA_API_KEY=
```

### Router V4 tidak muncul

Jika log masih seperti ini:

```text
Allogic AI Auto Provider
```

berarti `.ai` belum diarahkan ke router V4.

Cek:

```bash
grep -n "allogic-ai-router-v4" commands/ai.js
```

Harus ada:

```js
const { askAllogicAI } = require('../lib/allogic-ai-router-v4');
```

### Dibilang bukan owner

Pastikan `OWNER_NUMBER` benar:

```env
OWNER_NUMBER=628xxxxxxxxxx
```

Jika WhatsApp membaca akun kamu sebagai LID, tambahkan juga LID:

```env
OWNER_NUMBERS=628xxxxxxxxxx,77107715690729
SUDO=628xxxxxxxxxx,77107715690729
SUDO_USERS=628xxxxxxxxxx,77107715690729
```

### YouTube download gagal

Pastikan `yt-dlp` dan `ffmpeg` tersedia:

```bash
yt-dlp --version
ffmpeg -version
```

Install yt-dlp jika belum ada:

```bash
pip install -U yt-dlp
```

---

## 🔄 Update Project

Kalau ada update dari repository:

```bash
git pull
npm install
npm start
```

Jika pakai PM2:

```bash
git pull
npm install
pm2 restart allogic-ai-bot --update-env
```

---

## ☁️ Upload ke GitHub

Pastikan file sensitif tidak ikut:

```bash
git ls-files | grep -Ei '(^|/)(session/.*\.json|sessions/|auth/|auth_info_baileys/|baileys_auth_info/|creds.*\.json$|baileys_store\.json$)'
```

Cek apakah ada API key asli yang akan ikut commit:

```bash
git diff --cached | grep -Ei "sk-or-|gsk_|AIza|nvapi-|noiseKey|signedIdentityKey|privateKey"
```

Commit:

```bash
git add .
git commit -m "Update Allogic AI BOT"
git push
```

---

## 👤 Developer Info

```text
Instagram : @fajarid_real
Tiktok    : FajarID Real
WhatsApp  : +6283847036840
CREDIT    : FajarID
```

---

## 🙌 Credits

Project ini dikembangkan dan dimodifikasi sebagai **Allogic AI BOT**, dengan tetap menghargai pembuat dan kontributor asli.

Credits:

- [Professor / MR UNIQUE HACKER](https://github.com/mruniquehacker)
- [Baileys](https://github.com/WhiskeySockets/Baileys)
- [TechGod143](https://github.com/TechGod143)
- [Dgxeon](https://github.com/Dgxeon)
- Semua library open-source yang digunakan di `package.json`

Terima kasih kepada semua developer open-source yang membuat project seperti ini bisa dikembangkan.

---

## ⚖️ Legal Disclaimer

Allogic AI BOT adalah project independen dan tidak resmi.

- Tidak berafiliasi dengan WhatsApp
- Tidak berafiliasi dengan Meta
- Tidak disponsori atau didukung oleh WhatsApp
- Gunakan dengan risiko sendiri
- Jangan gunakan untuk spam
- Jangan gunakan untuk aktivitas ilegal
- Developer tidak bertanggung jawab atas penyalahgunaan bot

---

## 📄 License

Project ini mengikuti lisensi yang tersedia pada file `LICENSE`.

Jika menggunakan, memodifikasi, atau membagikan ulang project ini, tetap sertakan credit kepada pembuat dan library open-source yang digunakan.

---

## 🌟 Support

Jika project ini membantu, beri star repository:

```text
https://github.com/fajarsecid/Allogic-AI-BOT
```
