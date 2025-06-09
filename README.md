# 🗺️ Iloilo Feeder Map

> A modern web application for mapping electrical feeder infrastructure across Iloilo City, with data from MORE Power.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)

## ✨ Features

- 📍 Interactive map with barangay boundaries
- ⚡ Electrical feeder management system
- 🎨 Draw custom coverage areas
- 📊 Real-time feeder coverage visualization
- 🔐 Admin authentication system
- 📱 Responsive design for all devices

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- PostgreSQL database (or any Prisma-supported database)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd iloilo-feeder-map
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database connection string
   DATABASE_URL="postgresql://username:password@localhost:5432/feeder_map"

   # JWT secret for authentication (use a strong random string)
   JWT_SECRET="your-super-secret-jwt-key-here"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed the database**

   ```bash
   # Make a POST request to seed the database
   curl -X POST http://localhost:3000/api/v1/seed
   ```

6. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🌐 Deployment

### Vercel (Recommended)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1. **Connect your repository to Vercel**
2. **Add environment variables in Vercel dashboard:**
   - `DATABASE_URL`
   - `JWT_SECRET`
3. **Deploy!** 🎉

### Other Platforms

For other deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

**Required Environment Variables:**

- `DATABASE_URL` - Your database connection string
- `JWT_SECRET` - Secret key for JWT token generation

---

## 🛠️ Customization Guide

### 🗺️ Adapting for Your City

This application is designed to be easily adapted for other cities' electrical infrastructure mapping:

#### 1. **Map Boundary Data**

- Replace `public/barangay-data.json` with your city's boundary data
- Ensure your GeoJSON follows the same structure with `adm4_psgc` and `adm4_en` properties

#### 2. **Feeder Data**

- Update `public/feeder-data.md` with your feeders and coverage areas
- Follow the format:

  ```markdown
  **[Barangay Name]**

  - [Feeder Name 1]
  - [Feeder Name 2]
  ```

#### 3. **Map Bounds**

Update the map boundaries in both files:

**For Admin View** (`src/components/management/AdminMap.tsx`):

```typescript
const iloiloBounds = L.latLngBounds(
  L.latLng(YOUR_SW_LAT, YOUR_SW_LNG), // Southwest corner
  L.latLng(YOUR_NE_LAT, YOUR_NE_LNG) // Northeast corner
);
```

**For User View** (`src/components/Map.tsx`):

```typescript
// Update similar bounds configuration
```

#### 4. **Database Schema**

The Prisma schema in `prisma/schema.prisma` guides the data structure:

- `Barangay` - Administrative boundaries
- `Feeder` - Electrical feeders
- `FeederCoverage` - Many-to-many relationship
- `FeederPolygon` - Custom drawn coverage areas

#### 5. **Seeding Your Data**

The seeding logic is in `src/app/api/v1/seed/route.ts`. Modify this file to match your data structure and sources.

---

## 📁 Project Structure

```
iloilo-feeder-map/
├── 📁 src/
│   ├── 📁 app/                 # Next.js app router
│   ├── 📁 components/          # React components
│   │   ├── 📁 management/      # Admin components
│   │   └── 📁 ui/             # UI components
│   └── 📁 lib/                # Utilities & configurations
├── 📁 public/                 # Static files
│   ├── 📄 barangay-data.json  # Map boundary data
│   └── 📄 feeder-data.md      # Feeder coverage data
├── 📁 prisma/                 # Database schema
└── 📄 .env                    # Environment variables
```

---

## 🎯 API Routes

| Endpoint               | Method    | Description                              |
| ---------------------- | --------- | ---------------------------------------- |
| `/api/v1/seed`         | POST      | Seed database with initial data          |
| `/api/v1/auth`         | GET/POST  | Admin authentication                     |
| `/api/v1/admin`        | FULL CRUD | Manage feeders, barangays, interruptions |
| `/api/v1/feeders`      | GET       | Feeder database data                     |
| `/api/v1/barangays`    | GET       | Barangay database data                   |
| `/api/v1/interruption` | GET       | Interruption data                        |

---

## 🛡️ Environment Variables

| Variable       | Description                  | Required |
| -------------- | ---------------------------- | -------- |
| `DATABASE_URL` | Database connection string   | ✅ Yes   |
| `JWT_SECRET`   | Secret for JWT token signing | ✅ Yes   |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- OpenStreetMaps, for free map usage!
- Feeder data of Iloilo City from **MORE Power's** facebook page
- Special thanks to the [Altcoder's Barangay Shapefiles](https://github.com/altcoder/philippines-psgc-shapefiles)
- Built with ❤️ for the **Iloilo City** community

---

<div align="center">
  <strong>🌟 Star this project if you find it helpful! 🌟</strong>
</div>
