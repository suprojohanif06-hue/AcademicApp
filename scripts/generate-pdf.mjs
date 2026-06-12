/**
 * One-time script: generates public/materials/UU-No-1-Tahun-1970.pdf
 * Run with: node scripts/generate-pdf.mjs
 */

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "materials");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "UU-No-1-Tahun-1970.pdf");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const doc = new PDFDocument({ size: "A4", margins: { top: 72, bottom: 72, left: 72, right: 72 }, info: { Title: "UU No. 1 Tahun 1970 tentang Keselamatan Kerja", Author: "Republik Indonesia" } });
const stream = fs.createWriteStream(OUTPUT_FILE);
doc.pipe(stream);

// ── Helpers ────────────────────────────────────────────────────────
const W = 595.28;
const MARGIN = 72;
const TEXT_WIDTH = W - MARGIN * 2;

function heading1(text) {
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#1a1a2e").text(text, { width: TEXT_WIDTH, align: "center" }).moveDown(0.5);
}
function heading2(text) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#1a1a2e").text(text, { width: TEXT_WIDTH }).moveDown(0.3);
}
function body(text) {
  doc.font("Helvetica").fontSize(10).fillColor("#2d2d2d").text(text, { width: TEXT_WIDTH, align: "justify" }).moveDown(0.4);
}
function small(text) {
  doc.font("Helvetica").fontSize(8).fillColor("#666666").text(text, { width: TEXT_WIDTH }).moveDown(0.3);
}
function divider() {
  doc.moveDown(0.3).strokeColor("#cccccc").lineWidth(0.5)
    .moveTo(MARGIN, doc.y).lineTo(W - MARGIN, doc.y).stroke().moveDown(0.5);
}
function newPage(title, page) {
  doc.addPage();
  doc.font("Helvetica").fontSize(7).fillColor("#999999")
    .text(`UU No. 1 Tahun 1970 — Halaman ${page}`, MARGIN, 40, { width: TEXT_WIDTH, align: "right" });
  doc.y = 72;
  if (title) heading2(title);
}

// ── PAGE 1 — Cover ────────────────────────────────────────────────
doc.rect(0, 0, W, 180).fill("#1C2541");
doc.font("Helvetica-Bold").fontSize(9).fillColor("#7FB3D3")
   .text("REPUBLIK INDONESIA", MARGIN, 56, { width: TEXT_WIDTH, align: "center" });
doc.font("Helvetica-Bold").fontSize(22).fillColor("#FFFFFF")
   .text("UNDANG-UNDANG", MARGIN, 74, { width: TEXT_WIDTH, align: "center" });
doc.font("Helvetica-Bold").fontSize(18).fillColor("#F5A623")
   .text("NOMOR 1 TAHUN 1970", MARGIN, 102, { width: TEXT_WIDTH, align: "center" });
doc.font("Helvetica").fontSize(12).fillColor("#D0E4F5")
   .text("TENTANG KESELAMATAN KERJA", MARGIN, 132, { width: TEXT_WIDTH, align: "center" });

doc.y = 200;
body("Dengan Rahmat Tuhan Yang Maha Esa, Presiden Republik Indonesia, Menimbang bahwa setiap tenaga kerja berhak mendapat perlindungan atas keselamatannya dalam melakukan pekerjaan untuk kesejahteraan hidup dan meningkatkan produksi serta produktivitas nasional.");
body("Bahwa setiap orang lainnya yang berada di tempat kerja perlu terjamin pula keselamatannya. Bahwa setiap sumber produksi perlu dipakai dan dipergunakan secara aman dan efisien.");
body("Bahwa berhubung dengan itu perlu diadakan segala daya upaya untuk membina norma-norma perlindungan kerja.");
divider();
small("Ditetapkan di Jakarta, pada tanggal 12 Januari 1970. Presiden Republik Indonesia, SOEHARTO Jenderal TNI.");
doc.font("Helvetica").fontSize(7).fillColor("#999999")
   .text("Halaman 1 dari 12", MARGIN, 750, { width: TEXT_WIDTH, align: "center" });

// ── PAGE 2 — BAB I Tentang Ruang Lingkup ─────────────────────────
newPage("", 2);
heading1("BAB I\nTENTANG RUANG LINGKUP");
divider();
heading2("Pasal 1 — Pengertian");
body("(1) Yang dimaksud dalam Undang-undang ini dengan:");
body("a. \"tempat kerja\" ialah tiap ruangan atau lapangan, tertutup atau terbuka, bergerak atau tetap, dimana tenaga kerja bekerja, atau yang sering dimasuki tenaga kerja untuk keperluan suatu usaha dan dimana terdapat sumber atau sumber-sumber bahaya sebagaimana diperinci dalam pasal 2.");
body("b. \"pengurus\" ialah orang yang mempunyai tugas memimpin langsung sesuatu tempat kerja atau bagiannya yang berdiri sendiri.");
body("c. \"pengusaha\" ialah: 1. orang atau badan hukum yang menjalankan sesuatu usaha milik sendiri dan untuk keperluan itu mempergunakan tempat kerja; 2. orang atau badan hukum yang secara berdiri sendiri menjalankan sesuatu usaha bukan miliknya.");
body("d. \"direktur\" ialah pejabat yang ditunjuk oleh Menteri Tenaga Kerja untuk melaksanakan Undang-undang ini.");
body("e. \"pegawai pengawas\" ialah pegawai teknis berkeahlian khusus dari Departemen Tenaga Kerja yang ditunjuk oleh Menteri Tenaga Kerja.");

// ── PAGE 3 — BAB I Pasal 2 ────────────────────────────────────────
newPage("BAB I — Ruang Lingkup (lanjutan)", 3);
heading2("Pasal 2 — Ruang Lingkup");
body("(1) Yang diatur oleh Undang-undang ini ialah keselamatan kerja dalam segala tempat kerja, baik di darat, di dalam tanah, di permukaan air, di dalam air maupun di udara, yang berada di dalam wilayah kekuasaan hukum Republik Indonesia.");
body("(2) Ketentuan-ketentuan dalam ayat (1) tersebut berlaku dalam tempat kerja di mana:");
body("a. dibuat, dicoba, dipakai atau dipergunakan mesin, pesawat, alat perkakas, peralatan atau instalasi yang berbahaya atau dapat menimbulkan kecelakaan atau peledakan;");
body("b. dibuat, diolah, dipakai, dipergunakan, diperdagangkan, diangkut atau disimpan bahan atau barang yang dapat meledak, mudah terbakar, menggigit, beracun, menimbulkan infeksi, bersuhu tinggi;");
body("c. dikerjakan pembangunan, perbaikan, perawatan, pembersihan atau pembongkaran rumah, gedung atau bangunan lainnya termasuk bangunan pengairan, saluran atau terowongan di bawah tanah dan sebagainya atau di mana dilakukan pekerjaan persiapan.");

// ── PAGE 4 — BAB II Syarat ─────────────────────────────────────────
newPage("BAB II — SYARAT-SYARAT KESELAMATAN KERJA", 4);
heading1("BAB II\nSYARAT-SYARAT KESELAMATAN KERJA");
divider();
body("Undang-undang ini menetapkan syarat-syarat umum keselamatan kerja dalam rangka untuk:");
body("1. Mencegah dan mengurangi kecelakaan kerja yang terjadi di tempat kerja.");
body("2. Mencegah, mengurangi dan memadamkan kebakaran di tempat kerja.");
body("3. Mencegah dan mengurangi bahaya peledakan di tempat kerja.");
body("4. Memberi jalur penyelamatan diri kepada tenaga kerja pada saat terjadi kebakaran maupun kejadian berbahaya lainnya.");
body("5. Memberikan hak perlindungan dan pertolongan pertama pada kecelakaan.");
body("6. Menjamin lingkungan kerja yang sehat dan aman bagi seluruh tenaga kerja di Indonesia.");

// ── PAGE 5 — Pasal 3 (KEY PAGE for citation) ──────────────────────
newPage("BAB II — Pasal 3", 5);
heading2("Pasal 3 — Syarat-Syarat Keselamatan Kerja");
body("(1) Dengan peraturan perundangan ditetapkan syarat-syarat keselamatan kerja untuk:");
body("a. mencegah dan mengurangi kecelakaan;");
body("b. mencegah, mengurangi dan memadamkan kebakaran;");
body("c. mencegah dan mengurangi bahaya peledakan;");
body("d. memberi kesempatan atau jalan menyelamatkan diri pada waktu kebakaran atau kejadian-kejadian lain yang berbahaya;");
body("e. memberi pertolongan pada kecelakaan;");
body("f. memberi alat-perlindungan diri pada para pekerja;");
body("g. mencegah dan mengendalikan timbul atau menyebarluasnya suhu, kelembaban, debu, kotoran, asap, uap, gas, hembusan angin, cuaca, sinar atau radiasi, suara dan getaran;");
body("h. mencegah dan mengendalikan timbulnya penyakit akibat kerja, baik physik maupun psychis, peracunan, infeksi dan penularan;");
body("i. memperoleh penerangan yang cukup dan sesuai;");
body("j. menyelenggarakan suhu dan lembab udara yang baik;");
body("k. menyelenggarakan penyegaran udara yang cukup;");
body("(2) Dengan peraturan perundangan dapat pula ditetapkan syarat-syarat keselamatan kerja di luar hal-hal tersebut di atas.");

// ── PAGE 6 — Pasal 4–5 ────────────────────────────────────────────
newPage("BAB II — Pasal 4 & 5", 6);
heading2("Pasal 4 — Perencanaan dan Pembuatan");
body("(1) Dengan peraturan perundangan ditetapkan syarat-syarat keselamatan kerja dalam perencanaan, pembuatan, pengangkutan, peredaran, perdagangan, pemasangan, pemakaian, penggunaan, pemeliharaan dan penyimpanan bahan, barang, produk teknis dan aparat produksi yang mengandung dan dapat menimbulkan bahaya kecelakaan.");
body("(2) Syarat-syarat tersebut memuat prinsip-prinsip teknis ilmiah menjadi suatu kumpulan ketentuan yang disusun secara teratur, jelas dan praktis yang mencakup bidang konstruksi, bahan, pengolahan dan pembuatan, perlengkapan alat-alat perlindungan, pengujian dan pengesahan, pengepakan atau pembungkusan, pemberian tanda-tanda pengenal atas bahan, barang, produk teknis dan aparat produksi guna menjamin keselamatan barang-barang itu sendiri.");
heading2("Pasal 5 — Pengawasan");
body("(1) Direktur melakukan pelaksanaan umum terhadap Undang-undang ini, sedangkan para pegawai pengawas dan ahli keselamatan kerja ditugaskan menjalankan pengawasan langsung terhadap ditaatinya Undang-undang ini dan membantu pelaksanaannya.");

// ── PAGE 7 — BAB III Pengawasan ────────────────────────────────────
newPage("BAB III — PENGAWASAN", 7);
heading1("BAB III\nPENGAWASAN");
divider();
heading2("Pasal 6 — Panitia Pembina K3");
body("(1) Direktur, para pegawai pengawas dan ahli keselamatan kerja mendapat wewenang untuk memasuki semua tempat kerja, memeriksa buku-buku, dokumen-dokumen dan surat-surat yang diperlukan guna pemeriksaan, mengambil keterangan-keterangan yang dianggap perlu, meminta bantuan kepolisian dalam hal adanya rintangan-rintangan atau halangan-halangan.");
body("(2) Mereka harus merahasiakan segala keterangan tentang rahasia perusahaan atau usaha seseorang yang didapat berhubungan dengan jabatannya.");
heading2("Pasal 7 — Kewenangan Pegawai Pengawas");
body("Untuk keperluan pengawasan sebagaimana tersebut dalam pasal 5, pegawai pengawas diberikan wewenang untuk:");
body("a. Memasuki semua tempat kerja pada setiap waktu;");
body("b. Meminta keterangan dari pengurus maupun tenaga kerja mengenai hal-hal yang berkaitan dengan K3;");
body("c. Memeriksa semua peralatan, mesin, instalasi, bahan berbahaya, dan dokumen;");
body("d. Mengambil foto dan melakukan pengujian terhadap peralatan yang dianggap berbahaya.");

// ── PAGE 8 — Pasal 9 (KEY PAGE for citation) ──────────────────────
newPage("BAB III — Pasal 9", 8);
heading2("Pasal 8 — Pemeriksaan Kesehatan");
body("(1) Pengurus diwajibkan memeriksakan kesehatan badan, kondisi mental dan kemampuan fisik dari tenaga kerja yang akan diterimanya maupun akan dipindahkan sesuai dengan sifat-sifat pekerjaan yang diberikan padanya.");
body("(2) Pengurus diwajibkan memeriksakan semua tenaga kerja yang berada di bawah pimpinannya, secara berkala pada dokter yang ditunjuk oleh pengusaha dan dibenarkan oleh direktur.");
divider();
heading2("Pasal 9 — Pembinaan K3 (Kewajiban Pengurus)");
body("(1) Pengurus diwajibkan menunjukkan dan menjelaskan pada tiap tenaga kerja baru tentang:");
body("a. Kondisi-kondisi dan bahaya-bahaya serta yang dapat timbul dalam tempat kerja;");
body("b. Semua pengamanan dan alat-alat perlindungan yang diharuskan dalam tempat kerja;");
body("c. Alat-alat perlindungan diri bagi tenaga kerja yang bersangkutan;");
body("d. Cara-cara dan sikap yang aman dalam melaksanakan pekerjaannya.");
body("(2) Pengurus hanya dapat mempekerjakan tenaga kerja yang bersangkutan setelah ia yakin bahwa tenaga kerja tersebut telah memahami syarat-syarat tersebut di atas.");
body("(3) Pengurus diwajibkan menyelenggarakan pembinaan bagi semua tenaga kerja yang berada di bawah pimpinannya, dalam pencegahan kecelakaan dan pemberantasan kebakaran serta peningkatan keselamatan dan kesehatan kerja, pula dalam pemberian pertolongan pertama pada kecelakaan.");
body("(4) Pengurus diwajibkan memenuhi dan mentaati semua syarat-syarat dan ketentuan-ketentuan yang berlaku bagi usaha dan tempat kerja yang dijalankannya.");

// ── PAGE 9 — Pasal 10–11 ──────────────────────────────────────────
newPage("BAB III — Pasal 10 & 11", 9);
heading2("Pasal 10 — Panitia Pembina K3");
body("(1) Menteri Tenaga Kerja berwenang membentuk Panitia Pembina Keselamatan dan Kesehatan Kerja guna memperkembangkan kerjasama, saling pengertian dan partisipasi efektif dari pengusaha atau pengurus dan tenaga kerja dalam tempat-tempat kerja untuk melaksanakan tugas dan kewajiban bersama di bidang keselamatan dan kesehatan kerja, dalam rangka melancarkan usaha berproduksi.");
body("(2) Susunan Panitia Pembina Keselamatan dan Kesehatan Kerja, tugas dan lain-lainnya ditetapkan oleh Menteri Tenaga Kerja.");
heading2("Pasal 11 — Pelaporan Kecelakaan");
body("(1) Pengurus diwajibkan melaporkan tiap kecelakaan yang terjadi dalam tempat kerja yang dipimpinnya, pada pejabat yang ditunjuk oleh Menteri Tenaga Kerja.");
body("(2) Tata-cara pelaporan dan pemeriksaan kecelakaan oleh pegawai termaksud dalam ayat (1) diatur dengan peraturan perundangan.");

// ── PAGE 10 — BAB IV Kewajiban (KEY PAGE for citation) ────────────
newPage("BAB IV — KEWAJIBAN DAN HAK TENAGA KERJA", 10);
heading1("BAB IV\nKEWAJIBAN DAN HAK TENAGA KERJA");
divider();
heading2("Pasal 12 — Kewajiban dan Hak Tenaga Kerja");
body("Dengan peraturan perundangan diatur kewajiban dan atau hak tenaga kerja untuk:");
body("a. Memberikan keterangan yang benar bila diminta oleh pegawai pengawas dan atau ahli keselamatan kerja;");
body("b. Memakai alat-alat perlindungan diri yang diwajibkan;");
body("c. Memenuhi dan mentaati semua syarat-syarat keselamatan dan kesehatan kerja yang diwajibkan;");
body("d. Meminta pada pengurus agar dilaksanakan semua syarat keselamatan dan kesehatan kerja yang diwajibkan;");
body("e. Menyatakan keberatan kerja pada pekerjaan di mana syarat keselamatan dan kesehatan kerja serta alat-alat perlindungan diri yang diwajibkan diragukan olehnya kecuali dalam hal-hal khusus ditentukan lain oleh pegawai pengawas dalam batas-batas yang masih dapat dipertanggung-jawabkan.");
heading2("Pasal 13 — Kewajiban Memasuki Tempat Kerja");
body("Barang siapa akan memasuki sesuatu tempat kerja, diwajibkan mentaati semua petunjuk keselamatan kerja dan memakai alat-alat perlindungan diri yang diwajibkan.");

// ── PAGE 11 — Pasal 14 ────────────────────────────────────────────
newPage("BAB IV — Pasal 14", 11);
heading2("Pasal 14 — Kewajiban Pengurus");
body("Pengurus diwajibkan:");
body("a. Secara tertulis menempatkan dalam tempat kerja yang dipimpinnya, semua syarat keselamatan kerja yang diwajibkan, sehelai Undang-undang ini dan semua peraturan pelaksanaannya yang berlaku bagi tempat kerja yang bersangkutan, pada tempat-tempat yang mudah dilihat dan terbaca dan menurut petunjuk pegawai pengawas atau ahli keselamatan kerja;");
body("b. Memasang dalam tempat kerja yang dipimpinnya, semua gambar keselamatan kerja yang diwajibkan dan semua bahan pembinaan lainnya, pada tempat-tempat yang mudah dilihat dan terbaca menurut petunjuk pegawai pengawas atau ahli keselamatan kerja;");
body("c. Menyediakan secara cuma-cuma, semua alat perlindungan diri yang diwajibkan pada tenaga kerja yang berada di bawah pimpinannya dan menyediakan bagi setiap orang lain yang memasuki tempat kerja tersebut, disertai dengan petunjuk-petunjuk yang diperlukan menurut petunjuk pegawai pengawas atau ahli keselamatan kerja.");
divider();
body("Ketentuan pasal 14 ini merupakan salah satu ketentuan terpenting dalam UU No. 1 Tahun 1970, karena secara eksplisit mewajibkan pengurus untuk menyediakan APD secara gratis dan memasang peraturan K3 secara tertulis di tempat kerja. Ini menjadi dasar hukum kewajiban penyediaan APD oleh perusahaan kepada seluruh pekerjanya.");

// ── PAGE 12 — BAB V Ketentuan Penutup ──────────────────────────────
newPage("BAB V — KETENTUAN PENUTUP", 12);
heading1("BAB V\nKETENTUAN PENUTUP");
divider();
heading2("Pasal 15 — Ketentuan Pidana");
body("(1) Tindak pidana atas pelanggaran Undang-undang ini dan peraturan-peraturan pelaksanaannya diancam dengan hukuman kurungan selama-lamanya 3 (tiga) bulan atau denda setinggi-tingginya Rp. 100.000,- (seratus ribu rupiah).");
body("(2) Tindak pidana tersebut adalah pelanggaran.");
heading2("Pasal 16 — Kewajiban Penyesuaian");
body("Pengusaha yang mempergunakan tempat-tempat kerja yang sudah ada pada waktu Undang-undang ini mulai berlaku wajib mengusahakan di dalam satu tahun sesudah Undang-undang ini mulai berlaku, untuk memenuhi ketentuan-ketentuan menurut atau berdasarkan Undang-undang ini.");
heading2("Pasal 17 — Aturan Peralihan");
body("Selama peraturan perundangan untuk melaksanakan ketentuan dalam Undang-undang ini belum dikeluarkan, maka peraturan dalam bidang keselamatan kerja yang ada pada waktu Undang-undang ini mulai berlaku, tetap berlaku sepanjang tidak bertentangan dengan Undang-undang ini.");
heading2("Pasal 18 — Berlakunya Undang-undang");
body("Undang-undang ini disebut \"Undang-undang Keselamatan Kerja\" dan mulai berlaku pada hari diundangkan. Agar setiap orang dapat mengetahuinya, memerintahkan pengundangan Undang-undang ini dengan penempatan dalam Lembaran Negara Republik Indonesia.");
divider();
doc.font("Helvetica-Bold").fontSize(9).fillColor("#1C2541")
   .text("Disahkan di Jakarta, 12 Januari 1970.", { align: "center" }).moveDown(0.3)
   .text("PRESIDEN REPUBLIK INDONESIA,", { align: "center" }).moveDown(0.3)
   .text("SOEHARTO", { align: "center" }).moveDown(0.3)
   .text("Jenderal TNI.", { align: "center" });

// ── Finalize ───────────────────────────────────────────────────────
doc.end();
stream.on("finish", () => {
  console.log(`✅ PDF generated: ${OUTPUT_FILE}`);
});
stream.on("error", (err) => {
  console.error("❌ Error generating PDF:", err);
  process.exit(1);
});
