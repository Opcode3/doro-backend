# Doro - Salon & Laundry Booking Platform

**Doro** is an all-in-one marketplace that helps people discover, book, and track trusted nearby salons and laundry services while empowering local businesses with digital tools and access to affordable financing.

Built for the **Nomba Hackathon 2026**.

---

## 🚀 Features

### For Customers
- Discover nearby salons and laundry services
- Real-time booking and scheduling
- Secure payments via Nomba
- Track booking status
- Leave reviews and ratings

### For Merchants (Business Owners)
- Easy business onboarding with Nomba Virtual Accounts
- Manage services and pricing
- Accept/reject bookings
- Receive instant payments
- Business analytics

---

## 🛠 Tech Stack

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Nomba API (Virtual Accounts, Checkout, Webhooks)
- **Authentication**: JWT + Role-Based Access Control (RBAC)
- **API Documentation**: Swagger
- **Architecture**: Modular, Clean Architecture

---

## 📁 Project Structure

```bash
src/
├── common/              # Filters, interceptors, guards, middleware
├── config/
├── core/
├── integrations/
│   └── nomba/           # Nomba Service
├── modules/
│   ├── auth/
│   ├── businesses/
│   ├── services/
│   ├── bookings/
│   ├── reviews/
│   ├── virtual-accounts/
│   └── webhooks/
├── prisma/
└── main.ts