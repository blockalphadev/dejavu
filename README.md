# 🔮 DeJaVu

**DeJaVu** adalah platform prediction market generasi baru yang menggabungkan estetika "Tokyo Night" yang dalam, interaksi 3D yang playful, dan performa tinggi. Dibangun untuk memberikan pengalaman pengguna yang tidak hanya fungsional tetapi juga memukau secara visual.

## ✨ Fitur Unggulan

### 🎨 Sistem Tema Cerdas (Tri-Mode)
DeJaVu menghadirkan sistem tema 3 mode yang unik:
- **☀️ Light Mode**: Tampilan bersih, profesional, dan kontras tinggi.
- **🌑 Dark Mode**: Mode gelap klasik (Slate/Black) yang elegan.
- **🌊 System (Tokyo Night)**: Jika sistem operasi Anda dalam mode gelap, DeJaVu secara otomatis beralih ke tema **Tokyo Night** yang eksklusif (Deep Ocean Blue) untuk pengalaman visual yang menenangkan dan futuristik.

### 🧊 Ikon Navigasi 3D (Interactive)
Menu navigasi tidak lagi membosankan. Kami mengganti ikon statis dengan **objek 3D interaktif** menggunakan **Three.js**:
- **📊 Markets**: Kapsul equalizer yang membal (Bouncing Capsules).
- **📈 Dashboards**: Donat futuristik yang berputar (Floating Torus).
- **⚡ Activity**: Atom yang berdenyut (Pulsating Sphere).
- **🏆 Ranks**: Bintang gemuk yang berputar (Chubby Star).
- **🎁 Rewards**: Kotak hadiah yang bergoyang (Wiggling Gift Box).

*Semua ikon dirancang dengan bentuk "cute" (rounded geometries) dan palet warna yang aman untuk Light & Dark mode.*

### ⚡ Performa & UI/UX
- **Responsive Design**: Tampilan sempurna di Desktop (Sidebar & Grid) dan Mobile (Floating Menu).
- **Smooth Animations**: Transisi halus antar halaman dan elemen UI.
- **Anti-Throttling**: Optimasi rendering untuk menjaga FPS tetap tinggi bahkan dengan elemen 3D.

## 🛠️ Teknologi Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + CSS Variables
- **3D Graphics**: React Three Fiber + Three.js
- **Icons**: Lucide React (UI) + Custom 3D Meshes (Nav)
- **State Management**: React Hooks (Context API)

## 📂 Struktur Proyek

```
src/
├── app/
│   ├── components/
│   │   ├── NavIcons.tsx       # 🧊 Komponen Ikon 3D
│   │   ├── Header.tsx         # 🧭 Header dengan Navigasi 3D
│   │   ├── ThemeProvider.tsx  # 🎨 Logic Tema (Tokyo Night)
│   │   ├── ...
│   └── App.tsx                #  Routing & Layout Utama
└── styles/
    └── theme.css              # 💅 Definisi Variabel CSS & Tokyo Night
```

## 🚀 Cara Menjalankan

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Build for Production**
    ```bash
    npm run build
    ```

---

*Built with ❤️ by DeJaVu Team*