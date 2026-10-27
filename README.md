# Agentic AI Website Builder

An AI-powered website builder that transforms natural-language prompts into React websites using the Gemini API.

🚀 **Live Demo:** [Try Agentic AI Website Builder](https://agentic-ai-website-builder-teal.vercel.app/)

## Features

- 🤖 **AI Website Generation** — Generate websites from natural-language prompts.
- ⚡ **Live Preview** — View generated websites using Sandpack.
- 💻 **Code Editor** — Edit project files with Monaco Editor.
- 📁 **File Management** — View, read, and update generated files.
- 📦 **ZIP Export** — Download generated website projects.
- 🔐 **Authentication** — User signup, login, and protected routes.
- 🛡️ **Backend Security** — JWT authentication, rate limiting, and security headers.

## Tech Stack

| Technology | Purpose |
|---|---|
| React + Vite | Frontend |
| Tailwind CSS | Styling |
| Node.js + Express | Backend API |
| Gemini API | AI-powered code generation |
| Sandpack | Live website preview |
| Monaco Editor | Code editing |
| MongoDB + Mongoose | User and data storage |
| JWT + bcryptjs | Authentication |
| JSZip | Project ZIP export |
| Vercel + Render | Deployment |

## How It Works

1. User describes the website they want to build.
2. The backend sends the prompt to the Gemini API.
3. AI-generated files are saved in the website workspace.
4. Sandpack renders the generated website in a live preview.
5. Users can edit code, save changes, and export the project as a ZIP.

## Run Locally

### Prerequisites

- Node.js and npm
- MongoDB connection string
- Gemini API key

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Web-Builder
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secure_random_secret
```

### 3. Start the frontend

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Open the local URL provided by Vite.

## Security

- Keep API keys, database credentials, and JWT secrets out of Git.
- Configure production environment variables in Vercel and Render.
- Never commit `.env` files containing secrets.

## Author

**Krish Rajput**  
MERN Stack Developer | AI Application Development

[GitHub Profile](https://github.com/krishrajputw)
