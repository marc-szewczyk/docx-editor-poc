🚀 DOCX Editor POC - Dockerized Version

🔧 Requirements:
- Docker
- Docker Compose

📂 Folder structure:
docx-editor-poc/
├── client/          # React frontend
├── server/          # Node.js backend using LibreOffice CLI
├── docker-compose.yml
└── README.txt

▶️ How to run:

1. Open a terminal in the root project folder
2. Run:

   docker-compose up --build

3. Visit the app:
   http://localhost:5173

🧠 What it does:
- Upload a DOCX file
- Server converts it to HTML using LibreOffice
- Client displays HTML for inline editing (contentEditable)
- Save button sends HTML to backend
- Backend converts edited HTML back to DOCX using LibreOffice
- You can download the updated DOCX file
