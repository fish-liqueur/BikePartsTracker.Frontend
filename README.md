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
- **Axios** - HTTP client for API communication
- **Vite** - Fast build tool and dev server

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
VITE_API_BASE_URL=http://localhost:5192
VITE_API_TIMEOUT=10000
NODE_ENV=development
```

**Note**: The backend should be running on `http://localhost:5192` (or update the URL to match your backend configuration).

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

```bash
# Run unit tests
npm run test:unit

# Run e2e tests
npm run test:e2e

# Run all tests
npm run test
```

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
   - Check `.env` file configuration
   - Verify CORS settings in backend

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
- [API Documentation](http://localhost:5192/swagger) - Swagger UI (when backend is running)

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the backend logs
3. Open an issue on GitHub
4. Contact the development team