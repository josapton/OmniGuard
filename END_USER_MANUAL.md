# 📖 Panduan Pengguna (End-User Manual) OmniGuard

Selamat datang di **OmniGuard**, Asisten Cerdas Pemetaan Area Serangan (Attack Surface) dan Intelijen Ancaman Siber (Threat Intelligence). Aplikasi web ini dirancang agar mudah dinavigasi, memungkinkan Anda menganalisis kerentanan sistem Anda seperti seorang profesional dengan bantuan AI.

Berikut adalah panduan lengkap berdasarkan menu yang ada di layar Anda.

---

## 🔐 1. Memulai (Daftar & Masuk)
1. Buka tautan website OmniGuard: **[https://omniguard.imrnes.team](https://omniguard.imrnes.team)**.
2. Jika Anda pengguna baru, pilih tab **Sign Up** (Daftar), masukkan Email dan buat Kata Sandi (Password), lalu klik **Register**.
3. Jika sudah memiliki akun, pilih tab **Sign In** (Masuk), masukkan kredensial Anda, dan klik **Login**.

> [!NOTE]
> Setelah berhasil masuk, perhatikan deretan menu (*sidebar*) di sebelah kiri layar Anda. Menu-menu inilah yang akan menjadi ruang kerja utama Anda.

---

## 📊 2. Panduan Menu Navigasi (Sidebar)

### 📈 Dashboard
Ini adalah halaman Beranda (Homepage) Anda.
- **Fungsi**: Menampilkan rangkuman cepat atau status terkini dari seluruh aset digital yang sedang Anda pantau. Anda bisa melihat grafik *Risk Score* keseluruhan dan statistik temuan kerentanan (*Critical, High, Medium, Low*) di sini secara sekilas.

### 🎯 Threat Modeling
- **Fungsi**: Simulasi jalur serangan (Attack Path).
- **Cara Pakai**: AI OmniGuard akan memodelkan bagaimana seorang peretas (*Hacker*) mungkin menyerang sistem Anda. Anda bisa melihat analisis langkah-demi-langkah dari titik masuk (*entry point*) hingga kemungkinan eskalasi (*privilege escalation*). Sangat berguna untuk menyusun strategi pertahanan preventif.

### 🌐 Exposure (Pemindaian Aset Utama)
Ini adalah **menu paling penting** di OmniGuard, tempat Anda mencari tahu celah keamanan pada *website* Anda.
- **Cara Pakai**:
  1. Masukkan alamat domain yang ingin diuji (misal: `toko-anda.com`) di kolom pencarian.
  2. Klik tombol **Scan** untuk memulai pemindaian.
  3. Setelah selesai, Anda akan mendapatkan laporan yang berisi:
     - **Risk Score** (Skor Risiko). Semakin tinggi angkanya, semakin berbahaya.
     - **Open Ports** (Port yang terbuka ke internet).
     - **Technologies** (Software atau teknologi yang dipakai *website* tersebut).
     - **Vulnerabilities** (Cacat keamanan / CVE yang berpotensi diserang).

### 🔧 Auto-Remediation (Perbaikan Otomatis)
- **Fungsi**: Solusi instan untuk celah keamanan yang ditemukan.
- **Cara Pakai**: Jika menu *Exposure* mendeteksi adanya celah keamanan (*vulnerability*), buka menu ini. AI akan merumuskan kode spesifik (*Bash script, iptables, atau Ansible playbook*) yang bisa langsung diserahkan kepada teknisi/Tim IT Anda untuk ditambal (*patch*) hari itu juga.

### 🕵️ Deep OSINT (Intelijen Ancaman)
- **Fungsi**: Mesin pencari khusus intelijen siber (*Threat Intelligence*).
- **Cara Pakai**: Ketikkan kata kunci ancaman (misal nama ransomware, nomor CVE, atau insiden kebocoran data terbaru). AI OmniGuard akan mengumpulkan data dari internet dan sumber terbuka (OSINT) untuk memberikan Anda rangkuman informasi intelijen yang komprehensif terkait ancaman tersebut.

### 🕒 History (Riwayat)
- **Fungsi**: Arsip lengkap pemindaian.
- **Cara Pakai**: Setiap domain yang pernah Anda *scan* di masa lalu akan tersimpan di sini. Anda dapat membuka kembali laporan lama tanpa perlu memindai ulang untuk melihat bagaimana kondisi keamanan aset Anda saat itu.

### ⚖️ Compare (Bandingkan)
- **Fungsi**: Melacak perbaikan keamanan.
- **Cara Pakai**: Pilih dua laporan pemindaian (*scan*) dari domain yang sama di waktu yang berbeda (misal: Scan bulan Januari vs Scan bulan Februari). Sistem akan menyoroti apakah celah keamanan (*vulnerability*) sudah berkurang (ditambal) atau malah bertambah memburuk.

### 🛡️ Policies (Kebijakan)
- **Fungsi**: Mengatur ambang batas keamanan (Security Thresholds).
- **Cara Pakai**: Di sini Anda dapat menentukan aturan internal. Misalnya, Anda bisa mengatur agar sistem memberi peringatan "Kritis" jika *Risk Score* melebihi angka tertentu, atau menentukan *port* apa saja yang dilarang keras untuk terbuka.

### ⚙️ Settings (Pengaturan)
- **Fungsi**: Konfigurasi akun dan profil Anda.
- **Cara Pakai**: Gunakan menu ini untuk mengubah *password*, mengelola sesi login, atau memperbarui informasi profil akun Anda.

---
*OmniGuard dirancang untuk memudahkan Anda mengambil keputusan keamanan tanpa harus terjebak dalam kerumitan kode teknis. Jika Anda menemui istilah yang membingungkan, gunakan intuisi AI yang disediakan untuk menjelaskannya!*
