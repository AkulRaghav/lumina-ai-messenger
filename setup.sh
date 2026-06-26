#!/bin/bash
# Start Infrastructure
cd infrastructure && docker-compose up -d && cd ..

# Backend Setup
cd services/api && npm install && npx prisma migrate dev --name init && cd ../..

# Mobile Setup
cd clients/mobile && flutter pub get && dart run build_runner build --delete-conflicting-outputs && cd ..

echo "Lumina Environment Ready."
