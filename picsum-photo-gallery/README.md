# 🖼️ React Picsum Photo Gallery

A responsive React app that displays photos from the **Lorem Picsum API**, featuring infinite scrolling and a detailed photo view.
Built to demonstrate API integration, routing, and responsive UI design.

---

## 🌐 Access Links

| Resource              | URL                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Live Demo**         | [https://picsum-photo-gallery.netlify.app](https://picsum-photo-gallery.netlify.app) |
| **GitHub Repository** | [https://github.com/ngocnhu100/IA02](https://github.com/ngocnhu100/IA02)             |

---

## ⚙️ Run Locally

```bash
# Clone the repository
git clone https://github.com/ngocnhu100/IA02.git
cd IA02/picsum-photo-gallery

# Install dependencies
npm install

# Run the app
npm run dev
```

Then open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧩 Features

### 🖼️ Core Features

- Fetches and displays photo data from the **Lorem Picsum API**
- Responsive **grid or list** layout for browsing photos
- **Infinite scrolling** to automatically load more images as you scroll
- Click any photo to open a **detailed view** with author and full-size image
- Smooth **loading indicators** and **error handling** for better UX

### 🧭 Navigation & Routing

- Built with **React Router DOM**
- Routes:

  - `/photos` → Photo gallery view
  - `/photos/:id` → Detailed photo view

- Configured for **Netlify SPA routing** (`_redirects` file included)

### 🔍 Enhanced Interaction Features

- **Zoom Controls**

  - Supports **pinch-to-zoom** on touch devices
  - **+ / – buttons** for manual zoom on desktop
  - Smooth zoom transitions with reset option

- **Image Click to Enlarge**

  - Clicking the photo in the detail view toggles an **enlarged (lightbox-style)** display
  - Useful for examining full-resolution images without leaving the app

- **Layout Switcher**

  - Toggle between **Grid View** and **List View** dynamically
  - Layout preference retained while browsing

- **External Links (Detail Page)**

  - **"Go to Unsplash"** → Opens the image’s source page
  - **"Download Original"** → Opens the high-resolution image in a new tab

### 🎨 Styling & Responsiveness

- Designed with **Tailwind CSS** for a clean and adaptive interface
- Fully responsive layout for both desktop and mobile
