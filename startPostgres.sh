#! /bin/bash
docker-compose up -d && docker logs -f solace-candidate-assignment-main-db-1
