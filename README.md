# KiranaPOS: High-Frequency Retail Engine

KiranaPOS is an offline-first transaction engine built for high-speed local retail environments where network latency is unacceptable. 

### 🏗️ Tech Stack
* **Framework:** React Native, Expo, TypeScript
* **Local Database:** WatermelonDB, SQLite
* **Architecture:** Offline-First, Asynchronous State Syncing

### ⚙️ Architectural Focus & Bottlenecks Solved
* **Sub-5ms Query Execution:** Migrated from standard state management to WatermelonDB over SQLite, allowing the system to query 10,000+ local products instantly without blocking the UI thread.
* **Offline-First Synchronization:** Engineered a robust local-first state machine that securely caches transactions during network drops and asynchronously syncs with the central server upon reconnection.
* **Memory Optimization:** Structured flat lists and relational data models to prevent memory leaks during extended, high-frequency scanning sessions.