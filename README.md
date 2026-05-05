# Vehicle Details Search

Production-focused Next.js application for searching vehicle details by registration number.

## Features

- Search by registration number from the homepage UI.
- URL param support: `/?registrationNumber=AP09DR9900`.
- Internal server API route: `/api/vehicle/search`.
- Input validation and upstream timeout handling.
- Structured result rendering (vehicle, contractor, site, driver).

## Environment Variables

Create a `.env.local` file:

```bash
VEHICLE_API_BASE_URL=https://vi-backend.theamaravaticity.com
```

If not provided, the app uses the same URL as default.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run lint
npm run build
npm run start
```
