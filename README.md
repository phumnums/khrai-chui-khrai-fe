# Khrai Chui Khrai — Frontend

Frontend application for **Khrai Chui Khrai**, a web application that helps people calculate how much each person should pay when sharing purchases through the Thai government subsidy program.

## Demo

Try the live application: [Khrai Chui Khrai](https://khrai-chui-khrai-fe.vercel.app/)

![Khrai Chui Khrai Demo](./demo-KhraiChuiKhrai.gif)

## Overview

When multiple people buy items together, one person may pay the bill using the Thai government subsidy program. Since each person may purchase items of different values, splitting the actual payment equally may not be fair.

Khrai Chui Khrai helps users record payment information and purchased items, then calculates each person's share based on the value of their purchases.

## Features

- Enter the total bill amount, government subsidy, and actual payment amount.
- Automatically calculate the government subsidy and actual payment based on the total amount.
- Add purchased items and associate them with buyers.
- Validate payment information before proceeding.
- Calculate each person's share through the backend API.
- Provide a responsive interface for entering and reviewing purchase information.

## Tech Stack

- **Library:** React
- **Build Tool:** Vite
- **Language:** JavaScript
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository and navigate to the frontend directory.

```bash
git clone <repository-url>
cd <repository-directory>
```

Install dependencies.

```bash
npm install
```

### Environment Variables

Create a `.env` file in the frontend root directory.

```env
VITE_API_BASE_URL=http://localhost:3000
```

Set `VITE_API_BASE_URL` to the backend base URL for the environment you are using.

For production:

```env
VITE_API_BASE_URL=https://khrai-chui-khrai-be.onrender.com
```

Do not append the API endpoint to this variable. The application should append the appropriate path when making API requests.

### Run Locally

Start the development server.

```bash
npm run dev
```

Vite will display the local URL in the terminal, typically:

```text
http://localhost:5173
```

### Build for Production

Create a production build.

```bash
npm run build
```

The generated files will be available in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## API Integration

The frontend communicates with the backend to calculate payment shares.

**Backend Base URL**

```text
https://khrai-chui-khrai-be.onrender.com
```

**Calculate Endpoint**

```http
POST /api/v1/calculate
```

**Full Production URL**

```text
https://khrai-chui-khrai-be.onrender.com/api/v1/calculate
```

The request includes the total bill amount, government subsidy, actual payment amount, and purchased items.

The backend validates the submitted amounts and returns the calculated payment share for each item.

## Deployment

The frontend is deployed on Vercel.

**Production URL**

https://khrai-chui-khrai-fe.vercel.app/

Configure the following environment variable in the Vercel project settings:

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API |

After updating environment variables, redeploy the application for the changes to take effect.


