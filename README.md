# 🚀 AlgoRevis

**AlgoRevis** is a comprehensive web application designed to help developers and students track, manage, and revise their algorithmic programming problems efficiently.

## ✨ Features
* 📁 **Folder Management:** Create and organize custom folders for different types of problems.
* 🧠 **Daily Revision Challenges:** A dynamic system that gives you randomized daily challenges to ensure you never forget what you've learned.
* 🔒 **Secure Authentication:** User signup and login system to keep your data private and secure.

## 🛠️ Tech Stack
* **Frontend:** React.js, Vite
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Authentication:** JSON Web Tokens (JWT)

---

## 👶 Beginner Setup Guide
*Are you a beginner or just trying to run this project on your laptop? Follow these simple steps!*

### 🛑 Step 1: What you need to install first
Before you do anything, you need to have a software called **Node.js** installed on your computer.
1. Go to [nodejs.org](https://nodejs.org/).
2. Download and install the version that says "LTS" (Recommended for most users).
3. Just keep clicking "Next" during the installation until it's finished.

### 🔑 Step 2: Set up the secret passwords (.env file)
The backend needs some passwords to connect to the database. These are hidden for security reasons, so you have to create a file for them.

1. Open the `backend` folder.
2. Create a brand new text file and name it exactly: `.env` 
   *(Make sure it doesn't accidentally save as `.env.txt`!)*
3. Open this `.env` file in Notepad (or any text editor) and paste the following exactly as it is:

```text
PORT=5000
MONGO_URI=mongodb+srv://harsh:harsh123@cluster0.vdyvoi8.mongodb.net/my_project_db?appName=Cluster0
JWT_SECRET=add_your_secret_key_here
```
4. Save and close the `.env` file.

### ⚙️ Step 3: Start the Backend (Server)
Now we need to turn on the "engine" of the website.

1. Open your computer's Terminal (or Command Prompt).
2. Navigate into the `backend` folder.
   *(Tip: You can usually right-click inside the folder and select "Open in Terminal")*
3. Type this command and press Enter:
   ```bash
   npm install
   ```
   *(Wait a minute for it to download all the necessary files. You will see a new folder called `node_modules` appear. This is completely normal!)*
4. Once that finishes, type this command and press Enter to start the server:
   ```bash
   npm start
   ```
   *(If `npm start` gives an error, try `node server.js` instead).*
5. **DO NOT CLOSE THIS TERMINAL WINDOW.** Leave it running in the background.

### 🎨 Step 4: Start the Frontend (Website)
Now we will turn on the visual part of the website!

1. Open a **brand new** Terminal (or Command Prompt) window.
2. Navigate into the `frontend` folder.
3. Type this command and press Enter:
   ```bash
   npm install
   ```
   *(Wait for it to download files, just like before).*
4. Once it finishes, type this command and press Enter:
   ```bash
   npm run dev
   ```
5. It will process for a few seconds, and then give you a local web link (usually something like `http://localhost:5173/`).
6. Hold `Ctrl` on your keyboard and click that link, or copy and paste it into your web browser.

🎉 **You are done! The website should now be loaded on your screen!** 🎉

---

## 👨‍💻 Author / Credits
**AlgoRevis** was proudly created and developed entirely by **Harsh and Arpita**

([@harsh13satyam](https://github.com/harsh13satyam)). 

*If you found this project helpful or use it yourself, feel free to give it a ⭐ on GitHub!*
