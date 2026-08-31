#!/usr/bin/env bash
# Create the lab VM used by this module, then show how to reach it.
#
# Usage: ./create-vm.sh <your-project-id>
# Delete it again with:
#   gcloud compute instances delete linux-lab --zone us-central1-a

set -euo pipefail

PROJECT="${1:?Usage: create-vm.sh <your-project-id>}"
INSTANCE=linux-lab
ZONE=us-central1-a

gcloud config set project "$PROJECT"

gcloud compute instances create "$INSTANCE" \
  --zone "$ZONE" \
  --machine-type e2-micro \
  --image-family debian-12 \
  --image-project debian-cloud \
  --boot-disk-size 10GB

echo
echo "Created $INSTANCE in $ZONE. Connect with:"
echo "  gcloud compute ssh $INSTANCE --zone $ZONE"
echo
echo "Delete it when you are finished, or it keeps billing:"
echo "  gcloud compute instances delete $INSTANCE --zone $ZONE"
