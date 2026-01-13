#!/usr/bin/env bash

prisma migrate deploy
export NODE_ENV=production
node dist/index.js
