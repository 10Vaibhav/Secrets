# Secrets

Secrets is a web application that allows users to anonymously share their secrets. It features both local authentication and Google OAuth 2.0 integration for user management.

## Features

- User authentication (Local and Google OAuth 2.0)
- Secure password hashing using bcrypt
- Session management
- PostgreSQL database integration
- Ability to submit and view secrets
- Protected routes for authenticated users


## Installation

1. Create a `.env` file in the root directory with the following variables:
```
user=<your-postgres-username>
host=<your-postgres-host>
database=<your-database-name>
password=<your-postgres-password>
port=<your-postgres-port>
secret=<your-session-secret>
resave=false
saveUninitialized=false
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

2. Set up the PostgreSQL database:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    secret TEXT
);
```

## Usage

1. Access the application at `http://localhost:3000`

## Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/secrets` - View secrets (protected route)
- `/submit` - Submit a secret (protected route)
- `/auth/google` - Google authentication
- `/logout` - Logout

## Tech Stack

- Express.js - Web framework
- Passport.js - Authentication middleware
- PostgreSQL - Database
- EJS - View engine
- bcrypt - Password hashing
- express-session - Session management

## Security Features

- Passwords are hashed using bcrypt with 10 salt rounds
- Session management with express-session
- Protected routes requiring authentication
- Google OAuth 2.0 integration for secure third-party authentication

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
This repository is licensed under the [MIT License](LICENSE).


