# weFound Server (Node + Express + MongoDB)

## Setup
1. Copy env:
   - `cp .env.example .env`
2. Update `MONGODB_URI` and `JWT_SECRET`.
3. Install deps:
   - `npm install`
4. Start server:
   - `npm run dev`

## API Routes
- `POST /auth/register`
- `POST /auth/login`
- `GET /me` (auth)
- `PUT /me` (auth)
- `POST /stickers` (auth)
- `GET /stickers` (auth)
- `POST /stickers/:id/map` (auth)
- `POST /stickers/:id/deactivate` (auth)
- `POST /items` (auth)
- `GET /items` (auth)
- `PUT /items/:id` (auth)
- `DELETE /items/:id` (auth)
- `POST /scans`
- `GET /scans/sticker/:id` (auth)
- `GET /s/:shortCode` (public)
