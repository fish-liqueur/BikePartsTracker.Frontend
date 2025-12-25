# BikePartsTracker.Frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

A modern Vue 3 frontend application for managing bike parts and maintenance, built with TypeScript, Pinia, and Vue Router.

## 🚀 Features

- **Authentication System**: Login/Register with JWT tokens
- **Bike Management**: Add, edit, and delete bikes
- **Parts Tracking**: Monitor bike parts and their usage
- **Maintenance Logging**: Track maintenance history and costs
- **Responsive Design**: Mobile-friendly interface
- **Type Safety**: Full TypeScript support
- **State Management**: Pinia stores for reactive state

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Pinia** - State management for Vue
- **Vue Router** - Official router for Vue.js
- **Quasar** - Vue.js based framework for building responsive apps
- **Axios** - HTTP client for API communication
- **Vite** - Fast build tool and dev server
- **Vitest** - Fast unit test framework powered by Vite

## 📋 Prerequisites

- Node.js 18+ (recommended: Node.js 20+)
- npm or yarn package manager
- Running .NET backend API (see backend README)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=10000
NODE_ENV=development

# Strava OAuth Configuration
VITE_STRAVA_CLIENT_ID=your_strava_client_id
VITE_STRAVA_REDIRECT_URI=http://localhost:5173/strava/callback
```

**Note**: To find your backend port:

**For .NET Backend:**
- Check `Properties/launchSettings.json` in your backend project
- Look for the `applicationUrl` or `launchUrl` property
- Common ports: `http://localhost:8080` or `https://localhost:5001` (HTTPS) or `http://localhost:5192`
- You can also check the console output when starting your backend - it will show the listening URL

**Quick check:**
- When your backend starts, it will print something like: `Now listening on: http://localhost:8080`
- Or visit `http://localhost:8080/swagger` (or your backend's Swagger URL) to verify

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## 🔧 Development

### Project Structure

```
src/
├── components/          # Reusable Vue components
├── views/              # Page components
│   ├── LoginView.vue   # Authentication page
│   ├── DashboardView.vue # Main dashboard
│   └── ...
├── stores/             # Pinia state stores
│   ├── authStore.ts    # Authentication state
│   ├── bikesStore.ts   # Bikes management
│   └── ...
├── services/           # API service layer
│   ├── api.ts         # Base API configuration
│   ├── authService.ts  # Authentication API calls
│   ├── bikeService.ts  # Bikes API calls
│   └── ...
├── types/              # TypeScript type definitions
│   └── index.ts       # Shared types and interfaces
└── router/             # Vue Router configuration
    └── index.ts       # Route definitions and guards
```

### Key Components

#### Authentication Store (`authStore.ts`)
- Manages user authentication state
- Handles login/logout operations
- Stores JWT tokens and user data

#### API Service (`api.ts`)
- Centralized HTTP client configuration
- Automatic token injection
- Error handling and interceptors

#### Bike Store (`bikesStore.ts`)
- Manages bike data and operations
- CRUD operations for bikes
- Reactive state updates

### API Integration

The frontend communicates with your .NET backend through RESTful API endpoints:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Bikes**: `/api/bikes`
- **Parts**: `/api/parts`
- **Maintenance**: `/api/maintenance`
- **Strava**: `/api/strava/authorize`, `/api/strava/disconnect`

### Adding New Features

1. **Create Types**: Add interfaces in `src/types/index.ts`
2. **Create Service**: Add API methods in appropriate service files
3. **Create Store**: Add state management in Pinia stores
4. **Create Views**: Add new page components in `src/views/`
5. **Update Router**: Add new routes in `src/router/index.ts`

## 🔒 Security

- JWT tokens stored in localStorage
- Automatic token injection in API requests
- Route guards for protected pages
- Automatic logout on token expiration

## 📱 Responsive Design

The application is built with mobile-first design principles and includes:
- Responsive grid layouts
- Touch-friendly buttons and forms
- Mobile-optimized navigation
- Adaptive typography and spacing

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for unit testing

### Test Commands

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests with interactive UI
npm run test:ui

# Run tests once (for CI/CD)
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are organized alongside the code they test:

```
src/
├── components/
│   ├── layouts/
│   │   ├── LayoutBase.vue
│   │   └── __tests__/
│   │       └── LayoutBase.test.ts
│  
├── services/
│   ├── authService.ts
│   └── __tests__/
│       └── authService.test.ts
├── stores/
│   ├── authStore.ts
│   └── __tests__/
│       └── authStore.test.ts
└── test/
    └── setup.ts          # Test configuration and mocks
```

### Writing Tests

#### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }]
    })
    
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [Quasar, router, createPinia()]
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})
```

#### Service Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myService } from '../myService'

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('myService', () => {
  it('should perform action', async () => {
    // Test implementation
  })
})
```

#### Store Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyStore } from '../myStore'

describe('myStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should update state', () => {
    const store = useMyStore()
    store.updateValue('test')
    expect(store.value).toBe('test')
  })
})
```

### Test Coverage

Run tests with coverage to see which parts of your code are tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in your browser to view a detailed coverage report.

### Test Configuration

Test configuration is in `vite.config.ts`:

- **Environment**: `happy-dom` (lightweight DOM implementation)
- **Setup File**: `src/test/setup.ts` (mocks and global test configuration)
- **Coverage Provider**: `v8` (fast and accurate)

### Mocking

The test setup includes mocks for:
- **localStorage**: In-memory storage for tests
- **window.location**: Mocked for navigation tests
- **Quasar plugins**: Notify, Loading, etc.

### Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component/service does, not how it does it
2. **Keep Tests Isolated**: Each test should be independent and not rely on other tests
3. **Use Descriptive Names**: Test names should clearly describe what they're testing
4. **Mock External Dependencies**: Mock API calls, localStorage, and other external services
5. **Test Edge Cases**: Include tests for error conditions and edge cases
6. **Maintain Test Coverage**: Aim for high coverage, especially for critical business logic

## 📦 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend is running on correct port
   - Check `.env` file configuration - verify `VITE_API_BASE_URL` matches your backend port
   - To find your backend port:
     - Check backend console output when starting (shows "Now listening on: http://localhost:XXXX")
     - Check `Properties/launchSettings.json` in your .NET backend project
     - Try accessing `http://localhost:XXXX/swagger` where XXXX is the port
   - Verify CORS settings in backend
   - **Important**: Restart your frontend dev server after changing `.env` file

2. **Authentication Issues**
   - Clear localStorage and try logging in again
   - Check browser console for error messages
   - Verify JWT token format

3. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify TypeScript configuration

### Debug Mode

Enable debug logging by setting in browser console:
```javascript
localStorage.setItem('debug', 'true')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related

- [Backend Repository](../BikePartsTracker.Backend) - .NET Web API
- [API Documentation](http://localhost:8080/swagger) - Swagger UI (when backend is running, check your backend port)

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the backend logs
3. Open an issue on GitHub
4. Contact the development team