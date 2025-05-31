# Panduan Pemula: Dasar Pemrograman & Proyek Manajemen Anggota Gereja

## Bab 1: Dasar-dasar Pemrograman

### 1.1 Apa itu Pemrograman?

Pemrograman adalah proses memberikan instruksi kepada komputer untuk menjalankan tugas tertentu. Instruksi ini ditulis dalam bahasa yang dapat dimengerti oleh komputer, seperti Python, JavaScript, atau Java.

### 1.2 Konsep Dasar Pemrograman

- **Variabel**: Wadah untuk menyimpan nilai/data.

- **Tipe Data**: Tipe umum seperti string, angka, boolean, array.

- **Fungsi**: Blok kode untuk melakukan tugas tertentu.

- **Percabangan**: Logika seperti `if`, `else` untuk pengambilan keputusan.

- **Perulangan (Loop)**: Mengulangi tugas dengan `for` dan `while`.

- **API**: Antarmuka untuk berkomunikasi dengan layanan lain.

### 1.3 Mengapa Belajar Pemrograman?

Pemrograman membantu mengotomatiskan tugas, membuat aplikasi web, menganalisis data, dan menyelesaikan masalah secara efisien.

---

## Bab 2: Proyek – Manajemen Anggota Gereja

Proyek ini menunjukkan cara mengelola data anggota gereja menggunakan Google Form, Google Sheet, dan Google Apps Script.

### 2.1 Kebutuhan Proyek

Sistem ini akan:

1. Mengumpulkan data anggota gereja lewat **Google Form**.

2. Menggunakan **Google Apps Script** untuk:

   - Menambahkan ulang tahun anggota ke **Google Calendar**.

   - Membuat **dua kode QR** (Taipei & Zhongli).

   - Mengirim **email selamat datang** ke anggota beserta QR code.

---

### 2.2 Logika Latar Belakang

**Alur Berpikir:**

```mermaid
flowchart TD
    A((**Mulai**)) --> B[/**Google Form**: Input Data/]
    B --> C[**Google Form**: Simpan Data ke Google Spreadsheet]
    C --> D[**Google Apps Script**:  Mengambil data timestamp, Nama Lengkap, Tanggal Ulang Tahun]
    D --> E[Menambahkan Ulang Tahun ke **Google Calendar**]
    E --> F[Membuat QR Code untuk Taipei & Zhongli]
    F --> G[Mengirim Email Selamat Datang & QR code]
    G --> H((**Selesai**))
```

```mermaid
flowchart TD
    A((Mulai)) --> B[Ambil data dari Google Spreadsheet]
    B --> C{Apakah data sudah diproses?}
    C -- Sudah --> H((Selesai))
    C -- Belum --> D[Ambil Nama, Email, Tanggal Lahir]
    D --> E[Format tanggal lahir (tanpa tahun jika perlu)]
    E --> F[Periksa apakah event sudah ada di Google Calendar]
    F -- Sudah --> H
    F -- Belum --> G[Tambahkan event ulang tahun ke Google Calendar]
    G --> H((Selesai))
```

Diagram di atas menjelaskan langkah-langkah detail proses penambahan ulang tahun ke Google Calendar menggunakan Google Apps Script:

- Ambil data dari Google Spreadsheet.

- Cek apakah data sudah diproses (misal, dengan kolom status atau pengecekan event di kalender).

- Ambil nama, email, dan tanggal lahir.

- Format tanggal lahir sesuai kebutuhan (misal, hanya bulan dan tanggal).

- Cek apakah event ulang tahun sudah ada di Google Calendar.

- Jika belum, tambahkan event baru.

- Selesai.

- Google Form digunakan untuk mengumpulkan:

  - Nama (Bahasa Inggris)

  - Email

  - Tanggal Lahir

- Submisi direkam di Google Sheet.

- Google Apps Script membaca data dari Sheet dan:

  - Menambahkan ulang tahun ke kalender.

  - Membuat QR code berdasarkan waktu submisi dan nama.

  - Mengirim email personal ke anggota.

---

### 2.3 Langkah-langkah Implementasi

#### Langkah 1: Buat Google Form

- Form dengan kolom:

  - `Nama (Bahasa Inggris)`

  - `Email`

  - `Tanggal Lahir`

#### Langkah 2: Hubungkan ke Google Sheet

- Hubungkan form dengan Google Sheet agar semua respon tersimpan otomatis.

#### Langkah 3: Buat QR Code

Gunakan formula ini di Google Sheet untuk QR code:

```excel
=IF(A2<>"", IMAGE("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" & ENCODEURL("https://docs.google.com/forms/d/e/1FAIpQLSfeztXprLdisVVjuv3aJra16_MWE2W4IRRAFdu6ygmfRGgoJA/viewform?usp=pp_url&entry.912489277=" & TEXT($A2, "m/d/yyyy h:mm:ss") & "&entry.2091296168=" & IF(B2<>"", INDEX(SPLIT(B2, " "), 1), "") & "&entry.1008173553=Taipei")), "")
```

- Ganti URL form dan ID `entry` sesuai milik Anda.

- Buat salinan untuk kolom QR Zhongli, ganti `Taipei` menjadi `Zhongli`.

#### Langkah 4: Tambahkan Ulang Tahun ke Google Calendar (Apps Script)

```javascript
function addToCalendar() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  const calendar = CalendarApp.getCalendarById("your_calendar_id@group.calendar.google.com");

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const name = data[i][1];
    const birthday = new Date(data[i][2]);
    calendar.createAllDayEvent(`${name}'s Birthday`, birthday);
  }
}
```

#### Langkah 5: Kirim Email Selamat Datang dengan QR Code

```javascript
function sendWelcomeEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const email = data[i][3];
    const name = data[i][1];
    const qrUrlTaipei = "URL QR Taipei Anda";
    const qrUrlZhongli = "URL QR Zhongli Anda";

    const subject = `Selamat Datang di Gereja, ${name}!`;
    const body = `Dear ${name},

Selamat datang di komunitas gereja!

Berikut QR Code kehadiran Anda:
Taipei: ${qrUrlTaipei}
Zhongli: ${qrUrlZhongli}

Tuhan memberkati,
Admin Gereja`;

    MailApp.sendEmail(email, subject, body);
  }
}
```

> 💡 _Anda bisa mengatur trigger otomatis saat form disubmit._

---

### 2.4 Tips Otomatisasi

- Gunakan `Trigger > On form submit` di Apps Script.

- Gunakan kontrol versi script untuk debugging.

- Coba kirim email ke diri sendiri terlebih dahulu sebagai tes.

---

## Penutup

Panduan ini membantu pemula memahami dasar pemrograman dan membangun proyek nyata untuk manajemen anggota gereja menggunakan Google Apps Script. Cocok untuk komunitas atau pelayanan gereja yang ingin mengelola data secara efisien.

---
