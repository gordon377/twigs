# Twigs

Twigs is a cross-platform mobile app aimed at facilitating logistics between day-to-day interpersonal contacts. It is built with **Expo** and **React Native**, using **Expo Router** for file-based navigation. The app includes an authentication flow (sign up / log in), a tab-based UI, profile management screens, a discover/search experience, and a calendar/events area.

> Tech stack: Expo (SDK 53), React Native, TypeScript, Expo Router, EAS Build/Updates.

---

## Features (current in repo)

### Authentication / onboarding
- Create account flow:
  - Enter email (`app/index.tsx`)
  - Set password (`app/signUpPassword.tsx`)
  - Set up profile info (`app/signUpUser.tsx`)
- Log in screen (`app/logIn.tsx`)
- Uses `expo-secure-store` for storing credentials/tokens (see usage in auth screens and `utils/api` integration).

### App navigation (Expo Router)
- File-based routing via the `app/` directory
- Tab navigation configured in `app/(tabs)/_layout.tsx`
  - Home (`app/(tabs)/home.tsx`)
  - Discover (`app/(tabs)/discover.tsx`)
  - Calendar (`app/(tabs)/calendar/*`)
  - Network (`app/(tabs)/network.tsx`)
  - Profile (`app/(tabs)/profile/*`)

### Discover
- Profile search UI with debounce (`app/(tabs)/discover.tsx`)
- Calls `searchProfiles` from `@/utils/api`

### Calendar / Events
Calendar screens live in `app/(tabs)/calendar/` including:
- `index.tsx` (calendar view)
- `createEvent.tsx`
- `eventDetails.tsx`
- `manageCalendars.tsx`

### Profile
Profile screens live in `app/(tabs)/profile/` including:
- `index.tsx`
- `settings.tsx`
- `manageAccount.tsx`
- Edit flows: `editEmail.tsx`, `editPassword.tsx`, `editUser.tsx`, `editCredentials.tsx`
- `about.tsx`

---

## Project structure

```text
.
├── app/                      # Expo Router routes (file-based navigation)
│   ├── (tabs)/                # Tab group
│   ├── _layout.tsx            # Root router layout
│   ├── +not-found.tsx         # Not found route
│   ├── index.tsx              # Entry screen (sign-up email)
│   ├── logIn.tsx              # Log-in screen
│   ├── signUpPassword.tsx     # Sign-up password step
│   └── signUpUser.tsx         # Sign-up profile step
├── components/                # Reusable UI components
├── contexts/                  # React context providers (e.g., ProfileContext)
├── hooks/                     # Custom hooks
├── schemas/                   # Validation schemas (valibot)
├── styles/                    # Styling helpers
├── utils/                     # API helpers and general utilities
├── assets/                    # Images, icons, SVGs, etc.
├── app.json                   # Expo config
├── eas.json                   # EAS build profiles
└── tsconfig.json              # TypeScript config
