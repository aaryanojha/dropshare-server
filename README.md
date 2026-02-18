# DropShare – Backend

REST API built with Express and MongoDB for secure, one-time sharing of text, links, and files.

Each shared item:
- Generates a unique access code
- Expires automatically (MongoDB TTL index)
- Is deleted permanently after first retrieval

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Multer (file handling)
- CORS
- dotenv

## Core Features

- POST /api/text  
- GET /api/text/:code  

- POST /api/link  
- GET /api/link/:code  

- POST /api/file  
- GET /api/file/:code  

Files are stored temporarily and removed after download.  
Text and links are deleted after retrieval.

## Live API

https://dropshare-server.onrender.com
