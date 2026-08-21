# NAB Connect

### Smart Hospital Delivery & Logistics Management Platform

NAB Connect is a full-stack hospital delivery and logistics management platform designed to manage products, orders, customers, delivery staff, dispatch operations, and live GPS tracking from a centralized system.

---

## 🚀 Live Application

**Production:**  
https://nab-connect.vercel.app

---

## ✨ Features

### 👤 Customer Portal

- Customer registration and login
- Google OAuth authentication
- Browse available products
- Product details
- Shopping cart
- Order placement
- Order history
- Order status tracking
- Customer profile management

### 🛠️ Admin Portal

- Secure admin authentication
- Admin dashboard
- Product CRUD operations
- Order management
- Customer management
- Delivery agent management
- Assign delivery orders
- Delivery tracking
- Fleet monitoring
- Customer communication/inbox
- Live delivery telemetry

### 🚚 Delivery Staff Portal

- Staff authentication
- View assigned deliveries
- Accept assigned orders
- Update delivery status
- Start/stop GPS tracking
- Live GPS telemetry
- Delivery history
- Staff profile management

### 📍 Live GPS Tracking

- Real-time delivery staff location
- Live latitude and longitude
- GPS accuracy
- Speed monitoring
- Delivery status
- Moving / Idle / Stale / Offline states
- Fleet overview
- Individual delivery-agent tracking
- Automatic map framing
- Realtime synchronization between staff and admin

### 🗺️ Maps

NAB Connect supports map-based delivery tracking.

- OpenStreetMap / Leaflet
- Google Maps support
- Automatic fallback when Google Maps is unavailable
- Interactive delivery markers
- Agent information popups
- Fleet location visualization

### 🔐 Authentication & Security

- Supabase Authentication
- Email/password authentication
- Google OAuth
- Role-based access
- Customer routes
- Admin routes
- Staff routes
- Protected application pages
- Per-tab authentication/session isolation

### 🔄 Multi-Tab Authentication

Customer, Admin, and Staff portals can operate independently in separate browser tabs.

Example:

```text
Tab 1 → Customer
Tab 2 → Admin
Tab 3 → Delivery Staff
