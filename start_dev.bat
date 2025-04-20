@echo off

echo Starting frontend...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo Starting backend...
cd backend
python manage.py runserver