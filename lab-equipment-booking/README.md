# Lab Equipment Booking System (MERN)

A starter full-stack web application for managing university laboratory equipment bookings.

## Features
- Register and log in using JWT authentication
- Roles: student and admin
- Browse/search/filter equipment and check availability
- Request equipment bookings with start/end times and purpose
- Prevent overlapping approved/pending bookings for the same equipment
- Students can view and cancel their own pending bookings
- Admin dashboard: add/edit/delete equipment and approve/reject/cancel bookings
- Equipment status and maintenance notes
- Dashboard summary, booking status labels, responsive UI
- MongoDB persistence via Mongoose

## Requirements
- Node.js 20+ recommended
- MongoDB local server OR MongoDB Atlas connection string

## Run locally

### 1. Backend
```bash
cd backend
copy .env.example .env
```
On PowerShell, edit `.env` and set `MONGODB_URI` to your local MongoDB URI or Atlas connection string.
Then:
```bash
npm install
npm run dev
```
Backend runs at http://localhost:5000. Health endpoint: http://localhost:5000/api/health

### 2. Frontend (new terminal)
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```
Open the Vite URL printed in the terminal (usually http://localhost:5173).

## First admin
Register normally, then in MongoDB Compass / mongosh update that user's role to `admin`:
```js
db.users.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })
```
Log out and log back in. Do not expose an admin registration option publicly.

## Important notes
- This is a learning-project starter, not a production-hardened university deployment.
- Configure HTTPS, strong JWT_SECRET, rate limiting, email verification, backups and institutional approval before real use.
- Booking time is interpreted in the server's local timezone. Configure server timezone consistently with your institution.
- Availability is enforced by the backend, not just the UI. A booking request is rejected if it overlaps another pending/approved booking for that equipment.
