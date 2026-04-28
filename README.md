# 🤖 Allogic AI BOT

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Ribeye&size=42&pause=1000&color=33FF00&center=true&width=900&height=90&lines=Allogic+AI+BOT;AI+WhatsApp+Bot;Smart+Command+Router;Multi+Device+WhatsApp+Bot" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/fajarsecid/Allogic-AI-BOT?style=for-the-badge&label=Stars" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/fajarsecid/Allogic-AI-BOT?style=for-the-badge&label=Forks" alt="Forks"/>
  <img src="https://img.shields.io/github/watchers/fajarsecid/Allogic-AI-BOT?style=for-the-badge&label=Watchers" alt="Watchers"/>
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
</p>

---

## 📌 Tentang Allogic AI BOT

**Allogic AI BOT** adalah bot WhatsApp berbasis **Node.js** dan **Baileys Multi Device** yang dibuat untuk membantu pengguna dan admin grup dalam mengelola WhatsApp secara otomatis.

Bot ini dilengkapi dengan **AI Smart Router**, sehingga pengguna bisa mengetik perintah secara natural memakai bahasa Indonesia atau Inggris, lalu AI akan memahami maksudnya dan menjalankan command bot yang sesuai.

Contoh:

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

- Chat AI
- Tanya jawab umum
- Coding dan debugging
- Penjelasan pelajaran
- Ringkasan teks
- Ide caption, bio, konsep, dan lainnya

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

## 🧠 Multi AI Provider

Allogic AI BOT mendukung beberapa provider AI:

- Google / Gemini
- Groq
- OpenRouter

Bot dapat memilih provider secara otomatis berdasarkan jenis tugas.

### Tugas ringan

Untuk chat ringan, command, tools, atau pertanyaan sederhana:

```text
Groq → OpenRouter → Google/Gemini
```

### Tugas berat

Untuk thinking panjang, matematika step-by-step, coding, debugging, analisis, atau instruksi kompleks:

```text
Google/Gemini → Groq → OpenRouter
```

Konfigurasi bisa diatur lewat file `.env`.

---

## ⚠️ Peringatan Penting

Project ini menggunakan Baileys, yaitu library tidak resmi untuk koneksi WhatsApp Multi Device.

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

- Node.js v18 atau lebih baru
- npm
- Git
- FFmpeg
- Python3
- koneksi internet stabil

Untuk VPS Ubuntu/Debian:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git nodejs npm ffmpeg python3 python3-pip -y
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

Kalau ada error dependency, coba:

```bash
npm install --legacy-peer-deps
```

### 3. Buat file `.env`

Salin contoh env:

```bash
cp .env.example .env
```

Edit file `.env`:

```bash
nano .env
```

Isi sesuai kebutuhan.

Contoh konfigurasi:

```env
OWNER_NUMBER=628xxxxxxxxxx

ALLOGIC_AI_PROVIDER=auto

GOOGLE_API_KEY=YOUR_GOOGLE_OR_GEMINI_API_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GOOGLE_API_BASE=https://generativelanguage.googleapis.com/v1beta
GOOGLE_MODEL=gemma-4-26b-a4b-it

GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_API_BASE=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile

OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
OPENROUTER_SITE_URL=https://github.com/fajarsecid/Allogic-AI-BOT
OPENROUTER_APP_NAME=Allogic AI BOT

AI_TEMPERATURE=0.2
AI_MAX_OUTPUT_TOKENS=1000
AI_MAX_HISTORY=6

AI_LIGHT_PROVIDER_ORDER=groq,openrouter,google
AI_HEAVY_PROVIDER_ORDER=google,groq,openrouter
AI_HEAVY_MIN_CHARS=700
AI_HEAVY_HISTORY_CHARS=2500
```

Format owner number:

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

- QR code, atau
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
pm2 restart allogic-ai-bot
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
```

Tes admin group:

```text
.ai tutup grup
.ai buka grup
```

Tes AI berat:

```text
.ai selesaikan soal matematika ini step by step: 2x + 5 = 17
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
├── session/         # session WhatsApp, jangan upload ke GitHub
├── index.js         # entry point bot
├── main.js          # handler utama bot
├── package.json     # dependency project
├── .env             # konfigurasi rahasia, jangan upload
├── .env.example     # contoh konfigurasi
└── README.md
```

---

## 🔒 File yang Tidak Boleh Diupload

Jangan upload file ini ke GitHub:

```text
.env
session/
sessions/
auth/
auth_info_baileys/
baileys_auth_info/
creds.json
baileys_store.json
node_modules/
backup file
```

Gunakan `.gitignore`:

```gitignore
node_modules/
.env
*.env

session/
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
pm2 restart allogic-ai-bot
```

atau:

```bash
pkill -f "node index.js"
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
```

### Dibilang bukan owner

Pastikan `OWNER_NUMBER` benar:

```env
OWNER_NUMBER=628xxxxxxxxxx
```

Jika kamu mengirim dari akun yang sama dengan bot, pastikan logic `fromMe` sudah dianggap owner.

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
pm2 restart allogic-ai-bot
```

---

## ☁️ Upload ke GitHub

Pastikan file sensitif tidak ikut:

```bash
git ls-files | grep -Ei '(^|/)(session/|sessions/|auth/|auth_info_baileys/|baileys_auth_info/|creds.*\.json$|baileys_store\.json$|\.env$)'
```

Jika output kosong, aman.

Commit:

```bash
git add .
git commit -m "Update Allogic AI BOT"
git push
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
