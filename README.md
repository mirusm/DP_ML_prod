# ML-Powered QSAR web tool for predicting ALR1 and ALR2 inhibitor efficacy

![Python](https://img.shields.io/badge/Python-3.12-a?style=flat&logo=python&logoColor=white&labelColor=blue&color=black)
![Django](https://img.shields.io/badge/Django-4.2.18-a?style=flat&logo=django&logoColor=white&labelColor=%23092E20&color=black)
![React](https://img.shields.io/badge/React-19.0-a?style=flat&logo=react&logoColor=white&labelColor=%2361DAFB&color=black)
![Vite](https://img.shields.io/badge/Vite-6.1.0-a?style=flat&logo=vite&logoColor=white&labelColor=%23646CFF&color=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0.6-a?style=flat&logo=tailwind-css&logoColor=white&labelColor=%2306B6D4&color=black)
![Firebase](https://img.shields.io/badge/Firebase-11.3.1-a?style=flat&logo=firebase&logoColor=white&labelColor=%23FFCA28&color=black)

## 🚀 Getting started

This ML-Powered QSAR full-stack web tool is built with Python, Django (backend), and React with Vite and TailwindCSS (frontend). Follow the steps below to set up and run the project on your local machine.

---

## 📦 Installation

### 🔹 Backend setup (Python & Django)

1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```

### 🔹 Frontend Setup (React)

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies (node_modules folder will be created):
   ```sh
   npm i
   ```
3. Install additional package:
   ```sh
   npm install web-vitals
   ```

---

## ▶️ Running the application

### 🖥️ Start backend (Python & Django)

1. Open a terminal and navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Run the Django development server:
   ```sh
   python manage.py runserver
   ```

### 🌐 Start frontend (React)

1. Open another terminal and navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Start the React development server:
   ```sh
   npm run dev
   ```
3. The application is available at:
   ```sh
   http://localhost:5173
   ```
---
## 🛠️ Build

### 🔹 Frontend production build (React)

To create a production-ready build of the frontend and serve it locally for testing:

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Build the production assets:
   ```sh
   npm run build
   ```
3. Install the serve package globally (if not already installed):
   ```sh
   npm install -g serve
   ```
4. Serve the production build locally on port 3000:
   ```sh
   serve -s dist -l 3000
   ```

## 🚀 Deployment

The app is deployed on Hetzner's VPS on IP 49.12.65.96. For deployment were used Dockerfiles on Frontend and Backend together with Nginx.
See docker-compose.yml file in the root folder.

   ```sh
   git clone <repo> # in the /root/code/TP directory

   cd /root/code/TP/ML_production

   sudo docker compose up --build -d 
   ```

When volumes needed to be cleared:
   ```sh
   cd /root/code/TP/ML_production

   sudo docker compose down -v

   sudo docker system prune -a --volumes

   # and again make git pull to have newest changes and build project project again
   sudo docker compose up --build -d 
   ```
To make it autimatically, run in root folder bash script `./runTp.sh` and if prompted somethin, press `y` to confirm and just wait.

### 📌 Backend deployment
See Dockerfile and nginx folder with nginx.conf in the backend directory.
### 📌 Frontend deployment
See Dockerfile in the frontend directory.

---

## 📚 Learn more

- Python: [Python documentation](https://www.python.org/doc/)
- Django: [Django documentation](https://docs.djangoproject.com/en/stable/)
- React: [React documentation](https://reactjs.org/)
- Vite: [Vite documentation](https://vite.dev/)
- TailwindCSS: [TailwindCSS documentation](https://tailwindcss.com/)



