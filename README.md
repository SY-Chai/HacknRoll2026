# Rewind: Interactive 3D Heritage Journey

An immersive 3D web application allowing users to explore historical archival records of Singapore through an interactive virtual environment. This project combines modern web technologies with AI and archival data to bring history to life.

## Inspiration
This project bridges the generational gap:
*   **For the Elderly**: A nostalgic platform to relive memories by uploading personal old photos and seeing them placed in a historical context. We wanted to give them a way to see their black-and-white memories in color again.
*   **For the Youth**: An engaging, gamified way to learn about history, moving away from textbooks to an interactive 3D world where curiosity is rewarded.

## What it does
Rewind is a time-traveling experience that encourages exploration:
*   **Exploration**: Users stick a landing in a retro-styled 3D world (Chinatown, Old School locations) and navigate to find glowing "memory orbs".
*   **Discovery**:Interacting with an orb pulls up real archival records from the National Archives of Singapore.
*   **Colorization**: Users can instantly colorize black-and-white archival photos to see how the past might have looked in vibrant color.
*   **Compare Mode**: A slider allows users to compare the original history with the reimagined present.
*   **AI Narration**: An intelligent guide narrates the context of the image, making history accessible without reading walls of text.
*   **Memory Lane**: Users can save their favorite discoveries to a personal "book", curating their own museum of memories.
*   **Smart Caching**: The application remembers what you've seen, making subsequent visits instant.

## How we built it
We used a modern tech stack to blend performance with visual fidelity:
*   **Frontend**: Built with **React** and **Vite**. The 3D experience is powered by **React Three Fiber (R3F)** and **Drei**, while **Framer Motion** handles the seamless UI transitions.
*   **Backend**: A **Node.js/Express** server handles the API logic. We use **Cheerio** to ethically scrape and parse data from the National Archives.
*   **AI Integration**: We leveraged **Google Gemini Pro** for generating contextual historical insights and **OpenAI/Kokoro** for Text-to-Speech generation.
*   **Database & Storage**: **Supabase** manages user sessions and the "Memory Lane" database, while **Cloudflare R2** provides low-latency storage for media assets.
*   **Image Processing**: We integrated an external API for the image colorization and comparison slider.

## Challenges we ran into
*   **Rendering Performance**: Balancing a high-fidelity 3D world with HTML overlays was tricky. We faced issues with "black screens" due to React hook ordering violations when mounting/unmounting the heavy 3D canvas, which required careful lifecycle management.
*   **Data Consistency**: Scraping archival data is unpredictable. We had to write robust parsers to handle missing titles, malformed dates, and varying description formats.
*   **Latency**: Generating AI audio and colorizing images takes time. We implemented aggressive caching strategies and optimistic UI updates to make the app feel responsive even while waiting for the server.

## Accomplishments that we're proud of
*   **Seamless Integration**: The transition from the 3D world to the 2D archival view feels natural and unbroken.
*   **The "Magic" Slider**: Seeing a black-and-white photo burst into color with the comparison slider is a genuine "wow" moment for everyone who tries it.
*   **Optimized Caching**: We built a system that caches scraped data and generated assets, significantly reducing load times for popular locations.

## What we learned
*   **The Power of Immersion**: Learning history is much more effective when you are "placed" in the scene rather than just reading about it.
*   **Asset Management**: efficient loading and disposing of 3D assets is crucial for browser performance.
*   **AI as a Companion**: AI works best when it acts as a guide (contextual voiceover) rather than just a content generator.

## What's next for Rewind
*   **Multiplayer Exploration**: Allow users to explore the historical world with friends and family in real-time.
*   **VR Support**: Extend the 3D experience to Virtual Reality headsets for deeper immersion.
*   **Community Stories**: Enable users to share their own stories and photos attached to specific locations.
*   **Mobile App**: Native mobile application for on-the-go historical discovery.

---

## � Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase account
- Cloudflare R2 bucket
- Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/HacknRoll2026.git
    cd HacknRoll2026
    ```

2.  **Install dependencies**
    ```bash
    cd client && npm install
    cd ../server && npm install
    ```

3.  **Setup Environment Variables**
    (See `.env.example` in client and server folders)

4.  **Run the App**
    ```bash
    # Terminal 1 (Server)
    cd server && npm run dev

    # Terminal 2 (Client)
    cd client && npm run dev
    ```