version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      # Mount database and uploads from root directory
      - ./database.db:/app/database.db
      - ./uploads:/app/uploads
      # Also mount the backend source for development
      - ./backend/src:/app/src
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_PATH=/app/database.db
      - UPLOAD_PATH=/app/uploads
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    restart: unless-stopped

volumes:
  uploads:
  database: