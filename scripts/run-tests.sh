#!/usr/bin/env bash

# If running in CI environment, we don't need to start
# docker since dependencies are managed in github workflow.
# see .github/workflows/test.yaml

if [ "$1" = "ci" ]; then
    shift;
else
    docker-compose up --build --wait -d;
fi

export NODE_ENV=test;
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/testdb;
export VALKEY_URL=localhost:6379;
export JWT_SECRET=thisisasamplesecret;

prisma migrate reset --force --skip-seed;

vitest $@
