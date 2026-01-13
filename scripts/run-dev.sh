#!/usr/bin/env bash

# Node env
export NODE_ENV=development

# Export env vars
export $(grep -v '^#' .env | xargs)

# Start docker
docker compose up --build --wait -d

# Migrate database
prisma migrate dev 

# Run app
tsx watch src/index.ts

