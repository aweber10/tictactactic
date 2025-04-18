# TicTacTactic - Ultimate Tic-Tac-Toe

A Progressive Web App implementation of Ultimate Tic-Tac-Toe, a strategic and complex variant of the classic Tic-Tac-Toe game.

## Game Rules

- The board consists of a 3×3 grid of smaller Tic-Tac-Toe boards
- The first player can place their mark in any square on any of the small boards
- The position of a player's move within a small board determines which small board the next player must play in
- A player wins a small board by getting three of their marks in a row (horizontally, vertically, or diagonally)
- The player who wins three small boards in a row (horizontally, vertically, or diagonally) wins the entire game
- If a player is sent to a board that is already won or full, they can place their mark on any open square on any board

## Features

- Responsive design optimized for iPhone 13 and other mobile devices
- Progressive Web App capabilities:
  - Offline functionality with service worker
  - Installable on home screen
  - App icon and splash screens
- Clear visual indicators for:
  - Active boards
  - Won small boards
  - Player turns
  - Game status
- Start screen with game rules
- Play again option after game completion

## Tech Stack

- React with functional components and hooks
- Progressive Web App (PWA) features
- CSS3 with responsive design
- Service Worker for offline capabilities

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

#### `npm test`

Launches the test runner in interactive watch mode.

#### `npm run build`

Builds the app for production to the `build` folder, optimized and ready for deployment.

## Installation as PWA

1. Visit the deployed application in a supported browser (Chrome, Safari, etc.)
2. For iOS:
   - Tap the "Share" button
   - Select "Add to Home Screen"
3. For Android:
   - Tap the menu button (three dots)
   - Select "Add to Home Screen" or "Install App"
4. The app will now be available on your home screen with full offline functionality

## License

MIT