
# Tree Inventory - Tree Management System

A web-based application to digitally manage and monitor trees within a campus using QR codes, role-based access, and real-time reporting.
This project was developed as a hackathon MVP, prioritizing core functionality and real-world feasibility over UI polish and edge-case handling.

![Status](https://img.shields.io/badge/status-active-success)
![Hackathon](https://img.shields.io/badge/hackathon-project-blue)
![Sustainability](https://img.shields.io/badge/Sustainability-Green-darkgreen)

## Features

- QR code generated for each tree
- Scan & report issues without login
- Role-based access (Admin, Caretaker, Observer)
- Zone-wise tree assignment
- Real-time Firestore updates
- Notification system for caretakers

## User Roles

| Role      | Permissions                                              |
| --------- | -------------------------------------------------------- |
| Admin     | Full access to manage zones, trees, users, and analytics |
| Caretaker | Manage trees and observations in assigned zone           |
| Observer  | Submit observations via tree QR page                     |


## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Firebase (Backend-as-a-Service)
- Database: Firebase Firestore
- Authentication: Firebase Authentication
- QR Generation: qrcode.js

  
## Screenshots

- Admin Dashboard
  
    <img src="screenshots/admin.jpg" alt="Admin Dashboard" width="600" > 
  
- Caretaker dashboard
  
    <img src="screenshots/caretaker.jpg" alt="Admin Dashboard" width="600">

## Optimizations

- Indexed Firestore queries
- Cached QR URLs
- Reduced duplicate reads

## Use Case

- College campuses
- Municipal tree departments
- NGOs working on urban greenery
- Environmental audits
  
## Future Scope

- Image-based issue reporting
- AI disease detection
- Map-based tree visualization
- Mobile app for caretakers

## Demo

- Live App: [https://tree-inventory](https://tree-inventory.netlify.app/)
- Demo Video: https://youtu.be/your-video

## Team

- [@Harshatha Rithika](https://www.github.com/harshatha-exe) - Team Leader - System Design / Documentation
- [@Abinaya](https://www.github.com/abinaya2006) - Frontend UI / Backend Logic / Firebase Intergration
- [@Manaswini](https://www.github.com/ksm-13) - Idea / Research / Testing

