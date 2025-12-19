# CryonMarket - Quick Start Guide

## 🚀 Memulai Development

### Prerequisites
- Node.js 18+ atau yang lebih baru
- npm, yarn, atau pnpm
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation
```bash
# Clone atau setup project
# Install dependencies
npm install

# atau
pnpm install
```

### Development
```bash
# Start development server
npm run dev

# Server akan berjalan di http://localhost:5173
```

## 📁 Struktur File Penting

```
CryonMarket/
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Main application component
│   │   ├── components/
│   │   │   ├── Header.tsx          # Navigation & theme toggle
│   │   │   ├── HeroSection.tsx     # Featured markets
│   │   │   ├── MarketCard.tsx      # Individual market display
│   │   │   ├── Sidebar.tsx         # Right sidebar content
│   │   │   ├── FilterSection.tsx   # Search & filters
│   │   │   ├── ThemeProvider.tsx   # Theme management
│   │   │   └── ErrorBoundary.tsx   # Error handling
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts      # Search optimization
│   │   │   ├── useThrottle.ts      # Scroll optimization
│   │   │   └── useIntersectionObserver.ts
│   │   └── utils/
│   │       └── formatters.ts        # Number/date formatting
│   └── styles/
│       ├── theme.css               # Color & theme variables
│       └── tailwind.css            # Custom utilities
├── package.json
└── vite.config.ts
```

## 🎨 Customization Guide

### 1. Mengubah Warna Theme

Edit `/src/styles/theme.css`:

```css
/* Dark Mode Colors */
.dark {
  --background: #0f1419;        /* Main background */
  --card: #1a1d23;              /* Card background */
  --primary: #e7e9ea;           /* Primary text */
  --accent: #222529;            /* Accent elements */
  /* ... customize more */
}

/* Light Mode Colors */
:root {
  --background: #ffffff;
  --card: #ffffff;
  /* ... customize more */
}
```

### 2. Menambah Market Card Baru

```tsx
<MarketCard
  emoji="🎯"                    // Icon/emoji
  title="Your Market Title"    // Market question
  badge="NEW"                   // Optional badge
  questions={[
    {
      text: "Question text",    // Optional question
      yesPercent: 75,          // Yes percentage
      noPercent: 25            // No percentage
    }
  ]}
  volume="1.2M"                // Trading volume
  comments={123}               // Comment count
/>
```

### 3. Mengubah Logo

Di `/src/app/components/Header.tsx`:

```tsx
{/* Logo */}
<div className="flex items-center gap-2">
  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-lg">C</span>
  </div>
  <span className="font-bold text-xl hidden sm:block">CryonMarket</span>
</div>
```

Ganti dengan logo custom Anda.

### 4. Menambah Menu Item

Di `/src/app/components/Header.tsx`:

```tsx
<nav className="hidden lg:flex items-center gap-1">
  <NavLink icon="📊" active>Markets</NavLink>
  <NavLink icon="📈">Dashboards</NavLink>
  {/* Tambah item baru di sini */}
  <NavLink icon="🎯">Your Menu</NavLink>
</nav>
```

## 🔧 Key Features Usage

### Theme Toggle
```tsx
import { useTheme } from "./components/ThemeProvider";

function YourComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Debounced Search
```tsx
import { useDebounce } from "../hooks/useDebounce";

function SearchComponent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  useEffect(() => {
    // API call dengan debouncedSearch
    console.log("Searching:", debouncedSearch);
  }, [debouncedSearch]);
}
```

### Formatting Numbers
```tsx
import { formatNumber, formatCurrency } from "../utils/formatters";

// Format: 1,234,567 -> 1.2M
formatNumber(1234567);

// Format: 1234.56 -> $1,234.56
formatCurrency(1234.56);
```

## 📱 Responsive Breakpoints

```tsx
// Tailwind breakpoints yang digunakan:
sm:   640px   // Small devices
md:   768px   // Medium devices (tablets)
lg:   1024px  // Large devices (desktops)
xl:   1280px  // Extra large devices
2xl:  1536px  // 2X large devices
```

### Contoh Penggunaan:
```tsx
<div className="
  px-4           {/* Mobile: 16px padding */}
  md:px-6        {/* Tablet: 24px padding */}
  lg:px-8        {/* Desktop: 32px padding */}
">
  Content
</div>
```

## 🎯 Best Practices

### 1. Component Performance
```tsx
// ✅ Good: Memoized component
export const YourComponent = memo(function YourComponent(props) {
  // Component logic
});

// ✅ Good: Memoized callback
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

### 2. Styling
```tsx
// ✅ Good: Consistent class ordering
className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors"

// Order: Layout → Spacing → Colors → Typography → Effects
```

### 3. Type Safety
```tsx
// ✅ Good: Proper typing
interface CardProps {
  title: string;
  count: number;
  onClick?: () => void;
}

function Card({ title, count, onClick }: CardProps) {
  // Implementation
}
```

## 🐛 Common Issues & Solutions

### Issue 1: Theme tidak persist
**Solution:** Pastikan localStorage enabled di browser.

### Issue 2: Icons tidak muncul
**Solution:** Verify lucide-react package installed:
```bash
npm install lucide-react
```

### Issue 3: Styling tidak apply
**Solution:** Restart dev server setelah mengedit theme.css:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## 🚀 Deployment Ready

### Build untuk Production
```bash
npm run build

# Output: /dist folder
```

### Environment Variables (jika diperlukan)
```env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=CryonMarket
```

## 📚 Additional Resources

- **Tailwind CSS Docs:** https://tailwindcss.com
- **React Docs:** https://react.dev
- **TypeScript Docs:** https://www.typescriptlang.org
- **Vite Docs:** https://vitejs.dev

## 💡 Tips

1. **Development:**
   - Use React DevTools untuk debugging
   - Enable source maps untuk better debugging
   - Use browser's responsive mode untuk testing

2. **Performance:**
   - Monitor bundle size dengan `npm run build`
   - Use Lighthouse untuk performance audit
   - Check Network tab untuk optimization opportunities

3. **Accessibility:**
   - Test dengan keyboard navigation
   - Use screen reader untuk testing
   - Check color contrast ratios

## 🤝 Contributing

Ketika menambah fitur baru:
1. Ikuti struktur folder yang ada
2. Gunakan TypeScript untuk type safety
3. Tambahkan error handling yang proper
4. Test di berbagai screen sizes
5. Update dokumentasi jika perlu

---

Happy coding! 🚀
