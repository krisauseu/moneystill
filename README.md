# moneystill – Budget Planner

A personal budget planning application built with **React** and **PocketBase**. Track income, expenses, and savings with monthly breakdowns, scenario planning, rich analytics, and PDF export.

## Features

- **Monthly Budget Table** – Track income, fixed expenses, and variable expenses across all 12 months
- **Scenario Planning** – Create "what-if" scenarios to compare against live data
- **Rich Analytics** – Sankey flow charts, expense distribution, trend analysis, savings rate
- **PDF Export** – Generate professional reports in US Letter format
- **Stripe Subscriptions** – Integrated billing with Stripe Checkout and Customer Portal
- **Dark Mode** – Full dark/light theme support
- **PWA** – Installable progressive web app with offline caching
- **Onboarding Wizard** – Guided setup with 5 US-optimized budget profiles
- **Data Portability** – Export/import your data as JSON backups

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React + Vite                  |
| Backend   | PocketBase                    |
| Payments  | Stripe (Checkout + Webhooks)  |
| Styling   | Tailwind CSS                  |
| Charts    | Chart.js / Recharts           |
| PDF       | jsPDF + html2canvas           |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PocketBase](https://pocketbase.io/) v0.22+

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/krisauseu/moneystill.git
   cd moneystill
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start PocketBase:**
   ```bash
   ./pocketbase serve
   ```

4. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173)

### Docker Deployment

```bash
# Build and start all services
docker compose up -d --build

# Frontend: http://localhost:3000
# PocketBase Admin: http://localhost:8090/_/
```

### Environment Variables

| Variable              | Description                          | Example                          |
|-----------------------|--------------------------------------|----------------------------------|
| `VITE_POCKETBASE_URL` | PocketBase API URL                   | `http://localhost:8090`          |
| `STRIPE_SECRET_KEY`   | Stripe secret key                    | `sk_test_...`                    |
| `STRIPE_PRICE_ID`     | Stripe subscription price ID        | `price_...`                      |
| `FRONTEND_URL`        | Public frontend URL (for redirects)  | `https://app.moneystill.com`    |

## Project Structure

```
moneystill/
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── data/       # Onboarding profiles
│   │   ├── utils/      # PDF generation, data mapping
│   │   ├── api/        # PocketBase API layer
│   │   ├── context/    # Auth & Theme providers
│   │   └── lib/        # PocketBase client
│   ├── Dockerfile
│   └── package.json
├── pb_hooks/           # PocketBase hooks (Stripe integration)
├── docker-compose.yml  # Multi-service Docker setup
├── .env.example        # Environment variable template
└── README.md
```

## License

AGPL-3.0-only – See [LICENSE](LICENSE) for details.
