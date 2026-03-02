#!/bin/sh
# Railway entrypoint: ensure all persistent dirs live inside the single volume at /app/data

# Create subdirectories inside the volume
mkdir -p /app/data/store /app/data/groups /app/data/sessions /app/data/logs

# Symlink /app/store and /app/groups into the volume so the app finds them
# Remove existing dirs (created at build time) and replace with symlinks
[ ! -L /app/store ] && rm -rf /app/store && ln -s /app/data/store /app/store
[ ! -L /app/groups ] && rm -rf /app/groups && ln -s /app/data/groups /app/groups

exec "$@"
