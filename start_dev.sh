#!/bin/bash

set -e

echo "Starting frontend..."
cd frontend
npm run dev &
cd ..

echo "Starting backend..."
cd backend
python manage.py runserver