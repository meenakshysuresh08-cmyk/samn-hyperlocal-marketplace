# samn-mobile (Task Manager)

Expo-based React Native mobile app with shared UI design tokens, navigation, authentication, uploads, theme system, and network monitoring.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
yarn install
# or
npm install
```

### 2. Start the Development Server
```bash
npm start
# or
yarn start
# or
npx expo start
```

From the Expo CLI menu, you can:
- Press `a` to open on an **Android** emulator or connected device
- Press `i` to open on an **iOS** simulator
- Press `w` to open on **Web**
- Scan the QR code with the **Expo Go** app on your physical mobile phone

### 3. Run on Specific Platforms Directly
```bash
npm run android # Start and open on Android
npm run ios     # Start and open on iOS
npm run web     # Start and open in browser
```

## 📁 Project Structure

- `src/components/`: Reusable theme-aware UI components (`AppButton`, `AppHeader`, `AppIcon`, `PhotoPicker`, `Screen`, etc.)
- `src/screens/`: Feature screens (Auth, Dashboard, Uploads, Profile, Settings, Chat)
- `src/navigation/`: Root Navigator, Bottom Tab Bar, and navigation stacks
- `src/theme/`: Design tokens, light/dark themes, and Zustand theme store
- `src/services/`: Services for network and file uploads
- `assets/`: App icons, splash screens, and Inter font files

## 🧪 Testing & Linting
```bash
npm test        # Run Jest unit tests
npm run lint    # Run ESLint
```
